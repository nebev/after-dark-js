const { AnimatedSprite } = PIXI;

const animations = {
  'dan-blastoff': ['dan-blastoff-1', 'dan-blastoff-2'],
};

export const GetAnimations = (textures) => {
  const rtn = {};
  Object.keys(animations).forEach(a => {
    const textureArray = [];
    animations[a].forEach(b => {
      textureArray.push(textures[b]);
    });
    rtn[a] = new AnimatedSprite(textureArray);
    rtn[a].width *= 0.5;
    rtn[a].height *= 0.5;
  });
  return rtn;
};
