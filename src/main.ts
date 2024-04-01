const c = document.querySelector<HTMLCanvasElement>("#game_canvas")!;

const ctx = c.getContext("2d")!;

c.width = window.innerWidth / 2;
c.height = window.innerHeight / 2;

type SpaceGameOptions = {
  canvas: HTMLCanvasElement;
};

type PlayerOptions = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

type PlayerWeaponOptions = {
  ctx: CanvasRenderingContext2D;
  playerWidth: number;
};

type PlayerWeaponShotOptions = {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  direction: PlayerDirection;
  defaultWeaponWidth: number;
};

type EnemyOptions = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

type HitBoxOptions = {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  w: number;
  h: number;
};

enum PlayerDirection {
  Up,
  Left,
  Down,
  Right,
}

class SpaceGame {
  private _options: SpaceGameOptions;
  private _animationId = 0;
  private _player: Player;
  private _enemies: Enemy[] = [];
  private _gameOver = false;

  constructor(options: SpaceGameOptions) {
    this._options = options;
    this._player = new Player({
      canvas: options.canvas,
      ctx: this.ctx,
    });
  }

  start() {
    this._gameOver = false;
    this.animate();
    this.enemiesSpawnLoop();
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    this._player.draw();
    this.drawEnemies();
  }

  private update() {
    this._player.update();
    this.updateEnemies();
    this.handleShotEnemyCollision();
    this.handlePlayerEnemyCollision();
    this.handlePlayerWeaponEnemyCollision();
  }

  private animate() {
    if (this._gameOver) {
      cancelAnimationFrame(this._animationId);
      return;
    }
    this.draw();
    this.update();
    this._animationId = requestAnimationFrame(() => this.animate());
  }

  private enemiesSpawnLoop() {
    setInterval(() => {
      this._enemies.unshift(
        new Enemy({
          canvas: this._options.canvas,
          ctx: this.ctx,
        })
      );

      if (this._enemies.length >= 20) {
        this._enemies.pop();
      }
    }, 500);
  }

  private drawEnemies() {
    for (const enemy of this._enemies) {
      enemy.draw();
    }
  }

  private updateEnemies() {
    for (const enemy of this._enemies) {
      enemy.update();
    }
  }

  private handleShotEnemyCollision() {
    let shot: PlayerWeaponShot;
    let enemy: Enemy;
    for (let i = 0; i < this._player.weapon.shots.length; i++) {
      shot = this._player.weapon.shots[i];
      for (let j = 0; j < this._enemies.length; j++) {
        enemy = this._enemies[j];
        if (shot.hitbox.collision(enemy.hitbox)) {
          this._player.weapon.shots.splice(i, 1);
          this._enemies.splice(j, 1);
        }
      }
    }
  }

  private handlePlayerEnemyCollision() {
    let enemy: Enemy;
    for (let i = 0; i < this._enemies.length; i++) {
      enemy = this._enemies[i];
      if (this._player.hitbox.collision(enemy.hitbox)) {
        this._gameOver = true;
      }
    }
  }

  private handlePlayerWeaponEnemyCollision() {
    let enemy: Enemy;
    for (let i = 0; i < this._enemies.length; i++) {
      enemy = this._enemies[i];
      if (this._player.weapon.hitbox.collision(enemy.hitbox)) {
        this._gameOver = true;
      }
    }
  }

  get w(): number {
    return this._options.canvas.width;
  }

  get h(): number {
    return this._options.canvas.height;
  }

  get ctx(): CanvasRenderingContext2D {
    return this._options.canvas.getContext("2d")!;
  }
}

class Player {
  private _options: PlayerOptions;
  private _x: number;
  private _y: number;
  private _w = 60;
  private _h = 60;
  private _fillColor = "#444";
  private _weapon: PlayerWeapon;
  private _direction = PlayerDirection.Up;
  private _hitbox: HitBox;

  constructor(options: PlayerOptions) {
    this._options = options;
    this._x = (options.canvas.width - this._w) / 2;
    this._y = (options.canvas.height - this._h) / 2;
    this._weapon = new PlayerWeapon({
      ctx: options.ctx,
      playerWidth: this._w,
    });
    this._hitbox = new HitBox({
      ctx: options.ctx,
      x: this._x,
      y: this._y,
      w: this._w,
      h: this._h,
    });
    this.handleDirectionChange();
    this.handleKeyUpInput();
  }

  draw() {
    this._options.ctx.beginPath();
    this._options.ctx.fillStyle = this._fillColor;
    this._options.ctx.fillRect(this._x, this._y, this._w, this._h);
    this._options.ctx.fill();
    this._options.ctx.closePath();
    this._hitbox.draw();
    this._weapon.draw();
    this.drawWeaponAmmo();
  }

  update() {
    this._weapon.update();
  }

  private handleKeyUpInput() {
    document.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowUp":
          this.changeDirection(PlayerDirection.Up);
          break;

        case "ArrowLeft":
          this.changeDirection(PlayerDirection.Left);
          break;

        case "ArrowDown":
          this.changeDirection(PlayerDirection.Down);
          break;

        case "ArrowRight":
          this.changeDirection(PlayerDirection.Right);
          break;

        case " ":
          this._weapon.fire(this._direction);
          break;

        case "r":
          this._weapon.reload();
          break;
      }
    });
  }

  private changeDirection(dir: PlayerDirection) {
    this._direction = dir;
    this.handleDirectionChange();
  }

  private handleDirectionChange() {
    if (this._direction === PlayerDirection.Up) {
      this._weapon.adjustWeapon(
        this._x + this._weapon.defaultWidth - this._weapon.defaultHeight / 2,
        this._y - this._h / 2,
        this._weapon.defaultHeight,
        this._h / 2
      );
    }

    if (this._direction === PlayerDirection.Left) {
      this._weapon.adjustWeapon(
        this._x - this._w / 2,
        this._y + this._weapon.defaultWidth - this._weapon.defaultHeight / 2,
        this._w / 2,
        this._weapon.defaultHeight
      );
    }

    if (this._direction === PlayerDirection.Down) {
      this._weapon.adjustWeapon(
        this._x + this._weapon.defaultWidth - this._weapon.defaultHeight / 2,
        this._y + this._h,
        this._weapon.defaultHeight,
        this._h / 2
      );
    }

    if (this._direction === PlayerDirection.Right) {
      this._weapon.adjustWeapon(
        this._x + this._w,
        this._y + this._weapon.defaultWidth - this._weapon.defaultHeight / 2,
        this._w / 2,
        this._weapon.defaultHeight
      );
    }
  }

  private drawWeaponAmmo() {
    const text = this._weapon.ammo.toString();
    const textWidth = this._options.ctx.measureText(text).width;

    this._options.ctx.beginPath();
    this._options.ctx.fillStyle = "#fff";
    this._options.ctx.font = "25px Arial";
    this._options.ctx.fillText(
      text,
      this._x + this._w / 2,
      this._y + this._h / 2 + textWidth - 2
    );
    this._options.ctx.textAlign = "center";
    this._options.ctx.fill();
    this._options.ctx.closePath();
  }

  get weapon(): PlayerWeapon {
    return this._weapon;
  }

  get hitbox(): HitBox {
    return this._hitbox;
  }
}

class PlayerWeapon {
  private _options: PlayerWeaponOptions;
  private _x = 0;
  private _y = 0;
  private _w: number;
  private _defaultWidth: number;
  private _h = 15;
  private _defaultHeight = this._h;
  private _fillColor = "#444";
  private _shots: PlayerWeaponShot[] = [];
  private _ammo = 3;
  private _hitbox: HitBox;

  constructor(options: PlayerWeaponOptions) {
    this._options = options;
    this._w = options.playerWidth / 2;
    this._defaultWidth = this._w;
    this._hitbox = new HitBox({
      ctx: options.ctx,
      x: this._x,
      y: this._y,
      w: this._w,
      h: this._h,
    });
  }

  draw() {
    this._options.ctx.beginPath();
    this._options.ctx.fillStyle = this._fillColor;
    this._options.ctx.fillRect(this._x, this._y, this._w, this._h);
    this._options.ctx.fill();
    this._options.ctx.closePath();
    this._hitbox.draw();
    this.drawShots();
  }

  update() {
    this.updateShots();
  }

  adjustWeapon(x: number, y: number, w: number, h: number) {
    this._x = x;
    this._y = y;
    this._w = w;
    this._h = h;
    this._hitbox.options.x = this._x;
    this._hitbox.options.y = this._y;
    this._hitbox.options.w = this._w;
    this._hitbox.options.h = this._h;
  }

  fire(direction: PlayerDirection) {
    if (this._ammo <= 0) return;

    this._shots.unshift(
      new PlayerWeaponShot({
        ctx: this._options.ctx,
        x: this._x,
        y: this._y,
        direction,
        defaultWeaponWidth: this._defaultWidth,
      })
    );
    this._ammo--;
  }

  reload() {
    if (this._ammo > 0) return;
    this._ammo = 3;
  }

  private drawShots() {
    for (const shot of this._shots) {
      shot.draw();
    }
  }

  private updateShots() {
    for (const shot of this._shots) {
      shot.update();
    }
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  get defaultWidth(): number {
    return this._defaultWidth;
  }

  get defaultHeight(): number {
    return this._defaultHeight;
  }

  get shots(): PlayerWeaponShot[] {
    return this._shots;
  }

  get ammo(): number {
    return this._ammo;
  }

  get hitbox(): HitBox {
    return this._hitbox;
  }
}

class PlayerWeaponShot {
  private _options: PlayerWeaponShotOptions;
  private _size = 5;
  private _speed = 3;
  private _fillColor = "#444";
  private _hitbox: HitBox;

  constructor(options: PlayerWeaponShotOptions) {
    this._options = options;
    this._hitbox = new HitBox({
      ctx: options.ctx,
      x: this._options.x,
      y: this._options.y,
      w: this._size,
      h: this._size,
    });
  }

  draw() {
    this._options.ctx.beginPath();
    this._options.ctx.fillStyle = this._fillColor;
    if (this._options.direction === PlayerDirection.Up) {
      this._options.ctx.arc(
        this._options.x + this._size + this._size / 2,
        this._options.y,
        this._size,
        0,
        Math.PI * 2
      );
      this._hitbox.options.x =
        this._options.x + this._size + this._size / 2 - this._size;
      this._hitbox.options.y = this._options.y - this._size;
    }
    if (this._options.direction === PlayerDirection.Left) {
      this._options.ctx.arc(
        this._options.x,
        this._options.y + this._size + this._size / 2,
        this._size,
        0,
        Math.PI * 2
      );
      this._hitbox.options.x = this._options.x - this._size;
      this._hitbox.options.y =
        this._options.y + this._size + this._size / 2 - this._size;
    }
    if (this._options.direction === PlayerDirection.Down) {
      this._options.ctx.arc(
        this._options.x + this._size + this._size / 2,
        this._options.y + this._options.defaultWeaponWidth,
        this._size,
        0,
        Math.PI * 2
      );
      this._hitbox.options.x =
        this._options.x + this._size + this._size / 2 - this._size;
      this._hitbox.options.y =
        this._options.y + this._options.defaultWeaponWidth - this._size;
    }
    if (this._options.direction === PlayerDirection.Right) {
      this._options.ctx.arc(
        this._options.x + this._options.defaultWeaponWidth,
        this._options.y + this._size + this._size / 2,
        this._size,
        0,
        Math.PI * 2
      );
      this._hitbox.options.x =
        this._options.x + this._options.defaultWeaponWidth - this._size;
      this._hitbox.options.y =
        this._options.y + this._size + this._size / 2 - this._size;
    }
    this._options.ctx.fill();
    this._options.ctx.closePath();
    this._hitbox.draw();
  }

  update() {
    if (this._options.direction === PlayerDirection.Up) {
      this._options.y -= this._speed;
    }

    if (this._options.direction === PlayerDirection.Left) {
      this._options.x -= this._speed;
    }

    if (this._options.direction === PlayerDirection.Down) {
      this._options.y += this._speed;
    }

    if (this._options.direction === PlayerDirection.Right) {
      this._options.x += this._speed;
    }
  }

  get hitbox(): HitBox {
    return this._hitbox;
  }
}

class Enemy {
  private _options: EnemyOptions;
  private _direction = this.randomDirection();
  private _x = 0;
  private _y = 0;
  private _size = 25;
  private _fillColor = "#444";
  private _hitbox: HitBox;

  constructor(options: EnemyOptions) {
    this._options = options;
    this._hitbox = new HitBox({
      ctx: options.ctx,
      x: this._x,
      y: this._y,
      w: this._size,
      h: this._size,
    });
  }

  draw() {
    this._options.ctx.beginPath();
    this._options.ctx.fillStyle = this._fillColor;
    if (this._direction === PlayerDirection.Up) {
      this._options.ctx.fillRect(
        this._x + this._options.canvas.width / 2 - this._size + this._size / 2,
        this._y + this._options.canvas.height - this._size,
        this._size,
        this._size
      );
      this._hitbox.options.x =
        this._x + this._options.canvas.width / 2 - this._size + this._size / 2;
      this._hitbox.options.y =
        this._y + this._options.canvas.height - this._size;
    }
    if (this._direction === PlayerDirection.Left) {
      this._options.ctx.fillRect(
        this._x + this._options.canvas.width - this._size + this._size / 2,
        this._y + this._options.canvas.height / 2 - this._size + this._size / 2,
        this._size,
        this._size
      );
      this._hitbox.options.x =
        this._x + this._options.canvas.width - this._size + this._size / 2;
      this._hitbox.options.y =
        this._y + this._options.canvas.height / 2 - this._size + this._size / 2;
    }
    if (this._direction === PlayerDirection.Down) {
      this._options.ctx.fillRect(
        this._x + this._options.canvas.width / 2 - this._size + this._size / 2,
        this._y + 0 - this._size,
        this._size,
        this._size
      );
      this._hitbox.options.x =
        this._x + this._options.canvas.width / 2 - this._size + this._size / 2;
      this._hitbox.options.y = this._y + 0 - this._size;
    }
    if (this._direction === PlayerDirection.Right) {
      this._options.ctx.fillRect(
        this._x + 0 - this._size + this._size / 2,
        this._y + this._options.canvas.height / 2 - this._size + this._size / 2,
        this._size,
        this._size
      );
      this._hitbox.options.x = this._x + 0 - this._size + this._size / 2;
      this._hitbox.options.y =
        this._y + this._options.canvas.height / 2 - this._size + this._size / 2;
    }
    this._options.ctx.fill();
    this._options.ctx.closePath();
    this._hitbox.draw();
  }

  update() {
    if (this._direction === PlayerDirection.Up) {
      this._y--;
    }
    if (this._direction === PlayerDirection.Left) {
      this._x--;
    }
    if (this._direction === PlayerDirection.Down) {
      this._y++;
    }
    if (this._direction === PlayerDirection.Right) {
      this._x++;
    }
  }

  private randomDirection(): PlayerDirection {
    const directionsList: PlayerDirection[] = [
      PlayerDirection.Up,
      PlayerDirection.Left,
      PlayerDirection.Down,
      PlayerDirection.Right,
    ];

    return directionsList[Math.floor(Math.random() * directionsList.length)];
  }

  get hitbox(): HitBox {
    return this._hitbox;
  }
}

class HitBox {
  private _options: HitBoxOptions;
  private _fillColor = "transparent";

  constructor(options: HitBoxOptions) {
    this._options = options;
  }

  draw() {
    this._options.ctx.beginPath();
    this._options.ctx.fillStyle = this._fillColor;
    this._options.ctx.fillRect(
      this._options.x,
      this._options.y,
      this._options.w + 5,
      this._options.h + 5
    );
    this._options.ctx.fill();
    this._options.ctx.closePath();
  }

  collision(hitbox: HitBox): boolean {
    return (
      this._options.x < hitbox.options.x + hitbox.options.w &&
      this._options.x + this._options.w > hitbox.options.x &&
      this._options.y < hitbox.options.y + hitbox.options.h &&
      this._options.y + this._options.h > hitbox.options.y
    );
  }

  get options(): HitBoxOptions {
    return this._options;
  }
}

const game = new SpaceGame({ canvas: c });

document.addEventListener("DOMContentLoaded", () => {
  game.start();
});
