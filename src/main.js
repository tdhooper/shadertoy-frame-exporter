/* eslint-env browser */
const { saveAs } = require('file-saver');
const startCapture = require('web-frames-capture/src/main/capture');
const startPreview = require('web-frames-capture/src/main/preview');
const Controls = require('./controls');
const Client = require('./client');

const init = () => {
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
    let wasPaused = false;
    capture.on('ready', () => {
      if (client.paused) {
        wasPaused = true;
        client.unpause();
      }
    });
    capture.on('captureFinished', () => {
      if (wasPaused) {
        client.pause();
      }
    });
    capture.on('finished', () => {
      controls.saveFinished();
    });
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
    preview.on('ready', () => {
      if (client.paused) {
        preview.pause();
      }
    });
  });

  controls.on('stopPreview', () => {
    if (preview) {
      preview.cancel();
      capture = undefined;
    }
  });

  controls.on('settingsChanged', () => {
    if (preview) {
      preview.cancel();
      preview = startPreview(controls.settings, client);
      preview.on('ready', () => {
        if (client.paused) {
          preview.pause();
        }
      });
    }
  });

  client.on('paused', () => {
    if (preview) {
      preview.pause();
    }
  });

  client.on('unpaused', () => {
    if (preview) {
      preview.unpause();
    }
  });
};

const waitForShaderToy = () => {
  if (window.gShaderToy) {
    init();
  } else {
    setTimeout(waitForShaderToy, 100);
  }
};

waitForShaderToy();
