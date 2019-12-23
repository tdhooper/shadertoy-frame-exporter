/* eslint-env browser */
const { saveAs } = require('file-saver');
const startCapture = require('web-frames-capture/src/main/capture');
const startPreview = require('web-frames-capture/src/main/preview');
// const WebSocketEmitter = require('web-frames-capture/src/cli/websocket-events');
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

  // const params = new URLSearchParams(window.location.search);
  // const port = params.get('port');

  // const upload = (blob, name) => {
  //   const form = new FormData();
  //   form.append('image', blob, name);
  //   const f = fetch(`http://localhost:${port}/save`, {
  //     method: 'POST',
  //     body: form,
  //   });
  //   return f.then(response => response.text());
  // };

  // const ws = new WebSocket('ws://localhost:8080');
  // ws.onopen = () => {
  //   capture = startCapture(controls.settings, client, upload);
  //   capture.on('finished', () => {
  //     ws.send(JSON.stringify({
  //       type: 'done',
  //     }));
  //   });
  //   capture.on('ready', () => {
  //     ws.send(JSON.stringify({
  //       type: 'start',
  //       data: controls.settings,
  //     }));
  //   });

  //   const wsevents = new WebSocketEmitter();

  //   wsevents.on('close', () => {
  //     window.close();
  //   });

  //   ws.onmessage = (message) => {
  //     wsevents.onmessage(message.data);
  //   };

  //   window.addEventListener('beforeunload', () => {
  //     ws.send(JSON.stringify({
  //       type: 'exit',
  //     }));
  //   });
  // };
};

const waitForShaderToy = () => {
  if (window.gShaderToy) {
    init();
  } else {
    setTimeout(waitForShaderToy, 100);
  }
};

waitForShaderToy();
