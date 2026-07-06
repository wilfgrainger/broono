import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Droplets,
  Flame,
  Gamepad2,
  Gift,
  Heart,
  Lock,
  Play,
  ShieldCheck,
  ShoppingBag,
  Smile,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import { environments } from './game';
import { leaderboard, paymentProducts, shopItems, supportedVitals, type PaymentProductId, type VitalName } from './viewModel';
import { useGameLoop } from './hooks/useGameLoop';
import { nativeBridge } from './platform';
import { supportedAuthProviders } from './platform/auth';
import './styles.css';

const vitalIcon: Record<VitalName, React.ReactNode> = {
  hunger: <Heart />,
  hydration: <Droplets />,
  temperature: <Flame />,
  happiness: <Smile />,
};

const vitalTone: Record<VitalName, string> = {
  hunger: 'berry',
  hydration: 'splash',
  temperature: 'sun',
  happiness: 'gum',
};

const itemTone = ['berry', 'mint', 'sun', 'grape', 'splash', 'gum', 'ruby', 'lime'];

function App() {
  const { state, care, completeMiniGame, signInAs, purchase, lastReceipt, syncStatus, shopUnlocked } = useGameLoop();
  const { pet, inventory, user } = state;
  const platform = nativeBridge.platform;
  const environment = environments[pet.environment];
  const xpPercent = Math.min(100, Math.round((pet.xp % 100)));
  const nextUnlock = 1000 - inventory.coins;

  const handlePurchase = (productId: PaymentProductId) => {
    void purchase(productId);
  };

  return (
    <main className="app-shell" aria-label="Broono mobile game">
      <header className="game-hud" aria-label="Broono game status">
        <div className="brand-lockup">
          <span className="brand-mark">B</span>
          <div>
            <strong>Broono</strong>
            <small>Pet Puzzle Saga</small>
          </div>
        </div>
        <div className="hud-pills">
          <span className="hud-pill hearts"><Heart /> 5</span>
          <span className="hud-pill coin-pill"><Sparkles /> {inventory.coins.toLocaleString()} coins</span>
        </div>
      </header>

      <section className="hero-board candy-panel">
        <div className="hero-copy-block">
          <span className="eyebrow"><Crown /> Season 1: Sugar Village</span>
          <h1>Raise, play, win, evolve.</h1>
          <p className="hero-copy">A quick daily creature loop with puzzle rewards, premium cosmetics, and leaderboard pressure built for phone sessions.</p>
        </div>
        <div className="login-card" aria-label="Sign in choices">
          <div className="player-chip"><UserRound /> {user.displayName}</div>
          <div className="auth-row">
            {supportedAuthProviders.map((provider) => (
              <button key={provider.id} onClick={() => signInAs(provider.id)}>{provider.label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="map-strip candy-panel" aria-label="Adventure map">
        <div className="map-header">
          <span><Zap /> Daily path</span>
          <strong>{shopUnlocked ? 'Shop unlocked' : `${nextUnlock.toLocaleString()} coins to shop`}</strong>
        </div>
        <div className="level-road">
          {Object.values(environments).map((place, index) => (
            <div key={place.label} className={`level-node ${place.label === environment.label ? 'active' : ''} ${index > 0 && !inventory.unlockedEnvironmentIds.includes(index === 1 ? 'palace' : 'resort') ? 'locked-node' : ''}`}>
              <span>{index + 1}</span>
              <small>{place.label.replace('Moonlit ', '')}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="pet-stage candy-panel">
        <div className="stage-topline">
          <span>{environment.label}</span>
          <span>Sync: {syncStatus}</span>
          <span>{platform}</span>
        </div>
        <div className="scene-frame">
          <div className="candy-cloud cloud-one" />
          <div className="candy-cloud cloud-two" />
          <div className="candy-hill hill-one" />
          <div className="candy-hill hill-two" />
          <div className={`creature ${pet.stage === 'egg' ? 'egg-creature' : 'hatched-creature'}`} aria-label="current pet">
            <span className="creature-shine" />
            <span className="creature-face" />
          </div>
        </div>
        <div className="pet-title-row">
          <div>
            <h2>{pet.stage === 'egg' ? 'Mystery Egg' : `${pet.name} the ${pet.species}`}</h2>
            <p>Level {pet.level} - {pet.xp}/100 XP toward the next surprise</p>
          </div>
          <div className="xp-ring" style={{ '--xp': `${xpPercent}%` } as React.CSSProperties}>
            <span>{xpPercent}%</span>
          </div>
        </div>
        <div className="vital-grid">
          {supportedVitals.map(({ id, label }) => (
            <button key={id} className={`vital-card ${vitalTone[id]}`} onClick={() => care(id)} aria-label={`${label} ${pet.vitals[id]} percent`}>
              <span className="vital-icon">{vitalIcon[id]}</span>
              <span>{label}</span>
              <strong>{pet.vitals[id]}%</strong>
              <i style={{ width: `${pet.vitals[id]}%` }} />
            </button>
          ))}
        </div>
      </section>

      <section className="challenge-card candy-panel">
        <div className="section-heading">
          <h2><Gamepad2 /> Sweet Streak</h2>
          <span><Star /> +85 coins</span>
        </div>
        <p>Clear today's word tiles to juice the meter, bank coins, and move closer to the premium shop.</p>
        <div className="tile-rack" aria-label="Daily puzzle letters">
          {['C', 'A', 'R', 'E'].map((letter, index) => <span key={letter} className={`tile-${index}`}>{letter}</span>)}
        </div>
        <button className="primary-action" onClick={completeMiniGame}><Play /> Complete puzzle</button>
      </section>

      <section className="shop candy-panel">
        <div className="section-heading">
          <h2><ShoppingBag /> Prize Shop</h2>
          <span className={shopUnlocked ? 'unlocked' : 'locked'}>{shopUnlocked ? 'Unlocked' : 'Locked at 1,000 coins'}</span>
        </div>
        <div className="shop-grid">
          {shopItems.slice(0, 6).map((item, index) => {
            const owned = inventory.ownedItemIds.includes(item.id);
            return (
              <div key={item.id} className={`shop-row ${owned ? 'owned' : ''}`}>
                <span className={`item-gem ${itemTone[index % itemTone.length]}`} />
                <span>{item.name}<small>{item.category}</small></span>
                <strong>{owned ? 'Owned' : item.cost === 0 ? 'Free' : `${item.cost} coins`}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="payments candy-panel">
        <div className="section-heading">
          <h2><CreditCard /> Candy Bank</h2>
          <span><ShieldCheck /> Sandbox</span>
        </div>
        <div className="iap-grid">
          {paymentProducts.map((product, index) => (
            <button key={product.id} className={`iap-card tier-${index}`} onClick={() => handlePurchase(product.id)}>
              <span className="iap-badge"><Gift /> {product.badge}</span>
              <strong>{product.displayName}</strong>
              <small>{product.description}</small>
              <em>{product.localizedPrice}</em>
              <span className="iap-reward">+{product.coinAmount.toLocaleString()} coins{product.bonusItemIds.length > 0 ? ` - ${product.bonusItemIds.length} bonus` : ''}</span>
            </button>
          ))}
        </div>
        {lastReceipt && (
          <p className="receipt-toast"><CheckCircle2 /> Mock receipt {lastReceipt.transactionId} granted from {lastReceipt.platform}.</p>
        )}
      </section>

      <section className="leaderboards candy-panel">
        <div className="section-heading">
          <h2><Trophy /> Coin League</h2>
          <span><Lock /> Friends safe</span>
        </div>
        <div className="leaderboard-grid">
          {Object.entries(leaderboard).map(([scope, rows]) => (
            <div key={scope} className="leaderboard-card">
              <h3>{scope === 'global' ? 'Global' : scope === 'country' ? 'Country' : 'Friends & Family'}</h3>
              {rows.map((row, index) => (
                <p key={row.name} className={index === 0 ? 'top-row' : ''}>
                  <span>#{index + 1} {row.name} - {row.region}</span>
                  <strong>{row.coins}</strong>
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
