const { saveAs } = require('file-saver');
const startCapture = require('web-frames-capture/src/main/capture');
const startPreview = require('web-frames-capture/src/main/preview');
const Controls = require('./controls');
const Client = require('./client');

setTimeout(() => {
  const save = (blob, name) => new Promise((resolve) => {
    saveAs(blob, name);
    setTimeout(resolve, 100);
  });

  let capture;
  let preview;

  const client = new Client();
  const controls = new Controls();

  controls.on('startCapture', () => {
    if (capture) {
      capture.cancel();
    }
    capture = startCapture(controls.settings, client, save);
    capture.on('finished', () => controls.saveFinished());
    capture.on('error', () => controls.saveFinished());
  });

  controls.on('stopCapture', () => {
    if (capture) {
      capture.cancel();
      capture = undefined;
    }
  });

  controls.on('startPreview', () => {
    if (preview) {
      preview.cancel();
    }
    preview = startPreview(controls.settings, client);
  });

  controls.on('stopPreview', () => {
    if (preview) {
      preview.cancel();
      capture = undefined;
    }
  });
}, 1000);
