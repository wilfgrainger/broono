import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ status: 'broono-api is active' })
})

export default app
