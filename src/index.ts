import { Hono } from "hono"
import { cors } from "hono/cors"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"

type Env = {
  TEST_NAMESPACE: KVNamespace
}

const app = new Hono<{ Bindings: Env }>()
app.use(
  "/*",
  cors({
    origin: "*",
  })
)

app.post(
  "/hello",
  // @xxx response.clone() issue maybe caused by zValidatior
  zValidator(
    "json",
    z.object({
      name: z.string(),
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { email, name } = c.req.valid("json")

    const existingUser = await c.env.TEST_NAMESPACE.get(email, "text")

    if (existingUser) {
      return c.json({
        message: "You have already been greeted",
      })
    }

    await c.env.TEST_NAMESPACE.put(email, name, {
      metadata: {
        name,
        email,
      },
    })

    return c.json({ message: "Hello" })
  }
)

export default app

// Generate a curl command to test the endpoint
// curl -X POST -H "Content-Type: application/json" -d '{"name":"John Doe","email":"matt@gmail.com"}' https://0.0.0.0:8787/hello
