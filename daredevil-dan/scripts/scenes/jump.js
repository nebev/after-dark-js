import { Sprites as SpriteClass } from "../utils/sprites.js";
import { Config } from "../config.js";
import { rnd } from "../utils/misc.js";

let Sprites;

export class Jump {
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
    const { stage } = this;
    const { height, width, offscreenBuffer, successLikelihood } = Config;

    let numberOfBuses = 1;
    stage.direction = Math.random() >= 0.5 ? 'right' : 'left';
    if (stage.state.numberOfBuses) { numberOfBuses = stage.state.numberOfBuses + 1; }
    if (numberOfBuses > 8) { numberOfBuses = 1; }
    stage.state.numberOfBuses = numberOfBuses;
    stage.state.busYPos = rnd(height * 0.3, height * 0.65);
    stage.state.verdict = Math.random() > 0.3 ? 'win' : (Math.random() >= 0.5 ? 'wedgie' : 'bump')// TODO: CONFIG
    stage.state.totalRunUps = rnd(1, 4);
    // stage.state.finishedRunUps = 0;
    stage.state.finishedRunUps = 5;
    stage.state.dan = 'running-up';
    stage.sprites = {
      dan: Sprites.newSprite('dan-riding'),
      rampLeft: Sprites.newSprite('ramp'),
      rampRight: Sprites.newSprite('ramp'),
    };
    const totalBusLength = (numberOfBuses * 53);
    for (let busIdx = 0; busIdx < numberOfBuses; busIdx++) {
      const bus = Sprites.newSprite('bus-front');
      bus.y = stage.state.busYPos;
      bus.x = ((width / 2) - (totalBusLength / 2)) + (busIdx * 53);
      stage.sprites[`bus-${busIdx}`] = bus;
    }
    stage.sprites.dan.x = stage.direction === 'left' ? (width + offscreenBuffer) : (0 - offscreenBuffer);
    stage.sprites.dan.y = stage.state.busYPos + rnd(70, 120);
    stage.sprites.dan.scale.x *= stage.direction === 'right' ? 1 : -1;
    stage.sprites.rampLeft.y = stage.state.busYPos + 12;
    stage.sprites.rampLeft.x = (width / 2) - (totalBusLength / 2) - 80;
    stage.sprites.rampRight.y = stage.state.busYPos + 12;
    stage.sprites.rampRight.x = (width / 2) + (totalBusLength / 2) + 80;
    stage.sprites.rampRight.scale.x = -0.5;
    stage.state.totalLength = stage.sprites.rampRight.x - stage.sprites.rampLeft.x - 6;
    Object.keys(stage.sprites).forEach(a => this.app.stage.addChild(stage.sprites[a]));

    // Now compute Dan's failure rate
    if (successLikelihood < rnd(1, 100)) {
      // if (rnd(1, 100) > 40) {
      //   stage.state.verdict = 'bump';
      // } else {
      //   stage.state.verdict = 'wedgie';
      // }
      stage.state.verdict = 'wedgie';
    }

    console.log(stage);
  }

  animate(delta) {
    const { stage } = this;
    const { direction, state, sprites } = stage;
    const { offscreenBuffer, width } = Config;

    if (['running-up', 'riding', 'jump-up', 'jump-down', 'jump-done'].includes(state.dan)) {
      sprites.dan.x += direction === 'right' ? delta * Config.danSpeed : delta * -Config.danSpeed;
    }

    if (state.dan === 'running-up') {
      
      if (Sprites.spriteOutOfBounds(sprites.dan.x, offscreenBuffer * 2)) {
        state.finishedRunUps++;
        stage.direction = stage.direction === 'left' ? 'right' : 'left';
        sprites.dan.scale.x *= -1;
        if (state.finishedRunUps >= state.totalRunUps) {
          state.dan = 'riding';
          sprites.dan.y = state.busYPos + 7;
        }
      }
    } else if (state.dan === 'riding') {
      // We're getting ready to jump maybe?
      if (
        (direction === 'right' && sprites.dan.x > sprites.rampLeft.x - 12) ||
        (direction === 'left' && sprites.dan.x < sprites.rampRight.x + sprites.rampRight.width * 0.5 - 12)
      ) {
        if (state.verdict === 'wedgie') {
          state.dan = 'wedgie-up';
          sprites.dan = Sprites.swapSprites(sprites.dan, 'dan-wedgie');
          sprites.bike = Sprites.newSprite('bike-side');
          sprites.bike.x = sprites.dan.x;
          sprites.bike.y = sprites.dan.y;
          this.app.stage.addChild(sprites.bike);
          sprites.dan.y += 10;
          sprites.dan.scale.x *= -1; // This is counterintuitive, scaling already here, but sprite reversed
          if (direction === 'right') {
            sprites.bike.x += 37;
            sprites.bike.scale.x *= -1;
            sprites.bike.rotation = -0.47;
          } else {
            sprites.bike.y +=6;
            sprites.bike.rotation = 0.45;
            sprites.bike.x -= 41;
          }
        } else {
          sprites.dan = Sprites.swapSprites(sprites.dan, 'dan-diagonal');
          state.dan = 'jump-up';
        }
      }
    } else if (state.dan === 'wedgie-up') {
      sprites.bike.x += direction === 'right' ? delta * Config.danSpeed : delta * -Config.danSpeed;
      sprites.bike.y = state.busYPos - this._getJumpYPosition(sprites.bike.x - sprites.rampLeft.x, 30, state.totalLength);
      if (direction === 'right' && sprites.dan.x < sprites.rampLeft.x + 37) { sprites.dan.x += delta * Config.danSpeed; }
      else if (direction === 'left' && sprites.dan.x > sprites.rampRight.x - 37) { sprites.dan.x -= delta * Config.danSpeed; }
    } else if (state.dan === 'jump-up') {
      sprites.dan.y = state.busYPos - this._getJumpYPosition(sprites.dan.x - sprites.rampLeft.x, 30, state.totalLength);
      if (direction === 'left' && sprites.dan.x < width / 2) { state.dan = 'jump-down'; }
      if (direction === 'right' && sprites.dan.x > width / 2) { state.dan = 'jump-down'; }
    } else if (state.dan === 'jump-down') {
      sprites.dan.y = state.busYPos - this._getJumpYPosition(sprites.dan.x - sprites.rampLeft.x, 30, state.totalLength);
      if (sprites.dan.y > state.busYPos + 7) {
        // Switch back to riding
        state.dan = 'jump-done';
        sprites.dan = Sprites.swapSprites(sprites.dan, 'dan-riding');
      }
    } else if (state.dan === 'jump-done') {
      if (Sprites.spriteOutOfBounds(sprites.dan.x, offscreenBuffer * 2)) {
        const nextScene = rnd(1, 100) > 90 ? 'black-ride' : 'jump';
        return { sceneName: nextScene, delaySeconds: 1 };
      }
    }
  }

  _getJumpYPosition(x, baseAngle, baseLength) {
    // Get the right angle triangle height
    const tmpHeight = (baseLength / 2) * Math.tan(baseAngle * Math.PI / 180);
    if (x <= baseLength / 2) {
      return x / baseLength * tmpHeight * 2;
    }
    if (x > baseLength || x <= 0) { return 0; }
    return (baseLength - x) / baseLength * tmpHeight * 2;
  }

}