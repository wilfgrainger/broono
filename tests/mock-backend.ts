import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

interface Pet {
  id: string;
  user_id: string;
  name: string;
  status: string; // "egg" | "hatched"
  hunger: number;
  hydration: number;
  temperature: number;
  happiness: number;
  xp: number;
  coins: number;
  last_sync: number;
  inventory?: string[];
}

interface User {
  id: string;
  email: string;
  country: string;
  friends: string[];
}

let usersMap = new Map<string, User>();
let petsMap = new Map<string, Pet>();

const DECAY_RATES = {
  hunger: 0.0167,       // 1 unit per minute = 0.0167 / sec
  hydration: 0.0333,    // 2 units per minute = 0.0333 / sec
  happiness: 0.0167,    // 1 unit per minute = 0.0167 / sec
  temperature: 0.0083,  // 0.5 units per minute = 0.0083 / sec
};

function seedDefaultData() {
  const alice: User = { id: "alice_id", email: "alice@test.com", country: "US", friends: ["bob@test.com"] };
  const bob: User = { id: "bob_id", email: "bob@test.com", country: "US", friends: ["alice@test.com"] };
  const charlie: User = { id: "charlie_id", email: "charlie@test.com", country: "UK", friends: [] };

  usersMap.set(alice.email, alice);
  usersMap.set(bob.email, bob);
  usersMap.set(charlie.email, charlie);

  petsMap.set(alice.email, {
    id: "fluffy_id",
    user_id: "alice_id",
    name: "Fluffy",
    status: "hatched",
    hunger: 80,
    hydration: 70,
    temperature: 50,
    happiness: 90,
    xp: 100,
    coins: 1200,
    last_sync: Date.now(),
    inventory: []
  });

  petsMap.set(bob.email, {
    id: "rex_id",
    user_id: "bob_id",
    name: "Rex",
    status: "hatched",
    hunger: 60,
    hydration: 50,
    temperature: 50,
    happiness: 40,
    xp: 10,
    coins: 400,
    last_sync: Date.now(),
    inventory: []
  });

  petsMap.set(charlie.email, {
    id: "goldie_id",
    user_id: "charlie_id",
    name: "Goldie",
    status: "egg",
    hunger: 100,
    hydration: 100,
    temperature: 50,
    happiness: 100,
    xp: 0,
    coins: 100,
    last_sync: Date.now(),
    inventory: []
  });
}

function verifyToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  if (token === 'invalid_jwt_token') return null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
      return payload.email || null;
    }
  } catch (e) {}
  return token.includes('@') ? token : null;
}

app.post('/api/auth/mock', async (c) => {
  const { email, country } = await c.req.json();
  if (!email) return c.json({ error: 'Email required' }, 400);

  // Auto create user if not exists
  let user = usersMap.get(email);
  if (!user) {
    user = {
      id: email + "_id",
      email,
      country: country || 'US',
      friends: []
    };
    usersMap.set(email, user);
    petsMap.set(email, {
      id: email + "_pet_id",
      user_id: user.id,
      name: "Bubbles",
      status: "egg",
      hunger: 100,
      hydration: 100,
      temperature: 50,
      happiness: 100,
      xp: 0,
      coins: 100,
      last_sync: Date.now(),
      inventory: []
    });
  }

  // Generate mock JWT token
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ email, country: user.country })).toString('base64url');
  const token = `${header}.${payload}.signature`;

  return c.json({ token });
});

app.post('/api/pet/sync', async (c) => {
  const email = verifyToken(c.req.header('Authorization'));
  if (!email) return c.json({ error: 'Unauthorized' }, 401);

  const pet = petsMap.get(email);
  if (!pet) return c.json({ error: 'Pet not found' }, 404);

  const body = await c.req.json();
  const clientTime = body.client_time || Date.now();

  const elapsedSec = Math.max(0, (clientTime - pet.last_sync) / 1000);

  // Calculate decay on the server
  let expectedHunger = Math.max(0, pet.hunger - elapsedSec * DECAY_RATES.hunger);
  let expectedHydration = Math.max(0, pet.hydration - elapsedSec * DECAY_RATES.hydration);
  let expectedHappiness = Math.max(0, pet.happiness - elapsedSec * DECAY_RATES.happiness);
  let expectedTemp = pet.temperature;
  if (expectedTemp > 50) {
    expectedTemp = Math.max(50, expectedTemp - elapsedSec * DECAY_RATES.temperature);
  } else if (expectedTemp < 50) {
    expectedTemp = Math.min(50, expectedTemp + elapsedSec * DECAY_RATES.temperature);
  }

  // Apply actions
  const feedCount = body.feed_count || 0;
  const waterCount = body.water_count || 0;
  const playCount = body.play_count || 0;
  const coinGains = body.coin_gains || 0;

  expectedHunger = Math.min(100, expectedHunger + feedCount * 15);
  expectedHydration = Math.min(100, expectedHydration + waterCount * 10);
  expectedHappiness = Math.min(100, expectedHappiness + playCount * 20);

  let expectedCoins = pet.coins - (feedCount * 10 + waterCount * 5 + playCount * 5) + coinGains;
  let expectedXP = pet.xp + (feedCount * 10 + waterCount * 10 + playCount * 10);

  // Handle inventory purchases in sync if sent
  if (body.inventory) {
    pet.inventory = body.inventory;
  }

  // Handle hatching
  if (body.status === 'hatched' && pet.status === 'egg') {
    pet.status = 'hatched';
    pet.name = body.name || 'Bubbles';
  }

  // Anti-cheat verification
  const tolerance = 1.5;
  let cheatCorrected = false;

  if (body.hunger !== undefined && body.hunger > expectedHunger + tolerance) {
    cheatCorrected = true;
  }
  if (body.hydration !== undefined && body.hydration > expectedHydration + tolerance) {
    cheatCorrected = true;
  }
  if (body.happiness !== undefined && body.happiness > expectedHappiness + tolerance) {
    cheatCorrected = true;
  }
  if (body.coins !== undefined && body.coins > expectedCoins + tolerance) {
    cheatCorrected = true;
  }

  if (cheatCorrected) {
    // Correct back to server expected values
    pet.hunger = expectedHunger;
    pet.hydration = expectedHydration;
    pet.happiness = expectedHappiness;
    pet.temperature = expectedTemp;
    pet.coins = pet.coins - (feedCount * 10 + waterCount * 5 + playCount * 5); // deduct cost only
    pet.xp = expectedXP;
    pet.last_sync = clientTime;
  } else {
    // Accept client state
    pet.hunger = body.hunger !== undefined ? body.hunger : expectedHunger;
    pet.hydration = body.hydration !== undefined ? body.hydration : expectedHydration;
    pet.happiness = body.happiness !== undefined ? body.happiness : expectedHappiness;
    pet.temperature = body.temperature !== undefined ? body.temperature : expectedTemp;
    pet.coins = Math.max(pet.coins, body.coins !== undefined ? body.coins : expectedCoins);
    pet.xp = Math.max(pet.xp, body.xp !== undefined ? body.xp : expectedXP);
    pet.last_sync = clientTime;
  }

  petsMap.set(email, pet);

  return c.json({
    success: true,
    cheat_corrected: cheatCorrected,
    pet
  });
});

app.get('/api/leaderboard', (c) => {
  const email = verifyToken(c.req.header('Authorization'));
  if (!email) return c.json({ error: 'Unauthorized' }, 401);

  const user = usersMap.get(email);
  if (!user) return c.json({ error: 'User not found' }, 404);

  const allUsers = Array.from(usersMap.values());
  const mapToLeaderboard = (filteredUsers: User[]) => {
    return filteredUsers
      .map(u => {
        const p = petsMap.get(u.email);
        return {
          email: u.email,
          country: u.country,
          coins: p ? p.coins : 0,
        };
      })
      .sort((a, b) => b.coins - a.coins);
  };

  const globalList = mapToLeaderboard(allUsers);
  const countryList = mapToLeaderboard(allUsers.filter(u => u.country === user.country));
  const friendsEmails = new Set(user.friends || []);
  friendsEmails.add(email);
  const friendsList = mapToLeaderboard(allUsers.filter(u => friendsEmails.has(u.email)));

  return c.json({
    global: globalList,
    country: countryList,
    friends: friendsList,
  });
});

app.post('/__control/reset', (c) => {
  usersMap.clear();
  petsMap.clear();
  return c.json({ success: true });
});

app.post('/__control/seed_default', (c) => {
  seedDefaultData();
  return c.json({ success: true });
});

app.post('/__control/seed', async (c) => {
  const { seedUsers, seedPets } = await c.req.json();
  if (seedUsers) {
    for (const u of seedUsers) {
      usersMap.set(u.email, u);
    }
  }
  if (seedPets) {
    for (const p of seedPets) {
      // Find user to associate or use email as key
      const u = Array.from(usersMap.values()).find(user => user.id === p.user_id);
      const email = u ? u.email : p.user_id; // fallback
      petsMap.set(email, {
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        status: p.status,
        hunger: p.hunger,
        hydration: p.hydration,
        temperature: p.temperature,
        happiness: p.happiness,
        xp: p.xp,
        coins: p.coins,
        last_sync: p.last_sync || Date.now(),
        inventory: p.inventory || []
      });
    }
  }
  return c.json({ success: true });
});

const port = 3001;
console.log(`Mock backend starting on port ${port}...`);
serve({
  fetch: app.fetch,
  port,
});
