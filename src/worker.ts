import { Hono } from "hono"
import type { AcceptedAnswerWebhookResponse, PartialPostResponse } from "./types"

type Env = {
  CACHE: KVNamespace
  CANNED_ID: string
  DISCOURSE_TOKEN: string
  DISCOURSE_URL: string
  QUEUE: Queue<string>
}

const app = new Hono<{ Bindings: Env }>()

const discourseRequest = async (url: string, method: string, headersToMerge: Record<string, any>, body?: any) => {
  const headers = {
    'Content-type': 'application/json',
    ...headersToMerge
  }

  console.log(`Making ${method} request to ${url}`)

  try {
    const resp = await fetch(url, {
      method,
      headers,
      ...(method !== "GET" ? { body } : {})
    })

    return resp
  } catch (err: any) {
    return err
  }
}

const replyToThread = async (payload: any, env: Env, cannedResponse: string): Promise<void> => {
  const discourseUrl = env.DISCOURSE_URL
  const path = `posts.json`
  const url = [discourseUrl, path].join('/')

  const headers = {
    'Api-Key': env.DISCOURSE_TOKEN,
    'Api-Username': env.DISCOURSE_USER
  }

  const { topic, category } = payload

  const body = {
    category_id: parseInt(category),
    topic_id: parseInt(topic),
    raw: cannedResponse,
  }

  const resp = await discourseRequest(url, "POST", headers, JSON.stringify(body))
  console.log(resp)
  if (resp.ok) {
    console.log("OK")
  } else {
    const text = await resp.text()
    console.log("Something went wrong")
    console.log(text)
  }
}

const getCannedResponse = async (env: Env): Promise<string> => {
  console.log("Retrieving canned response")
  const expirationTtl = 60 * 60
  const cachedCanned = await env.CACHE.get("canned_response")

  if (cachedCanned) {
    console.log("Got cached response, returning")
    return cachedCanned
  } else {
    const cannedId = env.CANNED_ID
    const discourseUrl = env.DISCOURSE_URL

    const path = `posts/${cannedId}.json`
    const url = [discourseUrl, path].join('/')

    const headers = {
      'Api-Key': env.DISCOURSE_TOKEN,
      'Api-Username': env.DISCOURSE_USER
    }

    console.log("Making Discourse request for canned response")
    const resp = await discourseRequest(url, "GET", headers) as PartialPostResponse
    const json = await resp.json()

    console.log(`Got canned response: ${json.raw}`)

    console.log("Persisting in cache")
    await env.CACHE.put("canned_response", json.raw, { expirationTtl })

    console.log("Returning canned response")
    return json.raw
  }
}

app.get("/", c => c.text("ok :)"))

app.post("/webhooks/accepted_answer", async c => {
  try {
    console.log("Received request")
    const body: AcceptedAnswerWebhookResponse = await c.req.json()

    console.log("Parsed JSON")
    const payload = {
      category: body.solved.category_id,
      topic: body.solved.topic_id
    }

    await c.env.QUEUE.send(JSON.stringify(payload))
    console.log(`Sent to queue`)

    return c.text(":)")
  } catch (err: any) {
    return c.text(err.toString())
  }
})

const queue = async (batch: Array<string>, env: Env) => {
  console.log("Beginning to handle queue")
  const cannedResponse = await getCannedResponse(env)
  for (const message of batch.messages) {
    const body = JSON.parse(message.body)
    console.log(`Handling ${body.topic} in batch`)
    await replyToThread(body, env, cannedResponse)
  }
}

export default {
  fetch: app.fetch,
  queue
}
