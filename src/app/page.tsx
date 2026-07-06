"use client";

import React, { useState, useEffect, useRef } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '');

const apiUrl = (path: string) => `${API_BASE}${path}`;

interface PetState {
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

interface LeaderboardUser {
  email: string;
  country: string;
  coins: number;
}

export default function Page() {
  const [mounted, setMounted] = useState(false);

  // Active Tab: "pet" | "shop" | "leaderboard"
  const [activeTab, setActiveTab] = useState<'pet' | 'shop' | 'leaderboard'>('pet');

  // Auth State
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('US');

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginCountry, setLoginCountry] = useState('US');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Pet State
  const [pet, setPet] = useState<PetState>({
    id: '',
    user_id: '',
    name: 'Bubbles',
    status: 'egg',
    hunger: 100,
    hydration: 100,
    temperature: 50,
    happiness: 100,
    xp: 0,
    coins: 100,
    last_sync: Date.now(),
    inventory: []
  });

  // Action Tracking for Sync
  const [feedCount, setFeedCount] = useState(0);
  const [waterCount, setWaterCount] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [coinGains, setCoinGains] = useState(0);
  const feedCountRef = useRef(0);
  const waterCountRef = useRef(0);
  const playCountRef = useRef(0);
  const coinGainsRef = useRef(0);

  // Leaderboard state
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'country' | 'friends'>('global');
  const [leaderboardData, setLeaderboardData] = useState<{
    global: LeaderboardUser[];
    country: LeaderboardUser[];
    friends: LeaderboardUser[];
  }>({ global: [], country: [], friends: [] });

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const DECAY_RATES = {
    hunger: 0.0167,
    hydration: 0.0333,
    happiness: 0.0167,
    temperature: 0.0083,
  };

  // Helper to load session and initial state
  useEffect(() => {
    setMounted(true);
    const savedEmail = localStorage.getItem('session_email');
    const savedToken = localStorage.getItem('session_token');
    const savedCountry = localStorage.getItem('session_country');

    if (savedToken && savedEmail) {
      setEmail(savedEmail);
      setToken(savedToken);
      setCountry(savedCountry || 'US');
      
      const savedPet = localStorage.getItem('pet_state');
      let currentPet = {
        id: '',
        user_id: '',
        name: 'Bubbles',
        status: 'egg',
        hunger: 100,
        hydration: 100,
        temperature: 50,
        happiness: 100,
        xp: 0,
        coins: 100,
        last_sync: Date.now(),
        inventory: []
      };
      if (savedPet) {
        try {
          const parsed = JSON.parse(savedPet);
          const now = Date.now();
          const elapsedSec = Math.max(0, (now - (parsed.last_sync || now)) / 1000);
          
          let hunger = Math.max(0, parsed.hunger - elapsedSec * DECAY_RATES.hunger);
          let hydration = Math.max(0, parsed.hydration - elapsedSec * DECAY_RATES.hydration);
          let happiness = Math.max(0, parsed.happiness - elapsedSec * DECAY_RATES.happiness);
          
          let temp = parsed.temperature;
          if (temp > 50) {
            temp = Math.max(50, temp - elapsedSec * DECAY_RATES.temperature);
          } else if (temp < 50) {
            temp = Math.min(50, temp + elapsedSec * DECAY_RATES.temperature);
          }

          currentPet = {
            ...parsed,
            hunger,
            hydration,
            happiness,
            temperature: temp,
            last_sync: now
          };
          setPet(currentPet);
          localStorage.setItem('pet_state', JSON.stringify(currentPet));
        } catch (e) {}
      }
      triggerSync(currentPet, {}, savedToken);
    }
  }, []);

  const petRef = useRef(pet);
  useEffect(() => {
    petRef.current = pet;
  }, [pet]);

  // Periodic Decay Tick
  useEffect(() => {
    if (!mounted || !token) return;

    const interval = setInterval(() => {
      setPet(prev => {
        let hunger = Math.max(0, prev.hunger - DECAY_RATES.hunger);
        let hydration = Math.max(0, prev.hydration - DECAY_RATES.hydration);
        let happiness = Math.max(0, prev.happiness - DECAY_RATES.happiness);
        
        let temp = prev.temperature;
        if (temp > 50) {
          temp = Math.max(50, temp - DECAY_RATES.temperature);
        } else if (temp < 50) {
          temp = Math.min(50, temp + DECAY_RATES.temperature);
        }

        const next = {
          ...prev,
          hunger,
          hydration,
          happiness,
          temperature: temp,
          last_sync: Date.now()
        };
        localStorage.setItem('pet_state', JSON.stringify(next));
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mounted, token]);

  // Periodic autosync
  useEffect(() => {
    if (!mounted || !token) return;
    const interval = setInterval(() => {
      triggerSync(petRef.current);
    }, 15000);
    return () => clearInterval(interval);
  }, [mounted, token]);

  // Refetch leaderboard when tab changes
  useEffect(() => {
    if (token && activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [token, activeTab]);

  const triggerSync = async (
    currentPet: PetState,
    overrides: Partial<PetState> = {},
    customToken?: string,
    extraActions: { shop_spend?: number } = {},
  ) => {
    const activeToken = customToken || token;
    if (!activeToken) return;
    setSyncStatus('Syncing...');
    try {
      const payload = {
        hunger: overrides.hunger !== undefined ? overrides.hunger : currentPet.hunger,
        hydration: overrides.hydration !== undefined ? overrides.hydration : currentPet.hydration,
        temperature: overrides.temperature !== undefined ? overrides.temperature : currentPet.temperature,
        happiness: overrides.happiness !== undefined ? overrides.happiness : currentPet.happiness,
        xp: overrides.xp !== undefined ? overrides.xp : currentPet.xp,
        coins: overrides.coins !== undefined ? overrides.coins : currentPet.coins,
        inventory: overrides.inventory !== undefined ? overrides.inventory : currentPet.inventory,
        status: overrides.status !== undefined ? overrides.status : currentPet.status,
        name: overrides.name !== undefined ? overrides.name : currentPet.name,
        feed_count: feedCountRef.current,
        water_count: waterCountRef.current,
        play_count: playCountRef.current,
        coin_gains: coinGainsRef.current,
        shop_spend: extraActions.shop_spend || 0,
        client_time: Date.now(),
      };

      const res = await fetch(apiUrl('/api/pet/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const serverPet = data.pet;
        
        feedCountRef.current = 0;
        waterCountRef.current = 0;
        playCountRef.current = 0;
        coinGainsRef.current = 0;
        setFeedCount(0);
        setWaterCount(0);
        setPlayCount(0);
        setCoinGains(0);

        setPet(serverPet);
        localStorage.setItem('pet_state', JSON.stringify(serverPet));
        setSyncStatus('Synced');
      } else {
        setSyncStatus('Sync failed');
      }
    } catch (e) {
      setSyncStatus('Sync failed');
    }
  };

  const fetchLeaderboard = async () => {
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/leaderboard'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      }
    } catch (e) {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail) return;

    try {
      const res = await fetch(apiUrl('/api/auth/mock'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, country: loginCountry })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('session_email', loginEmail);
        localStorage.setItem('session_token', data.token);
        localStorage.setItem('session_country', loginCountry);

        setEmail(loginEmail);
        setToken(data.token);
        setCountry(loginCountry);
        
        // Reset pet state to default for this user
        const defaultPet = {
          id: '',
          user_id: '',
          name: 'Bubbles',
          status: 'egg',
          hunger: 100,
          hydration: 100,
          temperature: 50,
          happiness: 100,
          xp: 0,
          coins: 100,
          last_sync: Date.now(),
          inventory: []
        };
        setPet(defaultPet);
        localStorage.setItem('pet_state', JSON.stringify(defaultPet));
        setFeedCount(0);
        setWaterCount(0);
        setPlayCount(0);
        setCoinGains(0);
        feedCountRef.current = 0;
        waterCountRef.current = 0;
        playCountRef.current = 0;
        coinGainsRef.current = 0;
        setActiveTab('pet');

        // Sync immediately with the new token to fetch seeded backend data
        await triggerSync(defaultPet, {}, data.token);
      } else {
        setLoginError('Login failed');
      }
    } catch (e) {
      setLoginError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session_email');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_country');
    localStorage.removeItem('pet_state');
    
    setEmail(null);
    setToken(null);
    setCountry('US');
    setLoginEmail('');
    setActiveTab('pet');
  };

  // Vitals Actions
  const handleFeed = () => {
    if (pet.status === 'egg') return;
    if (pet.coins < 10) return; // costs 10 coins
    
    const nextPet = {
      ...pet,
      hunger: Math.min(100, pet.hunger + 15),
      coins: pet.coins - 10,
      xp: pet.xp + 10,
      last_sync: Date.now()
    };
    setPet(nextPet);
    feedCountRef.current += 1;
    setFeedCount(prev => prev + 1);
    localStorage.setItem('pet_state', JSON.stringify(nextPet));
  };

  const handleWater = () => {
    if (pet.status === 'egg') return;
    if (pet.coins < 5) return; // costs 5 coins

    const nextPet = {
      ...pet,
      hydration: Math.min(100, pet.hydration + 10),
      coins: pet.coins - 5,
      xp: pet.xp + 10,
      last_sync: Date.now()
    };
    setPet(nextPet);
    waterCountRef.current += 1;
    setWaterCount(prev => prev + 1);
    localStorage.setItem('pet_state', JSON.stringify(nextPet));
  };

  const handlePlay = () => {
    if (pet.status === 'egg') return;
    if (pet.coins < 5) return; // costs 5 coins

    const nextPet = {
      ...pet,
      happiness: Math.min(100, pet.happiness + 20),
      coins: pet.coins - 5,
      xp: pet.xp + 10,
      last_sync: Date.now()
    };
    setPet(nextPet);
    playCountRef.current += 1;
    setPlayCount(prev => prev + 1);
    localStorage.setItem('pet_state', JSON.stringify(nextPet));
  };

  const handlePlayMiniGame = () => {
    const nextPet = {
      ...pet,
      coins: pet.coins + 150,
      xp: pet.xp + 10,
      last_sync: Date.now()
    };
    setPet(nextPet);
    coinGainsRef.current += 150;
    setCoinGains(prev => prev + 150);
    localStorage.setItem('pet_state', JSON.stringify(nextPet));
  };

  // Hatching
  const [hatchName, setHatchName] = useState('');
  const handleHatch = () => {
    if (pet.status !== 'egg') return;
    if (pet.xp < 50) return;

    const finalName = hatchName.trim() || 'Bubbles';
    const nextPet = {
      ...pet,
      status: 'hatched',
      name: finalName,
      last_sync: Date.now()
    };
    setPet(nextPet);
    localStorage.setItem('pet_state', JSON.stringify(nextPet));
    triggerSync(pet, { status: 'hatched', name: finalName });
  };

  // Shop Purchases
  const handleBuyItem = (item: string, cost: number) => {
    if (pet.status === 'egg') return;
    if (pet.coins < cost) return;
    const currentInventory = pet.inventory || [];
    if (currentInventory.includes(item)) return;

    const nextInventory = [...currentInventory, item];
    const nextPet = {
      ...pet,
      coins: pet.coins - cost,
      inventory: nextInventory,
      last_sync: Date.now()
    };
    setPet(nextPet);
    localStorage.setItem('pet_state', JSON.stringify(nextPet));
    triggerSync(nextPet, { coins: nextPet.coins, inventory: nextInventory }, undefined, { shop_spend: cost });
  };

  if (!mounted) return null;

  // Unauthenticated Login View
  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
          <h1 className="text-3xl font-extrabold text-center mb-6 text-indigo-600">Welcome to Broono</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email address</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                data-testid="login-email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Country</label>
              <select
                data-testid="login-country"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={loginCountry}
                onChange={e => setLoginCountry(e.target.value)}
              >
                <option value="US">United States (US)</option>
                <option value="UK">United Kingdom (UK)</option>
                <option value="CA">Canada (CA)</option>
              </select>
            </div>
            {loginError && <p className="text-rose-500 text-sm" data-testid="login-error">{loginError}</p>}
            <button
              type="submit"
              data-testid="login-btn"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    );
  }

  const isAppleProxy = email?.endsWith('privaterelay.appleid.com');
  const shopLocked = pet.coins < 1000;

  return (
    <main className="min-h-screen p-6 bg-slate-50 text-slate-800 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-indigo-600">BROONO.APP</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500" data-testid="user-email-display">{email}</span>
            {isAppleProxy && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded" data-testid="apple-relay-indicator">
                Apple Proxy Active
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition"
        >
          Logout
        </button>
      </header>

      {/* Tabs Menu */}
      <div className="w-full max-w-4xl grid grid-cols-3 gap-1 mb-6 bg-indigo-50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('pet')}
          data-testid="pet-tab-btn"
          className={`py-2 font-bold rounded-lg text-sm transition ${activeTab === 'pet' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
        >
          My Pet
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          data-testid="shop-tab-btn"
          className={`py-2 font-bold rounded-lg text-sm transition ${activeTab === 'shop' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Shop
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          data-testid="leaderboard-tab-btn"
          className={`py-2 font-bold rounded-lg text-sm transition ${activeTab === 'leaderboard' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Leaderboard
        </button>
      </div>

      <div className="w-full max-w-4xl">
        {/* PET TAB */}
        {activeTab === 'pet' && (
          <div className="p-6 bg-white rounded-2xl shadow-md border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-2xl font-black" data-testid="pet-name">{pet.name}</h2>
                <p className="text-sm text-slate-500 uppercase font-semibold" data-testid="pet-status">Status: {pet.status}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-amber-600">💰 <span data-testid="pet-coins">{pet.coins}</span> coins</p>
                <p className="text-xs text-slate-400 font-bold">XP: <span data-testid="pet-xp">{pet.xp}</span></p>
              </div>
            </div>

            {/* Vitals stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Hunger</span>
                  <span data-testid="pet-hunger">{Math.round(pet.hunger)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full transition-all" style={{ width: `${pet.hunger}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Hydration</span>
                  <span data-testid="pet-hydration">{Math.round(pet.hydration)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full transition-all" style={{ width: `${pet.hydration}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Temperature</span>
                  <span data-testid="pet-temperature">{Math.round(pet.temperature)}°C</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full transition-all" style={{ width: `${Math.min(100, (pet.temperature / 100) * 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Happiness</span>
                  <span data-testid="pet-happiness">{Math.round(pet.happiness)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full transition-all" style={{ width: `${pet.happiness}%` }} />
                </div>
              </div>
            </div>

            {/* Care Actions */}
            {pet.status === 'hatched' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleFeed}
                  data-testid="feed-btn"
                  className="py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-xl transition"
                >
                  🍖 Feed (10)
                </button>
                <button
                  onClick={handleWater}
                  data-testid="water-btn"
                  className="py-3 bg-sky-100 hover:bg-sky-200 text-sky-700 font-bold rounded-xl transition"
                >
                  💧 Water (5)
                </button>
                <button
                  onClick={handlePlay}
                  data-testid="play-btn"
                  className="py-3 bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold rounded-xl transition"
                >
                  🧸 Play (5)
                </button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl space-y-3">
                {pet.xp >= 50 ? (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-bold">Procedure Egg Hatching: Name your pet</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Hatchy"
                        data-testid="hatch-name-input"
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        value={hatchName}
                        onChange={e => setHatchName(e.target.value)}
                      />
                      <button
                        onClick={handleHatch}
                        data-testid="hatch-btn"
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition"
                      >
                        Hatch Egg!
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center font-bold text-yellow-700">Need {50 - pet.xp} more XP to hatch.</p>
                )}
              </div>
            )}

            {/* Play game */}
            <button
              onClick={handlePlayMiniGame}
              data-testid="minigame-btn"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow"
            >
              🎮 Play Mini-Game (+150 Coins)
            </button>

            {/* Sync bar */}
            <div className="flex justify-between items-center pt-3 border-t text-xs font-bold">
              <div>
                {syncStatus && <span data-testid="sync-status" className="text-green-600">{syncStatus}</span>}
              </div>
              <button
                onClick={() => triggerSync(pet)}
                data-testid="sync-btn"
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
              >
                Sync Now 🔄
              </button>
            </div>
          </div>
        )}

        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <div className="p-6 bg-white rounded-2xl shadow-md border border-slate-100 relative overflow-hidden min-h-[300px]">
            <h2 className="text-2xl font-black border-b pb-3 mb-4">Premium Shop</h2>
            <p className="text-sm font-bold text-slate-600 mb-4">Balance: {pet.coins} coins</p>

            {shopLocked && (
              <div
                data-testid="shop-locked-overlay"
                className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center z-10"
              >
                <span className="text-3xl mb-2">🔒</span>
                <h3 className="font-extrabold text-lg">Shop Locked</h3>
                <p className="text-sm text-slate-300">You must accumulate at least 1,000 coins to unlock the premium shop.</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 border rounded-xl">
                <div>
                  <h4 className="font-bold">Penguin Suit</h4>
                  <p className="text-xs text-slate-500">Dress up like a flightless bird!</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-amber-600">200 💰</span>
                  <button
                    onClick={() => handleBuyItem('penguin suit', 200)}
                    data-testid="buy-penguin-btn"
                    disabled={pet.coins < 200 || pet.inventory?.includes('penguin suit')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-lg text-sm transition"
                  >
                    {pet.inventory?.includes('penguin suit') ? 'Owned' : 'Buy'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 border rounded-xl">
                <div>
                  <h4 className="font-bold">Cat Ears</h4>
                  <p className="text-xs text-slate-500">Perfect feline cosplay accessory.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-amber-600">150 💰</span>
                  <button
                    onClick={() => handleBuyItem('cat ears', 150)}
                    data-testid="buy-catears-btn"
                    disabled={pet.coins < 150 || pet.inventory?.includes('cat ears')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-lg text-sm transition"
                  >
                    {pet.inventory?.includes('cat ears') ? 'Owned' : 'Buy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Wardrobe */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-bold text-sm mb-2">Owned Cosmetics:</h4>
              <div data-testid="owned-cosmetics" className="flex flex-wrap gap-2 text-sm text-indigo-700 font-semibold uppercase">
                {pet.inventory && pet.inventory.length > 0 
                  ? pet.inventory.join(', ') 
                  : 'None'}
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="p-6 bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col h-full min-h-[400px]">
            <h2 className="text-2xl font-black border-b pb-3 mb-4">Leaderboards</h2>
            
            {/* Filters */}
            <div className="grid grid-cols-3 gap-1 mb-4 bg-slate-100 p-1 rounded-xl" data-testid="leaderboard-table">
              <button
                onClick={() => setLeaderboardTab('global')}
                data-testid="leaderboard-global-btn"
                className={`py-2 font-bold rounded-lg text-sm transition ${leaderboardTab === 'global' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Global
              </button>
              <button
                onClick={() => setLeaderboardTab('country')}
                data-testid="leaderboard-country-btn"
                className={`py-2 font-bold rounded-lg text-sm transition ${leaderboardTab === 'country' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Country
              </button>
              <button
                onClick={() => setLeaderboardTab('friends')}
                data-testid="leaderboard-friends-btn"
                className={`py-2 font-bold rounded-lg text-sm transition ${leaderboardTab === 'friends' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Friends
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2" data-testid="leaderboard-list">
              {(leaderboardData[leaderboardTab] || []).length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">No leaderboard data available</p>
              ) : (
                (leaderboardData[leaderboardTab] || []).map((item, index) => (
                  <div
                    key={item.email}
                    data-testid={`leaderboard-row-${index}`}
                    className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm">{item.email.split('@')[0]}</p>
                        <p className="text-xs text-slate-400 uppercase">{item.country}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-indigo-600 text-sm">💰 {item.coins} coins</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
