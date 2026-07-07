import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgeCheck,
  Camera,
  Crown,
  Gift,
  Heart,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  WandSparkles,
} from 'lucide-react';
import { categories, categoryLabels, reactionLabels, wardrobeItems, type BroonoCard, type StyleCategory, type WardrobeItem } from './viewModel';
import { useGameLoop } from './hooks/useGameLoop';
import { nativeBridge } from './platform';
import { supportedAuthProviders } from './platform/auth';
import './styles.css';

const outfitCategories: StyleCategory[] = ['hair', 'top', 'bottom', 'shoes', 'prop'];

function itemFor(category: StyleCategory, selected: Partial<Record<StyleCategory, string>>) {
  return wardrobeItems.find((item) => item.id === selected[category]);
}

function AvatarPreview({ selected }: { selected: Partial<Record<StyleCategory, string>> }) {
  const hair = itemFor('hair', selected);
  const top = itemFor('top', selected);
  const bottom = itemFor('bottom', selected);
  const shoes = itemFor('shoes', selected);
  const prop = itemFor('prop', selected);
  const backdrop = itemFor('backdrop', selected);

  return (
    <div className="studio-stage" style={{ '--scene': backdrop?.color ?? '#55d6ff' } as React.CSSProperties} aria-label="Styled avatar preview">
      <div className="stage-sun" />
      <div className="stage-ribbon ribbon-one" />
      <div className="stage-ribbon ribbon-two" />
      <div className="avatar">
        <span className="avatar-hair" style={{ '--item': hair?.color ?? '#8ef3ff' } as React.CSSProperties} />
        <span className="avatar-face" />
        <span className="avatar-top" style={{ '--item': top?.color ?? '#4933b8' } as React.CSSProperties} />
        <span className="avatar-bottom" style={{ '--item': bottom?.color ?? '#ff70bd' } as React.CSSProperties} />
        <span className="avatar-shoes" style={{ '--item': shoes?.color ?? '#fff1a6' } as React.CSSProperties} />
        <span className="avatar-prop" style={{ '--item': prop?.color ?? '#ff5ba8' } as React.CSSProperties} />
      </div>
      <div className="broono-host" aria-label="Broono host">
        <span className="broono-ear left" />
        <span className="broono-ear right" />
        <span className="broono-face" />
      </div>
    </div>
  );
}

function BroonoCardView({ card, compact = false }: { card: BroonoCard; compact?: boolean }) {
  return (
    <div className={compact ? 'broono-card compact' : 'broono-card'}>
      <span className="card-kicker"><Camera /> Broono Card</span>
      <strong>{card.title}</strong>
      <small>{card.rank} / {card.score}% theme match</small>
    </div>
  );
}

function WardrobeRail({
  category,
  selectedId,
  ownedItemIds,
  onSelect,
}: {
  category: StyleCategory;
  selectedId?: string;
  ownedItemIds: string[];
  onSelect: (itemId: string) => void;
}) {
  const items = wardrobeItems.filter((item) => item.category === category);
  return (
    <div className="wardrobe-rail">
      <h3>{categoryLabels[category]}</h3>
      <div className="item-row">
        {items.map((item: WardrobeItem) => {
          const owned = ownedItemIds.includes(item.id);
          return (
            <button
              key={item.id}
              className={`item-chip ${selectedId === item.id ? 'selected' : ''}`}
              disabled={!owned}
              onClick={() => onSelect(item.id)}
              aria-label={`${item.name} ${owned ? '' : 'locked'}`}
            >
              <span style={{ '--item': item.color } as React.CSSProperties} />
              <strong>{item.name}</strong>
              <small>{owned ? item.tags.slice(0, 2).join(' + ') : 'Friday gift'}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const { state, selectItem, submit, vote, remix, claimGift, signInAs, syncStatus } = useGameLoop();
  const { run, inventory, user, pet } = state;
  const platform = nativeBridge.platform;
  const theme = run.theme;
  const selected = run.selectedItemIds;
  const submitted = run.submittedCard;

  return (
    <main className="app-shell" aria-label="Broono Style Showdown">
      <header className="top-hud">
        <div className="brand-lockup">
          <span className="brand-mark">B</span>
          <div>
            <strong>Broono</strong>
            <small>Style Showdown</small>
          </div>
        </div>
        <div className="hud-pills">
          <span className="hud-pill"><Heart /> Safe</span>
          <span className="hud-pill coin-pill"><Sparkles /> {inventory.coins}</span>
        </div>
      </header>

      <section className="hero-panel" aria-label="Daily style challenge">
        <div className="theme-copy">
          <span className="eyebrow"><Crown /> Today's theme</span>
          <h1>{theme.title}</h1>
          <p>{theme.prompt}</p>
        </div>
        <div className="theme-tags" aria-label="Theme tags">
          {theme.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      </section>

      <section className="studio-panel" aria-label="Style studio">
        <div className="studio-heading">
          <div>
            <h2><Palette /> Style the look</h2>
            <p>No chat. No public profiles. Just safe creative cards.</p>
          </div>
          <div className="score-orb" style={{ '--score': `${run.scorePreview}%` } as React.CSSProperties}>
            <span>{run.scorePreview}%</span>
          </div>
        </div>

        <AvatarPreview selected={selected} />

        <div className="broono-line">
          <div className={`tiny-broono mood-${pet.mood}`}>
            <span className="tiny-ear left" />
            <span className="tiny-ear right" />
            <span className="tiny-face" />
          </div>
          <div>
            <strong>{pet.name} says:</strong>
            <span>{submitted ? 'That look is ready for the runway card.' : 'Pick pieces that match the theme tags.'}</span>
          </div>
        </div>

        <div className="action-row">
          <button className="primary-action" onClick={submit}><Camera /> Create Broono Card</button>
          <button className="secondary-action" onClick={remix}><RefreshCw /> New theme</button>
        </div>

        {submitted && (
          <div className="result-card" role="status">
            <BroonoCardView card={submitted} />
            <p>Saved locally. Share exports stay on-device until a parent enables sharing.</p>
          </div>
        )}
      </section>

      <section className="wardrobe-panel" aria-label="Wardrobe">
        <div className="section-heading">
          <h2><WandSparkles /> Wardrobe</h2>
          <span>{inventory.ownedItemIds.length}/{wardrobeItems.length} owned</span>
        </div>
        {outfitCategories.map((category) => (
          <WardrobeRail
            key={category}
            category={category}
            selectedId={selected[category]}
            ownedItemIds={inventory.ownedItemIds}
            onSelect={selectItem}
          />
        ))}
        <WardrobeRail
          category="backdrop"
          selectedId={selected.backdrop}
          ownedItemIds={inventory.ownedItemIds}
          onSelect={selectItem}
        />
      </section>

      <section className="gift-panel" aria-label="Friday gift">
        <div>
          <span className="eyebrow"><Gift /> Friday gift</span>
          <h2>Claim a safe remix prop.</h2>
          <p>Weekly free drops create habit without pressure, ads, loot boxes, or paywalls.</p>
        </div>
        <button className="gift-button" onClick={claimGift} disabled={inventory.fridayGiftClaimed}>
          <Gift /> {inventory.fridayGiftClaimed ? 'Gift claimed' : 'Claim gift'}
        </button>
      </section>

      <section className="vote-panel" aria-label="Safe voting">
        <div className="section-heading">
          <h2><Trophy /> Vote safely</h2>
          <span><ShieldCheck /> No comments</span>
        </div>
        <div className="vote-grid">
          {run.voteCards.map((card) => (
            <div className="vote-card" key={card.id}>
              <BroonoCardView card={card} compact />
              <div className="reaction-row">
                {Object.entries(reactionLabels).map(([id, label]) => (
                  <button key={id} onClick={() => vote(card.id, id as keyof BroonoCard['reactions'])}>
                    <Star /> {label} <strong>{card.reactions[id as keyof BroonoCard['reactions']]}</strong>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cards-panel" aria-label="Saved Broono Cards">
        <div className="section-heading">
          <h2><BadgeCheck /> My cards</h2>
          <span>{run.savedCards.length}/7 saved</span>
        </div>
        {run.savedCards.length === 0 ? (
          <p className="empty-state">Create your first Broono Card to start a local style album.</p>
        ) : (
          <div className="saved-grid">
            {run.savedCards.map((card) => <BroonoCardView key={card.id} card={card} compact />)}
          </div>
        )}
      </section>

      <section className="parent-panel" aria-label="Parent safe account area">
        <div className="section-heading">
          <h2><UserRound /> Account</h2>
          <span>{platform} / sync {syncStatus}</span>
        </div>
        <div className="player-chip"><UserRound /> {user.displayName}</div>
        <div className="auth-row">
          {supportedAuthProviders.map((provider) => (
            <button key={provider.id} onClick={() => signInAs(provider.id)}>{provider.label}</button>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
