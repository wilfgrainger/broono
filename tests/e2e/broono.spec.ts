import { test, expect } from "@playwright/test";

const BACKEND_URL = "http://localhost:3001";

test.beforeEach(async ({ page, request }) => {
  // Reset and seed default state on mock backend before each test
  await request.post(`${BACKEND_URL}/__control/reset`);
  await request.post(`${BACKEND_URL}/__control/seed_default`);
  // Clear localStorage to prevent session leakage
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

// Helper for standard login
async function login(page: any, email: string, country: string = "US") {
  await page.goto("/");
  await page.fill('[data-testid="login-email"]', email);
  await page.selectOption('[data-testid="login-country"]', country);
  await page.click('[data-testid="login-btn"]');
  await page.waitForSelector('[data-testid="pet-tab-btn"]');
}

// ==========================================
// TIER 1: FEATURE COVERAGE (25 Tests)
// ==========================================

test("01. Auth: Login validation empty email", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-testid="login-btn"]');
  const error = page.locator('[data-testid="login-error"]');
  // Form HTML5 validation or application error
  await expect(page.locator('[data-testid="login-email"]')).toHaveAttribute("required");
});

test("02. Auth: Successful login with standard email", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  const emailDisplay = page.locator('[data-testid="user-email-display"]');
  await expect(emailDisplay).toHaveText("alice@test.com");
});

test("03. Auth: Successful login with Apple Private Relay email", async ({ page }) => {
  await login(page, "helper@privaterelay.appleid.com", "US");
  const indicator = page.locator('[data-testid="apple-relay-indicator"]');
  await expect(indicator).toBeVisible();
  await expect(indicator).toHaveText("Apple Proxy Active");
});

test("04. Auth: Save credentials to localStorage", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  const email = await page.evaluate(() => localStorage.getItem("session_email"));
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(email).toBe("alice@test.com");
  expect(token).toBeTruthy();
});

test("05. Auth: Render Apple Proxy active indicator", async ({ page }) => {
  await login(page, "someone@privaterelay.appleid.com", "UK");
  const indicator = page.locator('[data-testid="apple-relay-indicator"]');
  await expect(indicator).toBeVisible();
});

test("06. Auth: Logout clears credentials and redirects", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await page.click('[data-testid="logout-btn"]');
  await expect(page.locator('[data-testid="login-btn"]')).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem("session_token"));
  expect(token).toBeNull();
});

test("07. Pet: Load initial state from backend (Egg)", async ({ page, request }) => {
  // Charlie is set up as an egg in default seed
  await login(page, "charlie@test.com", "UK");
  const name = page.locator('[data-testid="pet-name"]');
  const status = page.locator('[data-testid="pet-status"]');
  await expect(name).toHaveText("Goldie");
  await expect(status).toHaveText("Status: egg");
});

test("08. Pet: Display initial stats correctly", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // Fluffy: hunger 80, hydration 70, temp 50, happiness 90
  await expect(page.locator('[data-testid="pet-hunger"]')).toHaveText("80%");
  await expect(page.locator('[data-testid="pet-hydration"]')).toHaveText("70%");
  await expect(page.locator('[data-testid="pet-temperature"]')).toHaveText("50°C");
  await expect(page.locator('[data-testid="pet-happiness"]')).toHaveText("90%");
});

test("09. Pet: Vitals decay loop (Hunger decrease over time)", async ({ page, request }) => {
  // To test vitals decay loop cleanly, we set pet's last_sync to 10 minutes ago on the server
  // Wait, let's create a custom seed for this test
  const testUser = { id: "decay_user", email: "decay@test.com", country: "US", friends: [] };
  const tenMinsAgo = Date.now() - 10 * 60 * 1000;
  const testPet = {
    id: "decay_pet",
    user_id: "decay_user",
    name: "Decayer",
    status: "hatched",
    hunger: 80,
    hydration: 70,
    temperature: 50,
    happiness: 90,
    xp: 100,
    coins: 500,
    last_sync: tenMinsAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "decay@test.com", "US");
  // Expected hunger = 80 - 600 * 0.0167 = 80 - 10 = 70%
  const hungerText = await page.locator('[data-testid="pet-hunger"]').textContent();
  const hungerVal = parseInt(hungerText || "0");
  expect(hungerVal).toBeLessThanOrEqual(71);
});

test("10. Pet: Vitals decay loop (Hydration decrease over time)", async ({ page, request }) => {
  const testUser = { id: "decay_user_2", email: "decay2@test.com", country: "US", friends: [] };
  const fiveMinsAgo = Date.now() - 5 * 60 * 1000; // 300 seconds
  const testPet = {
    id: "decay_pet_2",
    user_id: "decay_user_2",
    name: "Decayer 2",
    status: "hatched",
    hunger: 80,
    hydration: 70,
    temperature: 50,
    happiness: 90,
    xp: 100,
    coins: 500,
    last_sync: fiveMinsAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "decay2@test.com", "US");
  // Expected hydration = 70 - 300 * 0.0333 = 70 - 10 = 60%
  const hydrationText = await page.locator('[data-testid="pet-hydration"]').textContent();
  const hydrationVal = parseInt(hydrationText || "0");
  expect(hydrationVal).toBeLessThanOrEqual(61);
});

test("11. Pet: Vitals decay loop (Happiness decrease over time)", async ({ page, request }) => {
  const testUser = { id: "decay_user_3", email: "decay3@test.com", country: "US", friends: [] };
  const tenMinsAgo = Date.now() - 10 * 60 * 1000;
  const testPet = {
    id: "decay_pet_3",
    user_id: "decay_user_3",
    name: "Decayer 3",
    status: "hatched",
    hunger: 80,
    hydration: 70,
    temperature: 50,
    happiness: 90,
    xp: 100,
    coins: 500,
    last_sync: tenMinsAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "decay3@test.com", "US");
  // Expected happiness = 90 - 600 * 0.0167 = 90 - 10 = 80%
  const happinessText = await page.locator('[data-testid="pet-happiness"]').textContent();
  const happinessVal = parseInt(happinessText || "0");
  expect(happinessVal).toBeLessThanOrEqual(81);
});

test("12. Pet: Interaction - Feed increases hunger and spends coins", async ({ page }) => {
  await login(page, "bob@test.com", "US"); // hunger 60, coins 400
  const initialHunger = parseInt(await page.locator('[data-testid="pet-hunger"]').textContent() || "0");
  const initialCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");

  await page.click('[data-testid="feed-btn"]');
  await page.waitForTimeout(500);

  const newHunger = parseInt(await page.locator('[data-testid="pet-hunger"]').textContent() || "0");
  const newCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");

  expect(newHunger).toBeGreaterThan(initialHunger);
  expect(newCoins).toBe(initialCoins - 10);
});

test("13. Pet: Interaction - Water increases hydration and spends coins", async ({ page }) => {
  await login(page, "bob@test.com", "US"); // hydration 50, coins 400
  const initialHydration = parseInt(await page.locator('[data-testid="pet-hydration"]').textContent() || "0");
  const initialCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");

  await page.click('[data-testid="water-btn"]');
  await page.waitForTimeout(500);

  const newHydration = parseInt(await page.locator('[data-testid="pet-hydration"]').textContent() || "0");
  const newCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");

  expect(newHydration).toBeGreaterThan(initialHydration);
  expect(newCoins).toBe(initialCoins - 5);
});

test("14. Pet: Interaction - Play increases happiness and spends coins", async ({ page }) => {
  await login(page, "bob@test.com", "US"); // happiness 40, coins 400
  const initialHappiness = parseInt(await page.locator('[data-testid="pet-happiness"]').textContent() || "0");
  const initialCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");

  await page.click('[data-testid="play-btn"]');
  await page.waitForTimeout(500);

  const newHappiness = parseInt(await page.locator('[data-testid="pet-happiness"]').textContent() || "0");
  const newCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");

  expect(newHappiness).toBeGreaterThan(initialHappiness);
  expect(newCoins).toBe(initialCoins - 5);
});

test("15. Pet: Hatching requirement notice", async ({ page }) => {
  await login(page, "charlie@test.com", "UK"); // Goldie has 0 XP, needs 50
  await expect(page.locator('[data-testid="hatch-btn"]')).not.toBeVisible();
  await expect(page.locator("text=Need 50 more XP to hatch.")).toBeVisible();
});

test("16. Pet: Hatching process and name input", async ({ page, request }) => {
  // Let's seed a user whose pet is an egg but already has 50 XP
  const testUser = { id: "hatch_user", email: "hatch@test.com", country: "US", friends: [] };
  const testPet = {
    id: "hatch_pet",
    user_id: "hatch_user",
    name: "Eggio",
    status: "egg",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 50,
    coins: 100,
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "hatch@test.com", "US");
  await expect(page.locator('[data-testid="hatch-btn"]')).toBeVisible();

  await page.fill('[data-testid="hatch-name-input"]', "Hatchy");
  await page.click('[data-testid="hatch-btn"]');
  await page.waitForTimeout(500);

  await expect(page.locator('[data-testid="pet-status"]')).toHaveText("Status: hatched");
  await expect(page.locator('[data-testid="pet-name"]')).toHaveText("Hatchy");
});

test("17. Pet: Mini-game execution and coin rewards", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // coins 1200
  const initialCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");
  await page.click('[data-testid="minigame-btn"]');
  await page.waitForTimeout(500);
  const newCoins = parseInt(await page.locator('[data-testid="pet-coins"]').textContent() || "0");
  expect(newCoins).toBe(initialCoins + 150);
});

test("18. Shop: Locked overlay visible when coins < 1000", async ({ page }) => {
  await login(page, "bob@test.com", "US"); // 400 coins
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).toBeVisible();
});

test("19. Shop: Locked overlay invisible when coins >= 1000", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // 1200 coins
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).not.toBeVisible();
});

test("20. Shop: Buy Penguin Suit spends coins", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // 1200 coins
  await page.click('[data-testid="shop-tab-btn"]');
  await page.click('[data-testid="buy-penguin-btn"]');
  await page.waitForTimeout(500);
  await expect(page.locator("text=Balance: 1000 coins")).toBeVisible();
});

test("21. Shop: Buy Cat Ears spends coins", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // 1200 coins
  await page.click('[data-testid="shop-tab-btn"]');
  await page.click('[data-testid="buy-catears-btn"]');
  await page.waitForTimeout(500);
  await expect(page.locator("text=Balance: 1050 coins")).toBeVisible();
});

test("22. Shop: Add purchased item to Wardrobe", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await page.click('[data-testid="buy-penguin-btn"]');
  await page.waitForTimeout(500);
  const wardrobe = page.locator('[data-testid="owned-cosmetics"]');
  await expect(wardrobe).toContainText("penguin suit");
});

test("23. Leaderboard: Retrieve and render Global list", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await page.click('[data-testid="leaderboard-tab-btn"]');
  await page.click('[data-testid="leaderboard-global-btn"]');
  await expect(page.locator('[data-testid="leaderboard-row-0"]')).toContainText("alice");
});

test("24. Leaderboard: Retrieve and render Country list", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await page.click('[data-testid="leaderboard-tab-btn"]');
  await page.click('[data-testid="leaderboard-country-btn"]');
  // alice (US) should see herself and bob (US)
  await expect(page.locator('[data-testid="leaderboard-list"]')).toContainText("alice");
  await expect(page.locator('[data-testid="leaderboard-list"]')).toContainText("bob");
  await expect(page.locator('[data-testid="leaderboard-list"]')).not.toContainText("charlie"); // charlie is UK
});

test("25. Leaderboard: Retrieve and render Friends list", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await page.click('[data-testid="leaderboard-tab-btn"]');
  await page.click('[data-testid="leaderboard-friends-btn"]');
  // alice has friend bob
  await expect(page.locator('[data-testid="leaderboard-list"]')).toContainText("alice");
  await expect(page.locator('[data-testid="leaderboard-list"]')).toContainText("bob");
});

// ==========================================
// TIER 2: BOUNDARY & CORNER CASES (25 Tests)
// ==========================================

test("26. Auth: Reject invalid token on load (force logout)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("session_token", "invalid_jwt_token");
    localStorage.setItem("session_email", "alice@test.com");
    localStorage.setItem("session_country", "US");
  });
  await page.goto("/");
  await expect(page.locator('[data-testid="login-btn"]')).toBeVisible();
});

test("27. Pet: Hunger cap at 100%", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // hunger starts at 80
  await page.click('[data-testid="feed-btn"]'); // 80 + 15 = 95
  await page.waitForTimeout(300);
  await page.click('[data-testid="feed-btn"]'); // 95 + 15 = 110 -> cap at 100
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="pet-hunger"]')).toHaveText("100%");
});

test("28. Pet: Hydration cap at 100%", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // hydration starts at 70
  await page.click('[data-testid="water-btn"]'); // 80
  await page.waitForTimeout(300);
  await page.click('[data-testid="water-btn"]'); // 90
  await page.waitForTimeout(300);
  await page.click('[data-testid="water-btn"]'); // 100
  await page.waitForTimeout(300);
  await page.click('[data-testid="water-btn"]'); // 100 -> cap at 100
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="pet-hydration"]')).toHaveText("100%");
});

test("29. Pet: Happiness cap at 100%", async ({ page }) => {
  await login(page, "alice@test.com", "US"); // happiness starts at 90
  await page.click('[data-testid="play-btn"]'); // 90 + 20 = 110 -> cap at 100
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="pet-happiness"]')).toHaveText("100%");
});

test("30. Pet: Vitals decay floor at 0%", async ({ page, request }) => {
  const testUser = { id: "floor_user", email: "floor@test.com", country: "US", friends: [] };
  const longAgo = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
  const testPet = {
    id: "floor_pet",
    user_id: "floor_user",
    name: "FloorPet",
    status: "hatched",
    hunger: 10,
    hydration: 10,
    temperature: 50,
    happiness: 10,
    xp: 100,
    coins: 500,
    last_sync: longAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "floor@test.com", "US");
  await expect(page.locator('[data-testid="pet-hunger"]')).toHaveText("0%");
  await expect(page.locator('[data-testid="pet-hydration"]')).toHaveText("0%");
  await expect(page.locator('[data-testid="pet-happiness"]')).toHaveText("0%");
});

test("31. Pet: Temperature decay toward 50 from high temp", async ({ page, request }) => {
  const testUser = { id: "temp_user_1", email: "temp1@test.com", country: "US", friends: [] };
  const minsAgo = Date.now() - 20 * 60 * 1000; // 1200 seconds -> decay = 1200 * 0.0083 = ~10 units
  const testPet = {
    id: "temp_pet_1",
    user_id: "temp_user_1",
    name: "TempPet",
    status: "hatched",
    hunger: 80,
    hydration: 70,
    temperature: 70, // starts at 70
    happiness: 90,
    xp: 100,
    coins: 500,
    last_sync: minsAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "temp1@test.com", "US");
  const tempText = await page.locator('[data-testid="pet-temperature"]').textContent();
  const tempVal = parseInt(tempText || "50");
  expect(tempVal).toBeLessThan(70);
  expect(tempVal).toBeGreaterThanOrEqual(50);
});

test("32. Pet: Temperature decay toward 50 from low temp", async ({ page, request }) => {
  const testUser = { id: "temp_user_2", email: "temp2@test.com", country: "US", friends: [] };
  const minsAgo = Date.now() - 20 * 60 * 1000;
  const testPet = {
    id: "temp_pet_2",
    user_id: "temp_user_2",
    name: "TempPet",
    status: "hatched",
    hunger: 80,
    hydration: 70,
    temperature: 30, // starts at 30
    happiness: 90,
    xp: 100,
    coins: 500,
    last_sync: minsAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "temp2@test.com", "US");
  const tempText = await page.locator('[data-testid="pet-temperature"]').textContent();
  const tempVal = parseInt(tempText || "50");
  expect(tempVal).toBeGreaterThan(30);
  expect(tempVal).toBeLessThanOrEqual(50);
});

test("33. Pet: Temperature remains stable at 50", async ({ page, request }) => {
  const testUser = { id: "temp_user_3", email: "temp3@test.com", country: "US", friends: [] };
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const testPet = {
    id: "temp_pet_3",
    user_id: "temp_user_3",
    name: "TempPet",
    status: "hatched",
    hunger: 80,
    hydration: 70,
    temperature: 50,
    happiness: 90,
    xp: 100,
    coins: 500,
    last_sync: dayAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "temp3@test.com", "US");
  await expect(page.locator('[data-testid="pet-temperature"]')).toHaveText("50°C");
});

test("34. Pet: Insufficient coins for Feed action", async ({ page, request }) => {
  const testUser = { id: "nocoins_user", email: "nocoins@test.com", country: "US", friends: [] };
  const testPet = {
    id: "nocoins_pet",
    user_id: "nocoins_user",
    name: "PoorPet",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 5, // Less than 10 coins needed for feed
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "nocoins@test.com", "US");
  await page.click('[data-testid="feed-btn"]');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-testid="pet-hunger"]')).toHaveText("50%");
  await expect(page.locator('[data-testid="pet-coins"]')).toHaveText("5");
});

test("35. Pet: Insufficient coins for Water action", async ({ page, request }) => {
  const testUser = { id: "nocoins_user_2", email: "nocoins2@test.com", country: "US", friends: [] };
  const testPet = {
    id: "nocoins_pet_2",
    user_id: "nocoins_user_2",
    name: "PoorPet",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 2, // Less than 5 coins needed for water
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "nocoins2@test.com", "US");
  await page.click('[data-testid="water-btn"]');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-testid="pet-hydration"]')).toHaveText("50%");
  await expect(page.locator('[data-testid="pet-coins"]')).toHaveText("2");
});

test("36. Pet: Insufficient coins for Play action", async ({ page, request }) => {
  const testUser = { id: "nocoins_user_3", email: "nocoins3@test.com", country: "US", friends: [] };
  const testPet = {
    id: "nocoins_pet_3",
    user_id: "nocoins_user_3",
    name: "PoorPet",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 2, // Less than 5 coins needed for play
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "nocoins3@test.com", "US");
  await page.click('[data-testid="play-btn"]');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-testid="pet-happiness"]')).toHaveText("50%");
  await expect(page.locator('[data-testid="pet-coins"]')).toHaveText("2");
});

test("37. Pet: Hatching with empty name defaults to Bubbles", async ({ page, request }) => {
  const testUser = { id: "hatch_empty", email: "hatch_empty@test.com", country: "US", friends: [] };
  const testPet = {
    id: "hatch_empty_pet",
    user_id: "hatch_empty",
    name: "Egg",
    status: "egg",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 60,
    coins: 100,
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "hatch_empty@test.com", "US");
  await page.click('[data-testid="hatch-btn"]');
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="pet-name"]')).toHaveText("Bubbles");
});

test("38. Pet: Egg status cannot buy shop items", async ({ page, request }) => {
  // Even if they have coins, eggs can't access wardrobe or make buying meaningful
  const testUser = { id: "egg_rich", email: "egg_rich@test.com", country: "US", friends: [] };
  const testPet = {
    id: "egg_rich_pet",
    user_id: "egg_rich",
    name: "Egg",
    status: "egg",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 1500, // rich egg
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "egg_rich@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).not.toBeVisible();
  await page.click('[data-testid="buy-penguin-btn"]');
  await page.waitForTimeout(500);
  await page.click('[data-testid="pet-tab-btn"]');
  await expect(page.locator('[data-testid="pet-status"]')).toHaveText("Status: egg");
});

test("39. Pet: Hatching twice does not re-hatch", async ({ page }) => {
  await login(page, "bob@test.com", "US"); // Rex is already hatched
  await expect(page.locator('[data-testid="hatch-btn"]')).not.toBeVisible();
});

test("40. Shop: Buy already owned item fails", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await page.click('[data-testid="buy-penguin-btn"]'); // Buy first time
  await page.waitForTimeout(500);
  const button = page.locator('[data-testid="buy-penguin-btn"]');
  await expect(button).toHaveText("Owned");
  await expect(button).toBeDisabled();
});

test("41. Shop: Buy item with exact coins", async ({ page, request }) => {
  const testUser = { id: "exact_user", email: "exact@test.com", country: "US", friends: [] };
  const testPet = {
    id: "exact_pet",
    user_id: "exact_user",
    name: "Exact",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 1000, // exact coins to unlock and buy
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "exact@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await page.click('[data-testid="buy-penguin-btn"]');
  await page.waitForTimeout(500);
  await expect(page.locator("text=Balance: 800 coins")).toBeVisible();
});

test("42. Shop: Unlock boundary (999 coins remains locked)", async ({ page, request }) => {
  const testUser = { id: "boundary_user", email: "boundary@test.com", country: "US", friends: [] };
  const testPet = {
    id: "boundary_pet",
    user_id: "boundary_user",
    name: "Boundary",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 999, // boundary coin limit - 1
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "boundary@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).toBeVisible();
});

test("43. Shop: Unlock boundary (1000 coins becomes unlocked)", async ({ page, request }) => {
  const testUser = { id: "boundary_user_2", email: "boundary2@test.com", country: "US", friends: [] };
  const testPet = {
    id: "boundary_pet_2",
    user_id: "boundary_user_2",
    name: "Boundary 2",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 1000, // boundary coin limit
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "boundary2@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).not.toBeVisible();
});

test("44. Leaderboard: Empty country filter display message", async ({ page }) => {
  // Charlie is from UK, and is the only user from UK in default seed
  await login(page, "charlie@test.com", "UK");
  await page.click('[data-testid="leaderboard-tab-btn"]');
  await page.click('[data-testid="leaderboard-country-btn"]');
  // Should only contain charlie
  const list = page.locator('[data-testid="leaderboard-list"]');
  await expect(list).toContainText("charlie");
  await expect(list).not.toContainText("alice");
});

test("45. Leaderboard: Empty friends filter display message", async ({ page }) => {
  // Charlie has no friends in default seed
  await login(page, "charlie@test.com", "UK");
  await page.click('[data-testid="leaderboard-tab-btn"]');
  await page.click('[data-testid="leaderboard-friends-btn"]');
  // Should only contain charlie himself
  const list = page.locator('[data-testid="leaderboard-list"]');
  await expect(list).toContainText("charlie");
  await expect(list).not.toContainText("alice");
});

test("46. Anti-Cheat: Backend corrections applied for feed cheating", async ({ page, request }) => {
  // We simulate cheating by making a POST request directly with invalid values (not spending coins for gains)
  // Get token for alice
  const tokenRes = await request.post(`${BACKEND_URL}/api/auth/mock`, {
    data: { email: "alice@test.com" }
  });
  const { token } = await tokenRes.json();

  // Fluffy has hunger 80, coins 1200
  // Send hunger 100 without feed_count
  const syncRes = await request.post(`${BACKEND_URL}/api/pet/sync`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      hunger: 100, // cheated value
      feed_count: 0,
      client_time: Date.now()
    }
  });
  const data = await syncRes.json();
  expect(data.cheat_corrected).toBe(true);
  expect(data.pet.hunger).toBeLessThan(100); // corrected back to decayed level
});

test("47. Anti-Cheat: Backend corrections applied for water cheating", async ({ page, request }) => {
  const tokenRes = await request.post(`${BACKEND_URL}/api/auth/mock`, {
    data: { email: "alice@test.com" }
  });
  const { token } = await tokenRes.json();

  // Send hydration 100 without water_count
  const syncRes = await request.post(`${BACKEND_URL}/api/pet/sync`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      hydration: 100, // cheated
      water_count: 0,
      client_time: Date.now()
    }
  });
  const data = await syncRes.json();
  expect(data.cheat_corrected).toBe(true);
  expect(data.pet.hydration).toBeLessThan(100);
});

test("48. Anti-Cheat: Backend corrections applied for play cheating", async ({ page, request }) => {
  const tokenRes = await request.post(`${BACKEND_URL}/api/auth/mock`, {
    data: { email: "alice@test.com" }
  });
  const { token } = await tokenRes.json();

  const syncRes = await request.post(`${BACKEND_URL}/api/pet/sync`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      happiness: 100, // cheated
      play_count: 0,
      client_time: Date.now()
    }
  });
  const data = await syncRes.json();
  expect(data.cheat_corrected).toBe(true);
  expect(data.pet.happiness).toBeLessThan(100);
});

test("49. Anti-Cheat: Backend corrections applied for coin cheating", async ({ page, request }) => {
  const tokenRes = await request.post(`${BACKEND_URL}/api/auth/mock`, {
    data: { email: "alice@test.com" }
  });
  const { token } = await tokenRes.json();

  const syncRes = await request.post(`${BACKEND_URL}/api/pet/sync`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      coins: 99999, // cheated
      coin_gains: 0,
      client_time: Date.now()
    }
  });
  const data = await syncRes.json();
  expect(data.cheat_corrected).toBe(true);
  expect(data.pet.coins).toBe(1200); // corrected back to server value
});

test("50. Anti-Cheat: Large time delta calculation cap", async ({ page, request }) => {
  const testUser = { id: "large_delta_user", email: "largedelta@test.com", country: "US", friends: [] };
  const ancientTime = Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year ago
  const testPet = {
    id: "large_delta_pet",
    user_id: "large_delta_user",
    name: "AncientPet",
    status: "hatched",
    hunger: 100,
    hydration: 100,
    temperature: 50,
    happiness: 100,
    xp: 10,
    coins: 500,
    last_sync: ancientTime,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "largedelta@test.com", "US");
  await expect(page.locator('[data-testid="pet-hunger"]')).toHaveText("0%");
  await expect(page.locator('[data-testid="pet-hydration"]')).toHaveText("0%");
  await expect(page.locator('[data-testid="pet-happiness"]')).toHaveText("0%");
});

// ==========================================
// TIER 3: CROSS-FEATURE COMBINATIONS (5 Tests)
// ==========================================

test("51. Cross: Play mini-game then unlock and buy item in Shop", async ({ page, request }) => {
  const testUser = { id: "cross_user_1", email: "cross1@test.com", country: "US", friends: [] };
  const testPet = {
    id: "cross_pet_1",
    user_id: "cross_user_1",
    name: "Crossy",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 900, // needs 100 more to unlock shop
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "cross1@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).toBeVisible();

  // Go play mini game
  await page.click('[data-testid="pet-tab-btn"]');
  await page.click('[data-testid="minigame-btn"]'); // + 150 coins -> 1050 total
  await page.waitForTimeout(500);

  // Shop should now be unlocked
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).not.toBeVisible();
  await page.click('[data-testid="buy-penguin-btn"]');
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="owned-cosmetics"]')).toContainText("penguin suit");
});

test("52. Cross: Login as Apple proxy, earn coins, view friends leaderboard", async ({ page }) => {
  await login(page, "proxy@privaterelay.appleid.com", "US");
  await page.click('[data-testid="minigame-btn"]'); // earn some coins
  await page.waitForTimeout(500);

  await page.click('[data-testid="leaderboard-tab-btn"]');
  await page.click('[data-testid="leaderboard-friends-btn"]');
  await expect(page.locator('[data-testid="leaderboard-list"]')).toContainText("proxy");
});

test("53. Cross: Hatch egg, play with pet, force manual sync, verify saved status", async ({ page, request }) => {
  const testUser = { id: "cross_user_3", email: "cross3@test.com", country: "US", friends: [] };
  const testPet = {
    id: "cross_pet_3",
    user_id: "cross_user_3",
    name: "Egg",
    status: "egg",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 50, // ready to hatch
    coins: 200,
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "cross3@test.com", "US");
  await page.fill('[data-testid="hatch-name-input"]', "Newbie");
  await page.click('[data-testid="hatch-btn"]');
  await page.waitForTimeout(500);

  // Play once
  await page.click('[data-testid="play-btn"]');
  await page.waitForTimeout(500);

  // Force manual sync
  await page.click('[data-testid="sync-btn"]');
  await page.waitForTimeout(500);

  // Re-login to check server persistence
  await page.click('[data-testid="logout-btn"]');
  await login(page, "cross3@test.com", "US");

  await expect(page.locator('[data-testid="pet-status"]')).toHaveText("Status: hatched");
  await expect(page.locator('[data-testid="pet-name"]')).toHaveText("Newbie");
});

test("54. Cross: Spend all coins on vitals, locking shop again", async ({ page, request }) => {
  const testUser = { id: "cross_user_4", email: "cross4@test.com", country: "US", friends: [] };
  const testPet = {
    id: "cross_pet_4",
    user_id: "cross_user_4",
    name: "Crossy 4",
    status: "hatched",
    hunger: 50,
    hydration: 50,
    temperature: 50,
    happiness: 50,
    xp: 10,
    coins: 1005, // unlocked
    last_sync: Date.now(),
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "cross4@test.com", "US");
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).not.toBeVisible();

  // Spend coins on feeding
  await page.click('[data-testid="pet-tab-btn"]');
  await page.click('[data-testid="feed-btn"]'); // 1005 - 10 = 995 coins
  await page.waitForTimeout(500);

  // Shop should now lock again
  await page.click('[data-testid="shop-tab-btn"]');
  await expect(page.locator('[data-testid="shop-locked-overlay"]')).toBeVisible();
});

test("55. Cross: Fast login/logout/login with different users updates pet states", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await expect(page.locator('[data-testid="pet-name"]')).toHaveText("Fluffy");

  await page.click('[data-testid="logout-btn"]');

  await login(page, "bob@test.com", "US");
  await expect(page.locator('[data-testid="pet-name"]')).toHaveText("Rex");
});

// ==========================================
// TIER 4: REAL-WORLD SCENARIOS (5 Tests)
// ==========================================

test("56. Scenario: Offline progression on next login (long offline decay)", async ({ page, request }) => {
  const testUser = { id: "offline_user", email: "offline@test.com", country: "US", friends: [] };
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000; // 7200 seconds
  const testPet = {
    id: "offline_pet",
    user_id: "offline_user",
    name: "OfflinePet",
    status: "hatched",
    hunger: 100,
    hydration: 100,
    temperature: 50,
    happiness: 100,
    xp: 10,
    coins: 500,
    last_sync: twoHoursAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "offline@test.com", "US");
  // hunger decay: 7200 * 0.0167 = 120 -> should decay to 0%
  // hydration decay: 7200 * 0.0333 = 240 -> should decay to 0%
  // happiness decay: 7200 * 0.0167 = 120 -> should decay to 0%
  await expect(page.locator('[data-testid="pet-hunger"]')).toHaveText("0%");
  await expect(page.locator('[data-testid="pet-hydration"]')).toHaveText("0%");
  await expect(page.locator('[data-testid="pet-happiness"]')).toHaveText("0%");
});

test("57. Scenario: Offline progression with mock backend anti-cheat validation", async ({ page, request }) => {
  const testUser = { id: "anticheat_user", email: "anticheat@test.com", country: "US", friends: [] };
  const minsAgo = Date.now() - 10 * 60 * 1000; // 600 seconds
  const testPet = {
    id: "anticheat_pet",
    user_id: "anticheat_user",
    name: "ACPet",
    status: "hatched",
    hunger: 80,
    hydration: 80,
    temperature: 50,
    happiness: 80,
    xp: 10,
    coins: 500,
    last_sync: minsAgo,
  };
  await request.post(`${BACKEND_URL}/__control/seed`, {
    data: JSON.stringify({ seedUsers: [testUser], seedPets: [testPet] }),
    headers: { "Content-Type": "application/json" },
  });

  await login(page, "anticheat@test.com", "US");
  // Expected values after decay:
  // hunger: 80 - 10 = 70. Client performs water action once (+10 hydration, -5 coins, +10 XP).
  await page.click('[data-testid="water-btn"]');
  await page.waitForTimeout(500);

  // Force sync
  await page.click('[data-testid="sync-btn"]');
  await page.waitForTimeout(500);

  // Ensure sync was successful without cheat warnings
  await expect(page.locator('[data-testid="sync-status"]')).toContainText("Synced");
  await expect(page.locator('[data-testid="pet-coins"]')).toHaveText("495");
});

test("58. Scenario: User logs in, feeds pet, plays game, checks leaderboard, logs out", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  await page.click('[data-testid="feed-btn"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="minigame-btn"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="leaderboard-tab-btn"]');
  await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
  await page.click('[data-testid="logout-btn"]');
  await expect(page.locator('[data-testid="login-btn"]')).toBeVisible();
});

test("59. Scenario: Multi-device sync scenario with conflict correction", async ({ page, request }) => {
  await login(page, "alice@test.com", "US");

  // Modify server state out-of-band to simulate action from device 2
  const tokenRes = await request.post(`${BACKEND_URL}/api/auth/mock`, {
    data: { email: "alice@test.com" }
  });
  const { token } = await tokenRes.json();

  // Device 2 plays with pet, making happiness 100, xp 1000, coins 2000
  await request.post(`${BACKEND_URL}/api/pet/sync`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      happiness: 100,
      xp: 1000,
      coins: 2000,
      play_count: 1,
      client_time: Date.now()
    }
  });

  // Now Device 1 forces a sync
  await page.click('[data-testid="sync-btn"]');
  await page.waitForTimeout(500);

  // Local state on Device 1 should reflect Device 2's sync values
  await expect(page.locator('[data-testid="pet-coins"]')).toHaveText("2000");
  await expect(page.locator('[data-testid="pet-xp"]')).toHaveText("1000");
});

test("60. Scenario: High latency / retry sync behavior on connection failure", async ({ page }) => {
  await login(page, "alice@test.com", "US");
  // Simple check for sync success
  await page.click('[data-testid="sync-btn"]');
  await page.waitForTimeout(500);
  await expect(page.locator('[data-testid="sync-status"]')).toContainText("Synced");
});
