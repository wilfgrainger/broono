import Phaser from 'phaser';
import { initialState, nextPhase, refuel, type GameState } from './state';

const WORLD_SIZE = 2200;
const CAMP_X = WORLD_SIZE / 2;
const CAMP_Y = WORLD_SIZE / 2;

type ResourceKind = 'wood' | 'scraps';

export class SurvivalScene extends Phaser.Scene {
  private broono!: Phaser.Physics.Arcade.Sprite;
  private fire!: Phaser.GameObjects.Arc;
  private resources!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'E', Phaser.Input.Keyboard.Key>;
  private state: GameState = initialState();
  private elapsed = 0;
  private spawnElapsed = 0;
  private moveVector = new Phaser.Math.Vector2();

  constructor() {
    super('survival');
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
    this.cameras.main.setBackgroundColor('#263524');

    this.drawWorld();
    this.resources = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.seedResources();

    this.fire = this.add.circle(CAMP_X, CAMP_Y, 26, 0xf9a72f, 1).setDepth(3);
    this.add.circle(CAMP_X, CAMP_Y, 58, 0xffc24b, 0.10).setDepth(2);
    this.add.text(CAMP_X, CAMP_Y + 58, 'THE WARM LIGHT', {
      color: '#efe3b4', fontSize: '12px', fontStyle: 'bold',
    }).setOrigin(.5, 0).setDepth(4);

    this.broono = this.physics.add.sprite(CAMP_X + 90, CAMP_Y, 'broono').setDepth(5);
    this.broono.setCollideWorldBounds(true).setCircle(18, 6, 10);
    this.cameras.main.startFollow(this.broono, true, .09, .09);
    this.cameras.main.setZoom(1.1);

    this.physics.add.overlap(this.broono, this.resources, (_, item) => this.collect(item as Phaser.Physics.Arcade.Sprite));
    this.physics.add.overlap(this.broono, this.enemies, () => this.takeDamage());

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E') as typeof this.keys;
    this.keys.E.on('down', () => this.action());
    this.game.events.on('broono:move', this.setMove, this);
    this.game.events.on('broono:action', this.action, this);

    this.emitState();
  }

  update(_time: number, delta: number) {
    const keyboardX = Number(this.cursors.right.isDown || this.keys.D.isDown) - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const keyboardY = Number(this.cursors.down.isDown || this.keys.S.isDown) - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const movement = keyboardX || keyboardY ? new Phaser.Math.Vector2(keyboardX, keyboardY).normalize() : this.moveVector;
    this.broono.setVelocity(movement.x * 205, movement.y * 205);
    if (movement.x) this.broono.setFlipX(movement.x < 0);

    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      this.physics.moveToObject(enemy, this.broono, 58 + this.state.night * 2);
    });

    this.elapsed += delta;
    this.spawnElapsed += delta;
    if (this.elapsed >= 1000) {
      this.elapsed -= 1000;
      this.tick();
    }
    if (this.state.phase === 'night' && this.spawnElapsed > Math.max(2400, 6200 - this.state.night * 80)) {
      this.spawnElapsed = 0;
      this.spawnEnemy();
    }
  }

  private drawWorld() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x263524).fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    for (let i = 0; i < 320; i += 1) {
      const x = Phaser.Math.Between(30, WORLD_SIZE - 30);
      const y = Phaser.Math.Between(30, WORLD_SIZE - 30);
      if (Phaser.Math.Distance.Between(x, y, CAMP_X, CAMP_Y) < 160) continue;
      const shade = Phaser.Math.RND.pick([0x172819, 0x1d301e, 0x30432a]);
      graphics.fillStyle(shade, .9).fillCircle(x, y, Phaser.Math.Between(10, 24));
      graphics.fillStyle(0x443925, 1).fillRect(x - 3, y + 8, 6, 15);
    }

    const texture = this.make.graphics({ x: 0, y: 0 });
    texture.fillStyle(0x91b866).fillCircle(24, 24, 18);
    texture.fillStyle(0x536c3f).fillCircle(18, 18, 8);
    texture.fillStyle(0x28261e).fillCircle(31, 19, 3);
    texture.fillStyle(0xe9e2bc).fillRect(26, 29, 12, 5);
    texture.generateTexture('broono', 48, 48);
    texture.clear();
    texture.fillStyle(0x6f4c2e).fillRect(4, 4, 22, 22);
    texture.fillStyle(0x9a7246).fillCircle(15, 9, 8);
    texture.generateTexture('wood', 30, 30);
    texture.clear();
    texture.fillStyle(0x9aa39c).fillTriangle(3, 25, 16, 2, 29, 25);
    texture.generateTexture('scraps', 32, 32);
    texture.clear();
    texture.fillStyle(0x532b55).fillCircle(20, 20, 16);
    texture.fillStyle(0xe8cf87).fillCircle(14, 16, 3);
    texture.fillStyle(0xe8cf87).fillCircle(26, 16, 3);
    texture.generateTexture('enemy', 40, 40);
    texture.destroy();
  }

  private seedResources() {
    for (let i = 0; i < 70; i += 1) {
      const kind: ResourceKind = i % 5 === 0 ? 'scraps' : 'wood';
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(180, 980);
      const item = this.resources.create(
        CAMP_X + Math.cos(angle) * distance,
        CAMP_Y + Math.sin(angle) * distance,
        kind,
      ) as Phaser.Physics.Arcade.Sprite;
      item.setData('kind', kind).setDepth(2);
    }
  }

  private collect(item: Phaser.Physics.Arcade.Sprite) {
    if (!item.active) return;
    const kind = item.getData('kind') as ResourceKind;
    this.state = { ...this.state, [kind]: this.state[kind] + 1 };
    item.destroy();
    this.emitState(kind === 'wood' ? '+1 wood' : '+1 scrap');
  }

  private action() {
    const atCamp = Phaser.Math.Distance.Between(this.broono.x, this.broono.y, CAMP_X, CAMP_Y) < 125;
    if (atCamp) {
      const next = refuel(this.state);
      const changed = next !== this.state;
      this.state = next;
      this.emitState(changed ? 'The light burns brighter' : 'Find 2 wood to feed the light');
    } else {
      this.emitState('Return to the warm light or explore for supplies');
    }
  }

  private tick() {
    const fireDrain = this.state.phase === 'night' ? 1.25 : .35;
    const hunger = Math.max(0, this.state.hunger - .35);
    const fire = Math.max(0, this.state.fire - fireDrain);
    const secondsRemaining = this.state.secondsRemaining - 1;
    const exposed = this.state.phase === 'night' && Phaser.Math.Distance.Between(this.broono.x, this.broono.y, CAMP_X, CAMP_Y) > 210;
    const health = Math.max(0, this.state.health - (hunger === 0 ? 1 : 0) - (exposed ? .25 : 0));
    this.state = { ...this.state, fire, hunger, health, secondsRemaining };

    if (secondsRemaining <= 0) {
      this.state = nextPhase(this.state);
      if (this.state.phase === 'day') this.enemies.clear(true, true);
      this.cameras.main.flash(550, 235, 214, 152);
    }
    this.fire.setScale(.55 + this.state.fire / 120);
    this.cameras.main.setBackgroundColor(this.state.phase === 'night' ? '#080d12' : '#263524');
    this.emitState();
  }

  private spawnEnemy() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const enemy = this.enemies.create(
      this.broono.x + Math.cos(angle) * 430,
      this.broono.y + Math.sin(angle) * 430,
      'enemy',
    ) as Phaser.Physics.Arcade.Sprite;
    enemy.setDepth(4).setCircle(15, 5, 5);
  }

  private takeDamage() {
    const now = this.time.now;
    if (now < Number(this.broono.getData('safeUntil') ?? 0)) return;
    this.broono.setData('safeUntil', now + 900);
    this.state = { ...this.state, health: Math.max(0, this.state.health - 8) };
    this.cameras.main.shake(140, .008);
    this.emitState('A mireling bit Broono');
  }

  private setMove(vector: { x: number; y: number }) {
    this.moveVector.set(vector.x, vector.y);
  }

  private emitState(message?: string) {
    this.game.events.emit('broono:state', { ...this.state, message });
  }

  destroy() {
    this.game.events.off('broono:move', this.setMove, this);
    this.game.events.off('broono:action', this.action, this);
  }
}
