import { Sprites as SpriteClass } from "../utils/sprites.js";
import { Config } from "../config.js";
import { rnd } from "../utils/misc.js";

let Sprites;

export class BlackRide {
  app = null;
  stage = null;

  constructor(app, stage) {
    this.app = app;
    this.stage = stage;
  }

  async init() {
    Sprites = await SpriteClass.getInstance(this.app);
  }

  setScene() {
    const { stage, app } = this;
    const { width, offscreenBuffer, height } = Config;
    stage.direction = Math.random() >= 0.5 ? 'right' : 'left';
    stage.state = { dan: 'riding', rocket: Math.random() >= 0.5 };
    stage.sprites.dan = Sprites.newSprite('dan-riding');
    stage.sprites.dan.x = stage.direction === 'left' ? (width + offscreenBuffer) : (0 - offscreenBuffer);
    stage.sprites.dan.scale.x *= stage.direction === 'left' ? -1 : 1;
    stage.sprites.dan.y = (Math.random() * height * 0.4) + (height * 0.3);
    app.stage.addChild(stage.sprites.dan);
  }

  animate(delta) {
    const { direction, state, sprites } = this.stage;
    const { width, offscreenBuffer, height } = Config;

    if (state.dan === 'riding') {
      sprites.dan.x += direction === 'right' ? delta * Config.danSpeed : delta * -Config.danSpeed;

      // Should we be blasting off?
      if (state.rocket && (
        (direction === 'left' && sprites.dan.x <= (width * 0.4)) ||
        (direction === 'right' && sprites.dan.x >= (width * 0.7))
      )) {
        state.dan = 'flying';
        const { x, y } = sprites.dan;
        sprites.dan.destroy();

        sprites.flyingDan = Sprites.spriteAnimations['dan-blastoff'];
        sprites.flyingDan.animationSpeed = 0.2;
        sprites.flyingDan.play();
        this.app.stage.addChild(sprites.flyingDan);
        sprites.flyingDan.x = x;
        sprites.flyingDan.y = y;
        sprites.flyingDan.scale.x = direction === 'right' ? -0.5 : 0.5;
      }
    } else if (state.dan === 'flying') {
      sprites.flyingDan.x += direction === 'right' ? delta * Config.danSpeed : delta * -Config.danSpeed;
      sprites.flyingDan.y -= delta * Config.danSpeed * 0.8;
    }

    const tmpDan = sprites.flyingDan ? sprites.flyingDan : sprites.dan;
    if (tmpDan.x > width + offscreenBuffer * 2 || tmpDan.x < -offscreenBuffer * 2) {
      const sceneRandomiser = rnd(1, 100);
      let newScene = 'jump';
      // if (sceneRandomiser > 0) {  }
      return { sceneName: newScene, delaySeconds: 3 };
    }
  }

}
