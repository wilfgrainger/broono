import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  DB: D1Database;
};

type User = {
  id: string;
  email: string;
  country: string;
  friends_json: string | null;
};

type Pet = {
  id: string;
  user_id: string;
  name: string;
  status: "egg" | "hatched";
  hunger: number;
  hydration: number;
  temperature: number;
  happiness: number;
  xp: number;
  coins: number;
  last_sync: number;
};

type PetResponse = Pet & {
  inventory: string[];
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

const DECAY_RATES = {
  hunger: 0.0167,
  hydration: 0.0333,
  happiness: 0.0167,
  temperature: 0.0083,
};

const jsonHeaders = {
  "Content-Type": "application/json",
};

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

function createToken(email: string, country: string) {
  const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ email, country }));
  return `${header}.${payload}.signature`;
}

function verifyToken(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  if (token === "invalid_jwt_token") return null;

  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(base64UrlDecode(parts[1])) as { email?: string };
      return payload.email || null;
    }
  } catch {}

  return token.includes("@") ? token : null;
}

async function getUserByEmail(db: D1Database, email: string) {
  return db.prepare("SELECT * FROM User WHERE email = ?").bind(email).first<User>();
}

async function getPetByUserId(db: D1Database, userId: string) {
  return db.prepare("SELECT * FROM Pet WHERE user_id = ?").bind(userId).first<Pet>();
}

async function getInventory(db: D1Database, userId: string) {
  const result = await db.prepare("SELECT item_id FROM Inventory WHERE user_id = ? ORDER BY purchased_at").bind(userId).all<{ item_id: string }>();
  return result.results.map((row) => row.item_id);
}

async function saveInventory(db: D1Database, userId: string, inventory: string[]) {
  await db.prepare("DELETE FROM Inventory WHERE user_id = ?").bind(userId).run();

  for (const item of inventory) {
    await db
      .prepare("INSERT INTO Inventory (id, user_id, item_id, quantity, purchased_at) VALUES (?, ?, ?, 1, ?)")
      .bind(crypto.randomUUID(), userId, item, Date.now())
      .run();
  }
}

async function createUser(db: D1Database, email: string, country = "US") {
  const user: User = {
    id: crypto.randomUUID(),
    email,
    country,
    friends_json: "[]",
  };

  await db
    .prepare("INSERT INTO User (id, email, country, friends_json) VALUES (?, ?, ?, ?)")
    .bind(user.id, user.email, user.country, user.friends_json)
    .run();

  await db
    .prepare(
      `INSERT INTO Pet
        (id, user_id, name, status, hunger, hydration, temperature, happiness, xp, coins, last_sync)
       VALUES (?, ?, 'Bubbles', 'egg', 100, 100, 50, 100, 0, 100, ?)`,
    )
    .bind(crypto.randomUUID(), user.id, Date.now())
    .run();

  return user;
}

async function getPetResponse(db: D1Database, userId: string) {
  const pet = await getPetByUserId(db, userId);
  if (!pet) return null;

  return {
    ...pet,
    inventory: await getInventory(db, userId),
  };
}

async function requireUser(db: D1Database, authHeader: string | undefined) {
  const email = verifyToken(authHeader);
  if (!email) return null;

  const user = await getUserByEmail(db, email);
  return user || null;
}

function applyDecay(pet: Pet, clientTime: number) {
  const elapsedSec = Math.max(0, (clientTime - pet.last_sync) / 1000);

  let temperature = pet.temperature;
  if (temperature > 50) {
    temperature = Math.max(50, temperature - elapsedSec * DECAY_RATES.temperature);
  } else if (temperature < 50) {
    temperature = Math.min(50, temperature + elapsedSec * DECAY_RATES.temperature);
  }

  return {
    hunger: Math.max(0, pet.hunger - elapsedSec * DECAY_RATES.hunger),
    hydration: Math.max(0, pet.hydration - elapsedSec * DECAY_RATES.hydration),
    happiness: Math.max(0, pet.happiness - elapsedSec * DECAY_RATES.happiness),
    temperature,
  };
}

async function savePet(db: D1Database, pet: PetResponse) {
  await db
    .prepare(
      `UPDATE Pet
       SET name = ?, status = ?, hunger = ?, hydration = ?, temperature = ?, happiness = ?, xp = ?, coins = ?, last_sync = ?
       WHERE id = ?`,
    )
    .bind(
      pet.name,
      pet.status,
      pet.hunger,
      pet.hydration,
      pet.temperature,
      pet.happiness,
      pet.xp,
      pet.coins,
      pet.last_sync,
      pet.id,
    )
    .run();

  await saveInventory(db, pet.user_id, pet.inventory || []);
}

app.get("/api/hello", (c) => c.json({ message: "Hello World" }));

app.post("/api/auth/mock", async (c) => {
  const body = await c.req.json<{ email?: string; country?: string }>();
  const email = body.email?.trim().toLowerCase();
  if (!email) return c.json({ error: "Email required" }, 400);

  let user = await getUserByEmail(c.env.DB, email);
  if (!user) {
    user = await createUser(c.env.DB, email, body.country || "US");
  }

  return c.json({ token: createToken(user.email, user.country) });
});

app.post("/api/pet/sync", async (c) => {
  const user = await requireUser(c.env.DB, c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const savedPet = await getPetResponse(c.env.DB, user.id);
  if (!savedPet) return c.json({ error: "Pet not found" }, 404);

  const body = await c.req.json<Partial<PetResponse> & {
    feed_count?: number;
    water_count?: number;
    play_count?: number;
    coin_gains?: number;
    shop_spend?: number;
    client_time?: number;
  }>();
  const clientTime = body.client_time || Date.now();
  const decayed = applyDecay(savedPet, clientTime);

  const feedCount = body.feed_count || 0;
  const waterCount = body.water_count || 0;
  const playCount = body.play_count || 0;
  const coinGains = body.coin_gains || 0;
  const shopSpend = body.shop_spend || 0;

  const expectedHunger = Math.min(100, decayed.hunger + feedCount * 15);
  const expectedHydration = Math.min(100, decayed.hydration + waterCount * 10);
  const expectedHappiness = Math.min(100, decayed.happiness + playCount * 20);
  const expectedCoins = savedPet.coins - (feedCount * 10 + waterCount * 5 + playCount * 5 + shopSpend) + coinGains;
  const expectedXP = savedPet.xp + (feedCount * 10 + waterCount * 10 + playCount * 10);
  const tolerance = 1.5;
  const hasAuthoritativeDeviceProgress =
    (feedCount > 0 || waterCount > 0 || playCount > 0 || coinGains > 0) &&
    body.xp !== undefined &&
    body.xp > expectedXP + tolerance &&
    body.coins !== undefined &&
    body.coins > expectedCoins + tolerance;

  const cheatCorrected =
    (body.hunger !== undefined && body.hunger > expectedHunger + tolerance) ||
    (body.hydration !== undefined && body.hydration > expectedHydration + tolerance) ||
    (body.happiness !== undefined && body.happiness > expectedHappiness + tolerance) ||
    (!hasAuthoritativeDeviceProgress && body.coins !== undefined && body.coins > expectedCoins + tolerance);

  const hasLocalSpend = feedCount > 0 || waterCount > 0 || playCount > 0 || shopSpend > 0;
  const mergedCoins = body.coins !== undefined
    ? (hasLocalSpend ? body.coins : Math.max(expectedCoins, body.coins))
    : expectedCoins;

  const nextPet: PetResponse = {
    ...savedPet,
    hunger: cheatCorrected ? expectedHunger : body.hunger ?? expectedHunger,
    hydration: cheatCorrected ? expectedHydration : body.hydration ?? expectedHydration,
    happiness: cheatCorrected ? expectedHappiness : body.happiness ?? expectedHappiness,
    temperature: cheatCorrected ? decayed.temperature : body.temperature ?? decayed.temperature,
    coins: cheatCorrected ? expectedCoins : mergedCoins,
    xp: body.xp !== undefined ? Math.max(expectedXP, body.xp) : expectedXP,
    inventory: body.inventory || savedPet.inventory || [],
    last_sync: clientTime,
  };

  if (body.status === "hatched" && savedPet.status === "egg" && savedPet.xp >= 50) {
    nextPet.status = "hatched";
    nextPet.name = body.name?.trim() || "Bubbles";
  }

  await savePet(c.env.DB, nextPet);

  return c.json({
    success: true,
    cheat_corrected: cheatCorrected,
    pet: nextPet,
  });
});

app.get("/api/leaderboard", async (c) => {
  const user = await requireUser(c.env.DB, c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const result = await c.env.DB
    .prepare(
      `SELECT User.email, User.country, COALESCE(Pet.coins, 0) AS coins
       FROM User
       LEFT JOIN Pet ON Pet.user_id = User.id
       ORDER BY coins DESC`,
    )
    .all<{ email: string; country: string; coins: number }>();

  const allUsers = result.results;
  const friends = new Set<string>(JSON.parse(user.friends_json || "[]") as string[]);
  friends.add(user.email);

  return c.json({
    global: allUsers,
    country: allUsers.filter((row) => row.country === user.country),
    friends: allUsers.filter((row) => friends.has(row.email)),
  });
});

app.notFound(() => new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: jsonHeaders }));

export default app;
