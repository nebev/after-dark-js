import { Config } from './config.js';
import { BlackRide } from './scenes/black-ride.js';
import { Jump } from './scenes/jump.js';
import { Sprites } from './utils/sprites.js';

const width = 800;
const height = 600;

// window.PIXI = PIXI;
// global.PIXI = PIXI;


document.addEventListener("DOMContentLoaded", async function (event) {

  const app = new PIXI.Application({ width, height });
  const stage = {
    sceneType: '',
    state: {},
    sprites: {},
    direction: '',
  };
  await Sprites.getInstance(app); // Initialise the sprites
  


  const sceneClasses = {
    'black-ride': new BlackRide(app, stage),
    'jump': new Jump(app, stage),
  };

  await Promise.all(Object.keys(sceneClasses).map(a => sceneClasses[a]).filter(a => a.init).map(a => a.init()));

  function newScene(delaySeconds = 0) {
    stage.sceneType = 'waiting';
    setTimeout(() => {
      setScene('black-ride');
      // setScene('jump');
    }, delaySeconds * 1000);
  }

  const setScene = (sceneType) => {
    console.log(`Setting scene: ${sceneType}`);
    Object.keys(stage.sprites).forEach(s => {
      app.stage.removeChild(stage.sprites[s]);
      delete stage.sprites[s];
    })

    if (sceneType in sceneClasses) {
      sceneClasses[sceneType].setScene();
    }

    stage.sceneType = sceneType;
  }

  const animateScene = {

    

  };

  

  // let elapsed = 0.0;
  app.ticker.add((delta) => {
    if (stage.sceneType in sceneClasses) {
      const animationReturn = sceneClasses[stage.sceneType].animate(delta);
      if (animationReturn) {
        if (animationReturn.sceneName) {
          stage.sceneType = 'waiting';
          setTimeout(() => {
            setScene(animationReturn.sceneName); // Going to a specific scene
          }, (animationReturn.delaySeconds || 0) * 1000);
        } else if (animationReturn.delaySeconds) {
          newScene(animationReturn.delaySeconds); // Whatever the next scene is
        }
      }
    } else if (animateScene[stage.sceneType]) {
      animateScene[stage.sceneType](delta);
    }

  });

  // setScene('black-ride');
  setScene('jump');

  document.body.appendChild(app.view);
});
