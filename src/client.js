/* eslint-env browser */
const Client = require('web-frames-capture/src/client/client');
const { addClass, removeClass } = require('./dom');

class ShadertoyClient extends Client {
  constructor() {
    super(window.gShaderToy.mCanvas);
    this.player = document.getElementById('player');
  }

  setup(width, height) {
    return new Promise((resolve) => {
      this.originalWidth = window.gShaderToy.mCanvas.width;
      this.originalHeight = window.gShaderToy.mCanvas.height;
      this.originalGetRealTime = window.getRealTime;
      this.originalRequestAnimationFrame = window.gShaderToy.mEffect.RequestAnimationFrame;

      addClass(this.player, 'sfe-recording');
      window.gShaderToy.resize(width, height);

      let realTime = 0;
      window.getRealTime = () => realTime;

      // Capture the internal 'renderLoop2' method when it's passed to RequestAnimationFrame
      window.gShaderToy.mEffect.RequestAnimationFrame = (renderLoop2) => {
        window.gShaderToy.mEffect.RequestAnimationFrame = () => {};
        this._render = (milliseconds, quad, callback) => {
          realTime = milliseconds;
          renderLoop2();
          callback();
        };
        resolve();
      };
    });
  }

  teardown() {
    removeClass(this.player, 'sfe-recording');
    window.gShaderToy.resize(this.originalWidth, this.originalHeight);
    window.getRealTime = this.originalGetRealTime;
    window.gShaderToy.mEffect.RequestAnimationFrame = this.originalRequestAnimationFrame;
  }
}

module.exports = ShadertoyClient;
