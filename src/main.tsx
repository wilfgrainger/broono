import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgeCheck,
  CreditCard,
  Crown,
  Gem,
  Gift,
  Heart,
  Lock,
  Medal,
  Play,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { getCluster, leaderboard, paymentProducts, shopItems, tileVisuals, type PaymentProductId, type TileColor } from './viewModel';
import { useGameLoop } from './hooks/useGameLoop';
import { nativeBridge } from './platform';
import { supportedAuthProviders } from './platform/auth';
import './styles.css';

const ideaRanks = [
  {
    rank: 1,
    name: 'Snack Pop Quest',
    verdict: 'Chosen: lowest maintenance, strongest broad appeal, cleanest monetization.',
  },
  {
    rank: 2,
    name: 'Snack Rail Sort',
    verdict: 'Fast and readable, but content burns out unless orders get expensive to author.',
  },
  {
    rank: 3,
    name: 'Tiny Merge Garden',
    verdict: 'Sticky collection loop, but merge economies become spreadsheet-heavy quickly.',
  },
  {
    rank: 4,
    name: 'Rhythm Hop Picnic',
    verdict: 'Great feel if perfect, unforgiving if latency or audio timing is rough.',
  },
  {
    rank: 5,
    name: 'Sticker Heist',
    verdict: 'Cute hidden-object idea, but needs lots of art to avoid repetition.',
  },
];

function App() {
  const { state, popTile, nextLevel, retry, triggerBooster, signInAs, purchase, lastReceipt, syncStatus, shopUnlocked } = useGameLoop();
  const { run, inventory, user, pet } = state;
  const platform = nativeBridge.platform;
  const progressPercent = Math.min(100, Math.round((run.score / run.targetScore) * 100));

  const handlePurchase = (productId: PaymentProductId) => {
    void purchase(productId);
  };

  return (
    <main className="app-shell" aria-label="Broono Snack Pop Quest">
      <header className="top-hud" aria-label="Broono status">
        <div className="brand-lockup">
          <span className="brand-mark">B</span>
          <div>
            <strong>Broono</strong>
            <small>Snack Pop Quest</small>
          </div>
        </div>
        <div className="hud-pills">
          <span className="hud-pill heart-pill"><Heart /> {inventory.hearts}</span>
          <span className="hud-pill coin-pill"><Sparkles /> {inventory.coins.toLocaleString()}</span>
        </div>
      </header>

      <section className="playfield" aria-label="Snack Pop board">
        <div className="level-banner">
          <div>
            <span className="eyebrow"><Crown /> Level {run.level}</span>
            <h1>Snack Pop Quest</h1>
          </div>
          <div className="target-ring" style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}>
            <span>{progressPercent}%</span>
          </div>
        </div>

        <div className="score-row" aria-label="Score and moves">
          <span><Star /> {run.score.toLocaleString()} / {run.targetScore.toLocaleString()}</span>
          <span><Zap /> {run.movesLeft} moves</span>
          <span><Medal /> Best {run.bestCluster}</span>
        </div>

        <div className={`pet-stage mood-${pet.mood}`} aria-label={`${pet.name} ${pet.species}`}>
          <div className="pet-sky">
            <span className="stage-candy candy-one" />
            <span className="stage-candy candy-two" />
            <span className="stage-candy candy-three" />
          </div>
          <div className="pet-character">
            <span className="pet-ear left" />
            <span className="pet-ear right" />
            <span className="pet-face" />
            <span className="pet-belly" />
          </div>
          <div className="pet-caption">
            <strong>{pet.name}</strong>
            <span>{pet.mood === 'full' ? 'Sugar rush' : pet.mood === 'hyped' ? 'Combo ready' : pet.mood === 'sleepy' ? 'Needs a heart' : 'Wants snacks'}</span>
          </div>
        </div>

        {run.lastPop && (
          <div className="pop-toast" role="status">
            <Sparkles /> {run.lastPop.clusterSize} snack pop: +{run.lastPop.points} points, +{run.lastPop.coins} coins
          </div>
        )}

        <div className="board-shell">
          <div className="snack-board" role="grid" aria-label="Snack tiles">
            {run.board.map((row, rowIndex) => row.map((tile, colIndex) => {
              const clusterSize = getCluster(run.board, rowIndex, colIndex).length;
              const visual = tileVisuals[tile as TileColor];
              return (
                <button
                  key={`${rowIndex}-${colIndex}-${tile}-${run.turn}`}
                  className={`snack-tile tile-${tile} ${clusterSize >= 2 ? 'playable' : ''}`}
                  onClick={() => popTile(rowIndex, colIndex)}
                  role="gridcell"
                  aria-label={`${visual.label} snack row ${rowIndex + 1} column ${colIndex + 1} cluster ${clusterSize}`}
                  data-testid={`tile-${rowIndex}-${colIndex}`}
                >
                  <span>{visual.glyph}</span>
                </button>
              );
            }))}
          </div>

          {run.status !== 'playing' && (
            <div className={`result-layer ${run.status}`} role="dialog" aria-label="Level result">
              <h2>{run.status === 'won' ? 'Level crushed' : 'Out of moves'}</h2>
              <p>{run.status === 'won' ? `${pet.name} earned a snack crown.` : 'Retry with a fresh board.'}</p>
              <button className="primary-action" onClick={run.status === 'won' ? nextLevel : retry}>
                <Play /> {run.status === 'won' ? 'Next level' : 'Retry'}
              </button>
            </div>
          )}
        </div>

        <div className="booster-tray" aria-label="Boosters">
          <button onClick={() => triggerBooster('shuffle')} disabled={inventory.boosters.shuffle <= 0 || run.status !== 'playing'}>
            <RefreshCw /> Shuffle <strong>{inventory.boosters.shuffle}</strong>
          </button>
          <button onClick={() => triggerBooster('spoon')} disabled={inventory.boosters.spoon <= 0 || run.status !== 'playing'}>
            <WandSparkles /> Mega spoon <strong>{inventory.boosters.spoon}</strong>
          </button>
        </div>
      </section>

      <section className="quest-strip" aria-label="Daily quests">
        <div className="quest-card complete">
          <BadgeCheck /> Pop 6+
        </div>
        <div className={run.status === 'won' ? 'quest-card complete' : 'quest-card'}>
          <Trophy /> Win level
        </div>
        <div className={run.movesLeft >= 5 ? 'quest-card complete' : 'quest-card'}>
          <Gem /> 5 moves spare
        </div>
      </section>

      <section className="panel idea-panel" aria-label="Game idea analysis">
        <div className="section-heading">
          <h2><Crown /> Five simple hit candidates</h2>
          <span>Brutal pick</span>
        </div>
        <div className="idea-list">
          {ideaRanks.map((idea) => (
            <div key={idea.name} className={idea.rank === 1 ? 'idea-row chosen' : 'idea-row'}>
              <strong>#{idea.rank} {idea.name}</strong>
              <span>{idea.verdict}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel shop-panel">
        <div className="section-heading">
          <h2><ShoppingBag /> Prize Shop</h2>
          <span className={shopUnlocked ? 'unlocked' : 'locked'}>{shopUnlocked ? 'Open' : 'Opens at level 3'}</span>
        </div>
        <div className="shop-grid">
          {shopItems.map((item, index) => {
            const owned = inventory.ownedItemIds.includes(item.id);
            return (
              <div key={item.id} className={`shop-row ${owned ? 'owned' : ''}`}>
                <span className={`shop-gem gem-${index % 5}`} />
                <span>{item.name}<small>{item.category}</small></span>
                <strong>{owned ? 'Owned' : `${item.cost} coins`}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel bank-panel">
        <div className="section-heading">
          <h2><CreditCard /> Booster Bank</h2>
          <span><ShieldCheck /> Grown-up approval</span>
        </div>
        <div className="iap-grid">
          {paymentProducts.map((product, index) => (
            <button key={product.id} className={`iap-card tier-${index}`} onClick={() => handlePurchase(product.id)}>
              <span className="iap-badge"><Gift /> {product.badge}</span>
              <strong>{product.displayName}</strong>
              <small>{product.description}</small>
              <em>{product.localizedPrice}</em>
              <span className="iap-reward">+{product.coinAmount.toLocaleString()} coins</span>
            </button>
          ))}
        </div>
        {lastReceipt && (
          <p className="receipt-toast"><BadgeCheck /> Mock receipt {lastReceipt.transactionId} granted from {lastReceipt.platform}.</p>
        )}
      </section>

      <section className="panel social-panel">
        <div className="section-heading">
          <h2><UserRound /> Player</h2>
          <span>{platform} / sync {syncStatus}</span>
        </div>
        <div className="login-card">
          <div className="player-chip"><UserRound /> {user.displayName}</div>
          <div className="auth-row">
            {supportedAuthProviders.map((provider) => (
              <button key={provider.id} onClick={() => signInAs(provider.id)}>{provider.label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel leaderboard-panel">
        <div className="section-heading">
          <h2><Trophy /> Pop League</h2>
          <span><Lock /> Friends safe</span>
        </div>
        <div className="leaderboard-grid">
          {Object.entries(leaderboard).map(([scope, rows]) => (
            <div key={scope} className="leaderboard-card">
              <h3>{scope === 'global' ? 'Global' : scope === 'country' ? 'Country' : 'Friends & Family'}</h3>
              {rows.map((row, index) => (
                <p key={row.name} className={index === 0 ? 'top-row' : ''}>
                  <span>#{index + 1} {row.name} - L{row.level} - {row.region}</span>
                  <strong>{row.score.toLocaleString()}</strong>
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
