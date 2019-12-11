/* eslint-env browser */
const EventEmitter = require('events');
const mixInto = require('create-mixin');
const Client = require('web-frames-capture/src/client/client');
const { addClass, removeClass } = require('./dom');

class ShadertoyClient extends mixInto(EventEmitter)(Client) {
  constructor() {
    super(window.gShaderToy.mCanvas);
    this.player = document.getElementById('player');
  }

  setup(width, height) {
    return new Promise((resolve) => {
      this.originalWidth = window.gShaderToy.mCanvas.width;
      this.originalHeight = window.gShaderToy.mCanvas.height;
      this.originalGetRealTime = window.getRealTime;
      this.originalPauseTime = window.gShaderToy.pauseTime;
      this.originalRequestAnimationFrame = window.gShaderToy.mEffect.RequestAnimationFrame;

      addClass(this.player, 'sfe-recording');
      window.gShaderToy.resize(width, height);

      let realTime = 0;
      window.getRealTime = () => realTime;

      this.paused = window.gShaderToy.mIsPaused;
      window.gShaderToy.pauseTime = () => {
        this.originalPauseTime.call(window.gShaderToy);
        this.paused = window.gShaderToy.mIsPaused;
        if (window.gShaderToy.mIsPaused) {
          this.emit('paused');
        } else {
          this.emit('unpaused');
        }
      };

      // Capture the internal 'renderLoop2' method when it's passed to RequestAnimationFrame
      window.gShaderToy.mEffect.RequestAnimationFrame = (renderLoop2) => {

        // Disable this method so it can't be run again
        window.gShaderToy.mEffect.RequestAnimationFrame = () => {};

        // Seek to the beginning
        window.gShaderToy.resetTime();

        // Wrap the render function
        this._render = (milliseconds, quad, callback) => {
          realTime = milliseconds;
          renderLoop2();
          callback();
        };
        resolve();
      };
    });
  }

  pause() {
    if ( ! window.gShaderToy.mIsPaused) {
      window.gShaderToy.pauseTime();
    }
  }

  unpause() {
    if (window.gShaderToy.mIsPaused) {
      window.gShaderToy.pauseTime();
    }
  }

  teardown() {
    removeClass(this.player, 'sfe-recording');
    window.gShaderToy.resize(this.originalWidth, this.originalHeight);
    window.getRealTime = this.originalGetRealTime;
    window.gShaderToy.pauseTime = this.originalPauseTime;
    window.gShaderToy.mEffect.RequestAnimationFrame = this.originalRequestAnimationFrame;
    window.gShaderToy.resetTime();
    window.gShaderToy.startRendering();
  }
}

module.exports = ShadertoyClient;
