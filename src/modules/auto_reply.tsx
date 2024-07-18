import type { AcceptedAnswerWebhookResponse, Env, PartialPostResponse } from "../types"
import { discourseRequest } from "../utils"

const replaceParamsInResponse = (message, params) => {
  let newMessage = message
  for (const key of Object.keys(params)) {
    newMessage = newMessage.replace(`{${key}}`, params[key])
  }
  return newMessage
}

const sendFollowupMessage = async (payload: any, env: Env, cannedResponse: string): Promise<void> => {
  const discourseUrl = env.DISCOURSE_URL
  const path = `posts.json`
  const url = [discourseUrl, path].join('/')

  const headers = {
    'Api-Key': env.DISCOURSE_TOKEN,
    'Api-Username': env.DISCOURSE_USER
  }

  const { post_number: post, topic_id: topic, category_id: category } = payload

  const opUrl = [discourseUrl, `t/${topic}.json`].join('/')
  const opResp = await discourseRequest(opUrl, "GET", headers, env)
  const opJson = await opResp.json()
  const username = opJson?.details?.created_by?.username
  const originalPoster = username ? `@${username}` : "there"

  if (username === payload.username) {
    console.log("User marked their own answer as the solution, skipping.")
    return
  }

  const link = `${discourseUrl}/t/${topic}/${post}`

  const parameterizedResponse = replaceParamsInResponse(cannedResponse, {
    original_poster: originalPoster,
    "has a solution here": `[has a solution here](${link})`
  })

  const body = {
    archetype: "private_message",
    auto_lock_pm: true,
    target_recipients: username,
    raw: parameterizedResponse,
    title: "Someone has answered your topic"
  }

  const resp = await discourseRequest(url, "POST", headers, JSON.stringify(body), env)
  if (resp.ok) {
    console.log("OK")
  } else {
    console.log("Something went wrong")
  }

  return resp
}

const getCannedResponse = async (env: Env): Promise<string> => {
  console.log("Retrieving canned response")
  try {
    const cannedId = env.CANNED_ID
    const discourseUrl = env.DISCOURSE_URL

    const path = `posts/${cannedId}.json`
    const url = [discourseUrl, path].join('/')

    const headers = {
      'Api-Key': env.DISCOURSE_TOKEN,
      'Api-Username': env.DISCOURSE_USER
    }

    console.log("Making Discourse request for canned response")
    const resp = await discourseRequest(url, "GET", headers, env) as PartialPostResponse
    const json = await resp.json()

    const { raw } = json

    console.log(`Got canned message: ${raw}`)

    console.log("Returning canned response")
    return raw
  } catch (err) {
    console.log("Something went wrong retrieving the canned response, returning default")
    return env.DEFAULT_RESPONSE
  }
}

const acceptedAnswerWebhook = async c => {
  try {
    console.log("Received request")
    const body: AcceptedAnswerWebhookResponse = await c.req.json()

    await c.env.QUEUE.send(JSON.stringify(body.solved))
    console.log(`Sent to queue`)

    return c.text(":)")
  } catch (err: any) {
    return c.text(err.toString())
  }
}

const queue = async (batch: Array<string>, env: Env) => {
  console.log("Beginning to handle queue")
  const cannedResponse = await getCannedResponse(env)
  for (const message of batch.messages) {
    const body = JSON.parse(message.body)
    console.log(`Handling ${body.topic_id} in batch`)
    await sendFollowupMessage(body, env, cannedResponse)
  }
}

export {
  acceptedAnswerWebhook,
  queue,  
}
