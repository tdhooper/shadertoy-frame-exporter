
var LoopingRecorder = function() {
    this.player = document.getElementById('player');
    this.createUi();
};

// Increment time by a fixed amount for each render
LoopingRecorder.prototype.beforeRender = function() {
    this.timeSeconds += 1 / this.fps;
    if (this.timeSeconds > this.loopSeconds) {
        this.stopRecording();
    }
};

LoopingRecorder.prototype.afterRender = function() {
    if (this.record) {
        this.saveFrame(gShaderToy.mCanvas);
    }
};

LoopingRecorder.prototype.startRecording = function() {

    this.record = true;

    // Add canvas layout styles
    this.addClass(this.player, 'slr-recording');

    // Resize canvas to desired size
    this.original_width = gShaderToy.mCanvas.width;
    this.original_height = gShaderToy.mCanvas.height;
    var width = parseInt(this.widthInput.value, 10);
    var height = parseInt(this.heightInput.value, 10);
    gShaderToy.resize(width, height);

    // Start playback if it's currently paused
    this.original_mIsPaused = gShaderToy.mIsPaused;
    if (gShaderToy.mIsPaused) {
        gShaderToy.pauseTime();
    }

    // Seek to the beginning
    this.original_mTf = gShaderToy.mTf;
    gShaderToy.resetTime();
    gShaderToy.mTo = 0;

    // Patch the time counter, so we can step through frames
    this.timeSeconds = 0;
    this.original_getRealTime = window.getRealTime;
    window.getRealTime = this.getRealTime.bind(this);

    // Store current settings
    this.fps = parseFloat(this.fpsInput.value);
    this.loopSeconds = parseFloat(this.secondsInput.value);
    this.frameNumber = 0;
    this.prefix = this.prefixInput.value;

    // Patch raf-loop
    this.original_RequestAnimationFrame = gShaderToy.mEffect.RequestAnimationFrame;
    gShaderToy.mEffect.RequestAnimationFrame = this.RequestAnimationFrame.bind(this);
};

LoopingRecorder.prototype.stopRecording = function() {

    this.record = false;

    // Remove canvas layout styles
    this.removeClass(this.player, 'lr-recording');

    // Reset canvas to original size
    gShaderToy.resize(this.original_width, this.original_height);

    // Pause playback if it was originally paused
    if (this.original_mIsPaused) {
        gShaderToy.pauseTime();
    }

    // Reset time to what it was before saving
    gShaderToy.mTf = this.original_mTf;

    // Remove time counter patch
    window.getRealTime = this.original_getRealTime;

    // Remove raf-loop patch
    gShaderToy.mEffect.RequestAnimationFrame = this.original_RequestAnimationFrame;
};


/* Shadertoy patches
   ========================================================================== */

// Control what happens before and after each render
LoopingRecorder.prototype.RequestAnimationFrame = function(render) {
    var patched = function() {
        this.beforeRender();
        render();
        this.afterRender();
    };
    this.original_RequestAnimationFrame.call(gShaderToy.mEffect, patched.bind(this));
};

LoopingRecorder.prototype.getRealTime = function() {
    return this.timeSeconds * 1000;
};


/* User interface
   ========================================================================== */

LoopingRecorder.prototype.createUi = function() {
    this.controls = document.createElement('div');
    this.addClass(this.controls, 'slr-controls');
    this.insertAfter(this.controls, this.player);

    this.widthInput = this.createInput('width', 'number', 500);
    this.heightInput = this.createInput('height', 'number', 500);
    this.fpsInput = this.createInput('fps', 'number', 30);
    this.secondsInput = this.createInput('seconds', 'number', 1);
    this.prefixInput = this.createInput('prefix', 'text', 'img');

    var button = document.createElement('button');
    button.textContent = 'Save frames';
    this.controls.appendChild(button);
    button.addEventListener('click', this.startRecording.bind(this));
};

LoopingRecorder.prototype.createInput = function(name, type, value) {
    var id = name;

    var label = document.createElement('label');
    label.textContent = name + ':';
    label.setAttribute('for', id);
    this.addClass(label, 'slr-label');

    var input = document.createElement('input');
    input.id = id;
    input.type = type;
    input.value = value;
    this.addClass(input, 'slr-input');
    this.addClass(input, 'slr-input--' + name);

    this.controls.appendChild(label);
    this.controls.appendChild(input);

    return input;
};


/* Utilities
   ========================================================================== */

LoopingRecorder.prototype.saveFrame = function(canvas) {
    var totalFrames = this.fps * this.loopSeconds;
    var digits = totalFrames.toString().length;
    var frameString = this.pad(this.frameNumber, digits);
    var filename = this.prefix + frameString + '.png';
    canvas.toBlob(function(blob) {
        saveAs(blob, filename);
    });
    this.frameNumber += 1;
};

LoopingRecorder.prototype.insertAfter = function(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

LoopingRecorder.prototype.addClass = function(el, className) {
    if (el.classList) {
        el.classList.add(className);
    } else {
        el.className += ' ' + className;
    }
};

LoopingRecorder.prototype.removeClass = function(el, className) {
    if (el.classList) {
        el.classList.remove(className);
    } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
};

LoopingRecorder.prototype.pad = function(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
};


/* Init
   ========================================================================== */

window.loopingRecorder = new LoopingRecorder();
