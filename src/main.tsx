import React from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, Droplets, Flame, Smile, Trophy, Gamepad2, ShoppingBag, Smartphone, CreditCard, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
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

function App() {
  const { state, care, completeMiniGame, signInAs, purchase, lastReceipt, syncStatus, shopUnlocked } = useGameLoop();
  const { pet, inventory, user } = state;
  const petEmoji = pet.stage === 'egg' ? '🥚' : pet.species === 'dragon' ? '🐲' : pet.species === 'penguin' ? '🐧' : pet.species === 'otter' ? '🦦' : '🐾';
  const platform = nativeBridge.platform;

  const handlePurchase = (productId: PaymentProductId) => {
    void purchase(productId);
  };

  return (
    <main className="app-shell" aria-label="Broono mobile game prototype">
      <section className="hero-card pixel-panel">
        <div>
          <p className="eyebrow"><Smartphone /> Android + iOS launch prototype</p>
          <h1>Raise a tiny friend with one joyful check-in a day.</h1>
          <p className="hero-copy">A mobile-only Tamagotchi loop with mocked Google/Apple sign-in, offline sync, mini-games, store-ready IAP rails, and leaderboards.</p>
          <div className="auth-row">
            {supportedAuthProviders.map((provider) => (
              <button key={provider.id} onClick={() => signInAs(provider.id)}>{provider.label}</button>
            ))}
          </div>
        </div>
        <div className="coin-pill">🪙 {inventory.coins.toLocaleString()} coins</div>
      </section>

      <section className="status-strip">
        <span>Platform: {platform}</span>
        <span>Player: {user.displayName}</span>
        <span>Sync: {syncStatus}</span>
        <span>{inventory.premiumPassActive ? 'Care Pass active' : 'Free care plan'}</span>
      </section>

      <section className="pet-stage pixel-panel">
        <div className="environment">Village Home · offline decay calculated on-device before Worker sync</div>
        <div className="sky-decor" aria-hidden="true"><span>☁️</span><span>⭐</span><span>☁️</span></div>
        <div className="pet-sprite" aria-label="current pet">{petEmoji}</div>
        <h2>{pet.stage === 'egg' ? 'Mystery Egg' : `${pet.name} the ${pet.species}`}</h2>
        <p>Level {pet.level} · {pet.xp}/100 XP toward the next surprise</p>
        <div className="vital-grid">
          {supportedVitals.map(({ id, label }) => (
            <button key={id} className="vital-card" onClick={() => care(id)}>
              {vitalIcon[id]}
              <span>{label}</span>
              <strong>{pet.vitals[id]}%</strong>
              <i style={{ width: `${pet.vitals[id]}%` }} />
            </button>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <article className="pixel-panel mini-game">
          <h2><Gamepad2 /> Daily Word Puzzle</h2>
          <p>Complete bite-size educational puzzles to earn coins and unlock destinations like Palace and Holiday Resort.</p>
          <div className="letter-row">{['C', 'A', 'R', 'E'].map((letter) => <span key={letter}>{letter}</span>)}</div>
          <button className="primary-action" onClick={completeMiniGame}>Complete puzzle · +85 coins</button>
        </article>

        <article className="pixel-panel shop">
          <h2><ShoppingBag /> Premium Shop</h2>
          <p className={shopUnlocked ? 'unlocked' : 'locked'}>{shopUnlocked ? 'Unlocked: cosmetics and utility upgrades are available.' : 'Locked until you hoard 1,000 coins or use a mock IAP top-up.'}</p>
          {shopItems.map((item) => (
            <div key={item.id} className={`shop-row ${inventory.ownedItemIds.includes(item.id) ? 'owned' : ''}`}>
              <span>{item.name}<small>{item.category}</small></span>
              <strong>{inventory.ownedItemIds.includes(item.id) ? 'Owned' : item.cost === 0 ? 'Free' : `${item.cost} 🪙`}</strong>
            </div>
          ))}
        </article>
      </section>

      <section className="pixel-panel payments">
        <div className="section-heading">
          <h2><CreditCard /> Mock Store Payments</h2>
          <span><ShieldCheck /> Sandbox ready</span>
        </div>
        <p className="payment-copy">Comparable mobile game purchase options with StoreKit and Play Billing product IDs, mocked receipts, purchase history rewards, and restore-safe entitlement shaping.</p>
        <div className="iap-grid">
          {paymentProducts.map((product) => (
            <button key={product.id} className="iap-card" onClick={() => handlePurchase(product.id)}>
              <span className="iap-badge"><Sparkles /> {product.badge}</span>
              <strong>{product.displayName}</strong>
              <small>{product.description}</small>
              <em>{product.localizedPrice}</em>
              <span className="iap-reward">+{product.coinAmount.toLocaleString()} coins{product.bonusItemIds.length > 0 ? ` · ${product.bonusItemIds.length} item bonus` : ''}</span>
            </button>
          ))}
        </div>
        {lastReceipt && (
          <p className="receipt-toast"><CheckCircle2 /> Mock receipt {lastReceipt.transactionId} granted from {lastReceipt.platform}.</p>
        )}
      </section>

      <section className="pixel-panel leaderboards">
        <h2><Trophy /> Coin Leaderboards</h2>
        <div className="leaderboard-grid">
          {Object.entries(leaderboard).map(([scope, rows]) => (
            <div key={scope}>
              <h3>{scope === 'global' ? 'Global' : scope === 'country' ? 'Country' : 'Friends & Family'}</h3>
              {rows.map((row, index) => <p key={row.name}><span>#{index + 1} {row.name} · {row.region}</span><strong>{row.coins}</strong></p>)}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
