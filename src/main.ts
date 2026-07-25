import './style.css';
import { createGame, type GameClient } from './game/createGame';
import type { GameState } from './game/state';
import { signInWithGoogle, storedPlayer, type Player } from './platform/auth';

const app = document.querySelector<HTMLDivElement>('#app')!;
let game: GameClient | undefined;

app.innerHTML = `
  <main class="shell">
    <div id="game"></div>
    <section class="login" id="login">
      <div class="title-vignette" aria-hidden="true"></div>
      <div class="login-card">
        <p class="eyebrow">A ZOMBIE DOG SURVIVAL ADVENTURE</p>
        <h1>BR<span class="zombie-o">OO</span>NO</h1>
        <div class="night-rule"><span></span><b>99 NIGHTS</b><span></span></div>
        <p class="strapline">Gather by daylight. Feed the fire. When the Wildwood wakes, be a very good dead dog.</p>
        <button class="primary" id="google-login">
          <span class="google-mark">G</span>
          Continue with Google
        </button>
        <button class="secondary" id="guest-login">Enter the forest</button>
        <p class="login-note" id="login-note">Google sign-in keeps your survival record safe.</p>
      </div>
    </section>
    <section class="hud" id="hud" hidden>
      <div class="hud-top">
        <div class="vitals" aria-label="Broono's condition">
          <div class="portrait"><span class="portrait-eye"></span></div>
          <div class="vital-bars">
            <div class="vital health"><span id="health-bar"></span><b>+</b></div>
            <div class="vital hunger"><span id="hunger-bar"></span><b>◆</b></div>
          </div>
        </div>

        <div class="night-badge">
          <span id="phase">DAY · 48s</span>
          <strong>NIGHT <b id="night">1</b> <i>/ 99</i></strong>
          <div class="day-track"><span id="day-progress"></span></div>
        </div>

        <div class="resources" aria-label="Collected resources">
          <span><i class="wood-icon">▰</i><b id="wood">0</b></span>
          <span><i class="scrap-icon">⚙</i><b id="scraps">0</b></span>
          <span><i class="fire-icon">♦</i><b id="fire">58</b>%</span>
        </div>
      </div>

      <div class="objective" id="objective">Gather supplies. Return before dark.</div>

      <div class="hud-bottom">
        <div class="controls">
          <div class="stick" id="stick" aria-label="Movement control">
            <div class="stick-ring"></div>
            <div class="stick-knob"></div>
          </div>
        </div>

        <div class="hotbar" aria-label="Inventory">
          <div class="slot active"><span class="slot-icon bag">▱</span><small>PACK</small></div>
          <div class="slot"><span class="slot-icon paw">♢</span><small>PAWS</small></div>
          <div class="slot"><span class="slot-icon empty">+</span><small>EMPTY</small></div>
        </div>

        <button class="action" id="action">
          <span class="action-icon">🔥</span>
          <small>USE</small>
        </button>
      </div>
    </section>
  </main>
`;

const login = document.querySelector<HTMLElement>('#login')!;
const hud = document.querySelector<HTMLElement>('#hud')!;
const note = document.querySelector<HTMLElement>('#login-note')!;

const begin = (player?: Player) => {
  login.hidden = true;
  hud.hidden = false;
  game = createGame('game');
  game.events.on('broono:state', renderState);
  note.textContent = player ? `Welcome back, ${player.name}` : 'Guest progress stays on this device';
};

const renderState = (state: GameState & { message?: string }) => {
  const phaseName = state.phase.toUpperCase();
  setText('phase', `${phaseName} · ${state.secondsRemaining}s`);
  setText('night', state.night);
  setText('wood', state.wood);
  setText('scraps', state.scraps);
  setText('fire', Math.round(state.fire));
  setWidth('health-bar', state.health);
  setWidth('hunger-bar', state.hunger);
  const phaseDuration = state.phase === 'day' ? 50 : 35;
  setWidth('day-progress', 100 - (state.secondsRemaining / phaseDuration) * 100);
  const defaultObjective = state.phase === 'day'
    ? 'Gather supplies. Return before dark.'
    : 'Stay inside the firelight. Mirelings are hunting.';
  setText('objective', state.message ?? defaultObjective);
  document.body.dataset.phase = state.phase;
};

const setText = (id: string, value: string | number) => {
  const node = document.getElementById(id);
  if (node) node.textContent = String(value);
};

const setWidth = (id: string, value: number) => {
  const node = document.getElementById(id) as HTMLElement | null;
  if (node) node.style.width = `${Math.max(0, Math.min(100, value))}%`;
};

document.querySelector('#guest-login')!.addEventListener('click', () => begin());
document.querySelector('#google-login')!.addEventListener('click', async () => {
  try {
    note.textContent = 'Opening Google sign-in…';
    begin(await signInWithGoogle());
  } catch (error) {
    note.textContent = error instanceof Error ? error.message : 'Sign-in failed';
  }
});

const existing = storedPlayer();
if (existing) begin(existing);

const stick = document.querySelector<HTMLElement>('#stick')!;
const updateStick = (event: PointerEvent) => {
  if (!game) return;
  const box = stick.getBoundingClientRect();
  const x = event.clientX - (box.left + box.width / 2);
  const y = event.clientY - (box.top + box.height / 2);
  const length = Math.hypot(x, y) || 1;
  const max = box.width * 0.28;
  const scale = Math.min(max, length) / length;
  stick.style.setProperty('--stick-x', `${x * scale}px`);
  stick.style.setProperty('--stick-y', `${y * scale}px`);
  game.events.emit('broono:move', { x: x / length, y: y / length });
};

stick.addEventListener('pointerdown', (event) => {
  stick.setPointerCapture(event.pointerId);
  updateStick(event);
});
stick.addEventListener('pointermove', (event) => {
  if (stick.hasPointerCapture(event.pointerId)) updateStick(event);
});
stick.addEventListener('pointerup', (event) => {
  stick.releasePointerCapture(event.pointerId);
  stick.style.setProperty('--stick-x', '0px');
  stick.style.setProperty('--stick-y', '0px');
  game?.events.emit('broono:move', { x: 0, y: 0 });
});
stick.addEventListener('pointercancel', () => {
  stick.style.setProperty('--stick-x', '0px');
  stick.style.setProperty('--stick-y', '0px');
  game?.events.emit('broono:move', { x: 0, y: 0 });
});
document.querySelector('#action')!.addEventListener('click', () => game?.events.emit('broono:action'));
