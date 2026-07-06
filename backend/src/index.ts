import { Hono } from "hono";

type Bindings = {
  PET_STATE_CACHE: KVNamespace;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/hello", (c) => {
  return c.json({ message: "Hello World" });
});

export default app;
