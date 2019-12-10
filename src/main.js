const { saveAs } = require('file-saver');
const startCapture = require('web-frames-capture/src/main/capture');
const startPreview = require('web-frames-capture/src/main/preview');
const Controls = require('./controls');
const Client = require('./client');

setTimeout(() => {
  const save = (blob, name) => new Promise((resolve) => {
    saveAs(blob, name);
    resolve();
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
  });

  controls.on('stopCapture', () => {
    if (capture) {
      capture.cancel();
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
    }
  });
}, 3000);
