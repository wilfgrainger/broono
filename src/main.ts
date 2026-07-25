import './style.css';
import type Phaser from 'phaser';
import { createGame } from './game/createGame';
import type { GameState } from './game/state';
import { signInWithGoogle, storedPlayer, type Player } from './platform/auth';

const app = document.querySelector<HTMLDivElement>('#app')!;
let game: Phaser.Game | undefined;

app.innerHTML = `
  <main class="shell">
    <div id="game"></div>
    <section class="login" id="login">
      <div class="login-card">
        <p class="eyebrow">An original survival adventure</p>
        <h1>BR<span class="zombie-o">OO</span>NO</h1>
        <p class="strapline">A good dog woke up undead. Keep the warm light alive, search the Wildwood by day and survive 99 nights.</p>
        <button class="primary" id="google-login">Continue with Google</button>
        <button class="secondary" id="guest-login">Play as guest</button>
        <p class="login-note" id="login-note">Progress syncs after Google sign-in.</p>
      </div>
    </section>
    <section class="hud" id="hud" hidden>
      <div class="hud-top">
        <div class="night-badge"><span id="phase">Day</span><strong>Night <b id="night">1</b> / 99</strong></div>
        <div class="resources"><span>🪵 <b id="wood">0</b></span><span>⚙️ <b id="scraps">0</b></span><span>🔥 <b id="fire">58</b>%</span></div>
      </div>
      <div class="objective" id="objective">Gather supplies. Return before dark.</div>
      <div class="controls">
        <div class="stick" id="stick"><div class="stick-knob"></div></div>
        <button class="action" id="action">Use</button>
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
  setText('phase', `${state.phase} · ${state.secondsRemaining}s`);
  setText('night', state.night);
  setText('wood', state.wood);
  setText('scraps', state.scraps);
  setText('fire', Math.round(state.fire));
  const defaultObjective = state.phase === 'day'
    ? 'Gather supplies. Return before dark.'
    : 'Stay close to the warm light. Mirelings are hunting.';
  setText('objective', state.message ?? defaultObjective);
};

const setText = (id: string, value: string | number) => {
  const node = document.getElementById(id);
  if (node) node.textContent = String(value);
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
  const vector = new DOMPoint(x, y);
  const length = Math.hypot(vector.x, vector.y) || 1;
  const max = 30;
  const scale = Math.min(max, length) / length;
  stick.style.setProperty('--stick-x', `${vector.x * scale}px`);
  stick.style.setProperty('--stick-y', `${vector.y * scale}px`);
  game.events.emit('broono:move', { x: vector.x / length, y: vector.y / length });
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
document.querySelector('#action')!.addEventListener('click', () => game?.events.emit('broono:action'));
