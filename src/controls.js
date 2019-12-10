/* eslint-env browser */
const EventEmitter = require('events');
const { addClass, insertAfter } = require('./dom');

class Controls extends EventEmitter {
  constructor() {
    super();

    this.player = document.getElementById('player');
    this.controls = document.createElement('div');
    addClass(this.controls, 'sfe-controls');
    insertAfter(this.controls, this.player);

    this.widthInput = this.createInput('width', 'number', 500);
    this.heightInput = this.createInput('height', 'number', 500);
    this.fpsInput = this.createInput('fps', 'number', 30);
    this.secondsInput = this.createInput('seconds', 'number', 1);
    this.prefixInput = this.createInput('prefix', 'text', 'img');

    const previewInput = this.createInput('preview', 'checkbox');
    previewInput.addEventListener('click', () => {
      if (previewInput.checked) {
        this.emit('startPreview');
      } else {
        this.emit('stopPreview');
      }
    });

    const button = document.createElement('button');
    button.textContent = 'Save frames';
    addClass(button, 'sfe-save');
    this.controls.appendChild(button);
    button.addEventListener('click', () => {
      this.emit('startCapture');
      // TODO add stop button
    });

    this.settingsChanged();
  }

  settingsChanged() {
    const settings = {
      width: this.widthInput.value,
      height: this.heightInput.value,
      fps: this.fpsInput.value,
      seconds: this.secondsInput.value,
      prefix: this.prefixInput.value,
    };

    if (this.preview && JSON.stringify(this.settings) !== JSON.stringify(settings)) {
      this.emit('startPreview');
    }

    this.settings = settings;
  }

  createInput(name, type, value) {
    const id = name;

    const label = document.createElement('label');
    label.textContent = name;
    label.setAttribute('for', id);
    addClass(label, 'sfe-label');

    const input = document.createElement('input');
    input.id = id;
    input.type = type;
    input.value = value;
    addClass(input, 'sfe-input');

    input.addEventListener('change', this.settingsChanged.bind(this));
    input.addEventListener('blur', this.settingsChanged.bind(this));

    const control = document.createElement('div');
    addClass(control, 'sfe-control');
    addClass(control, `sfe-control--${type}`);

    control.appendChild(label);
    control.appendChild(input);
    this.controls.appendChild(control);

    return input;
  }
}

module.exports = Controls;
