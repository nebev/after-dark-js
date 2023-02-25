import { GetAnimations } from "./animation.js";
import { Config } from "../config.js";

const { Assets, Sprite } = PIXI;

let spriteInstance = null;

export class Sprites {
    spriteAssets;
    spriteAnimations;
    app;

    static async getInstance(app) {
        if (!spriteInstance) {
            spriteInstance = new Sprites(app);
            await spriteInstance.init();
        }
        return spriteInstance;
    }

    constructor(app) {
        this.app = app;
    }

    async init() {
        this.spriteAssets = await Assets.load('./sprites/dan.json');
        this.spriteAnimations = GetAnimations(this.spriteAssets.textures);
    }

    newSprite(spriteName) {
        const tmpSprite = new Sprite(this.spriteAssets.textures[spriteName]);
        tmpSprite.width *= 0.5;
        tmpSprite.height *= 0.5;
        tmpSprite.pivot.x = 0.5;
        tmpSprite.pivot.y = 0.5;
        return tmpSprite;
    }

    swapSprites(oldSprite, newSpriteName) {
        const ns = this.newSprite(newSpriteName);
        ns.x = oldSprite.x;
        ns.y = oldSprite.y;
        ns.scale.x = oldSprite.scale.x;
        this.app.stage.removeChild(oldSprite);
        this.app.stage.addChild(ns);
        return ns;
    }

    spriteOutOfBounds(spriteToCheck, gracePixels) {
        const { width } = Config;
        return spriteToCheck > width + gracePixels || spriteToCheck < -gracePixels; 
    }

}
