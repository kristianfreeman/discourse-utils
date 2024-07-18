import type { FC } from 'hono/jsx'
import type { Env } from "./types"
import { Hono } from "hono"
import { acceptedAnswerWebhook, queue } from "./modules/auto_reply"

const app = new Hono<{ Bindings: Env }>()

const Layout: FC = (props) => {
  return (
    <html>
      <head>
        <title>Discourse Toolbots</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        />
      </head>
      <body>{props.children}</body>
    </html>
  )
}

const Home: FC<{}> = (props: {}) => {
  return (
    <Layout>
      <main className="container">
        <h1>Discourse Toolbots</h1>
        <form action="https://github.com/kristianfreeman/discourse-utils">
          <button type="submit">
            View on GitHub
          </button>
        </form>
      </main>
    </Layout>
  )
}

app.get('/', async c => {
  try {
    return c.html(<Home />)
  } catch (err) {
    return c.text(err.toString())
  }
})

app.post("/webhooks/accepted_answer", acceptedAnswerWebhook);

export default {
  fetch: app.fetch,
  queue
}
