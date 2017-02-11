
var LoopingRecorder = function() {
    this.player = document.getElementById('player');
    this.createUi();
};

LoopingRecorder.prototype.afterRender = function() {
    this.lastFrame = this.frameCounter.frameNumber();
    if (this.record) {
        this.saveFrame(gShaderToy.mCanvas);
        this.frameCounter.incrementFrame();
        if (this.frameCounter.looped) {
            this.stopRecording();
        }
    } else if (this.preview) {
        this.frameCounter.updateTime();
    }
    this.frameUpdated = this.lastFrame !== this.frameCounter.frameNumber();
};

LoopingRecorder.prototype.enablePreview = function() {
    this.preview = true;
    this.frameUpdated = true;

    // Start frame counter
    this.frameCounter = new FrameCounter(this.fpsInput.value, this.secondsInput.value);
    this.frameCounter.start();

    this.startPatch();

    // Seek to the beginning
    gShaderToy.resetTime();
    gShaderToy.mTo = 0;
};

LoopingRecorder.prototype.disablePreview = function() {
    this.preview = false;
    this.stopPatch();
};

LoopingRecorder.prototype.startRecording = function() {
    this.record = true;
    this.frameUpdated = true;

    // Start frame counter
    this.frameCounter = new FrameCounter(this.fpsInput.value, this.secondsInput.value);
    this.frameCounter.start();

    this.startPatch();

    // Start playback if it's currently paused
    this.original_mIsPaused = gShaderToy.mIsPaused;
    if (gShaderToy.mIsPaused) {
        gShaderToy.pauseTime();
    }

    // Seek to the beginning
    gShaderToy.resetTime();
    gShaderToy.mTo = 0;

    // Store current settings
    this.prefix = this.prefixInput.value;
};

LoopingRecorder.prototype.stopRecording = function() {
    this.record = false;

    if ( ! this.preview) {
        this.stopPatch();
    }

    // Pause playback if it was originally paused
    if (this.original_mIsPaused) {
        gShaderToy.pauseTime();
    }
};

LoopingRecorder.prototype.startPatch = function() {
    if (this.patched) {
        return;
    }
    this.patched = true;

    // Add canvas layout styles
    this.addClass(this.player, 'slr-recording');

    // Resize canvas to desired size
    this.original_width = gShaderToy.mCanvas.width;
    this.original_height = gShaderToy.mCanvas.height;
    var width = parseInt(this.widthInput.value, 10);
    var height = parseInt(this.heightInput.value, 10);
    gShaderToy.resize(width, height);

    // Patch the time counter, so we can step through frames
    this.original_getRealTime = window.getRealTime;
    window.getRealTime = this.getRealTime.bind(this);

    // Patch raf-loop, so we can intercept renders
    this.original_RequestAnimationFrame = gShaderToy.mEffect.RequestAnimationFrame;
    gShaderToy.mEffect.RequestAnimationFrame = this.RequestAnimationFrame.bind(this);
};


LoopingRecorder.prototype.stopPatch = function() {
    if ( ! this.patched) {
        return;
    }
    this.patched = false;

    // Remove canvas layout styles
    this.removeClass(this.player, 'lr-recording');

    // Reset canvas to original size
    gShaderToy.resize(this.original_width, this.original_height);

    // Remove time counter patch
    window.getRealTime = this.original_getRealTime;

    // Remove raf-loop patch
    gShaderToy.mEffect.RequestAnimationFrame = this.original_RequestAnimationFrame;
};


/* Shadertoy patches
   ========================================================================== */

LoopingRecorder.prototype.render = function(original_render) {
    if ( ! this.patched) {
        original_render();
        return;
    }
    if (this.frameUpdated) {
        original_render();
    } else {
        this.RequestAnimationFrame(original_render);
    }
    this.afterRender();
};

// Control what happens after each render
LoopingRecorder.prototype.RequestAnimationFrame = function(original_render) {
    var render = this.render.bind(this, original_render);
    this.original_RequestAnimationFrame.call(gShaderToy.mEffect, render);
};

LoopingRecorder.prototype.getRealTime = function() {
    return this.frameCounter.milliseconds();
};


/* Frame Counter
   ========================================================================== */

var FrameCounter = function(fps, loopSeconds) {
    this.fps = parseFloat(fps);
    this.loopSeconds = parseFloat(loopSeconds);
    this.timeSeconds = 0;
    this.frameLength = 1 / this.fps;
    this.totalFrames = Math.floor(this.fps * this.loopSeconds);
};

FrameCounter.prototype.start = function() {
    this.startTime = performance.now();
    this.looped = false;
};

FrameCounter.prototype.updateTime = function() {
    this.timeSeconds = (performance.now() - this.startTime) / 1000;
    this.loopTime();
};

FrameCounter.prototype.incrementFrame = function() {
    this.timeSeconds = (this.frameNumber() + 1) * this.frameLength;
    this.loopTime();
};

FrameCounter.prototype.loopTime = function() {
    if (this.frameNumber() > this.totalFrames - 1) {
        this.looped = true;
        this.startTime = performance.now();
        this.timeSeconds = 0;
    }
};

FrameCounter.prototype.frameNumber = function() {
    return Math.floor(this.timeSeconds / this.frameLength);
};

FrameCounter.prototype.milliseconds = function() {
    return (this.frameNumber() * this.frameLength) * 1000;
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

    var previewInput = this.createInput('preview', 'checkbox');
    previewInput.addEventListener('click', function() {
        if (previewInput.checked) {
            this.enablePreview();
        } else {
            this.disablePreview();
        }
    }.bind(this));

    var button = document.createElement('button');
    button.textContent = 'Save frames';
    this.addClass(button, 'slr-save');
    this.controls.appendChild(button);
    button.addEventListener('click', this.startRecording.bind(this));
};

LoopingRecorder.prototype.createInput = function(name, type, value) {
    var id = name;

    var label = document.createElement('label');
    label.textContent = name;
    label.setAttribute('for', id);
    this.addClass(label, 'slr-label');

    var input = document.createElement('input');
    input.id = id;
    input.type = type;
    input.value = value;
    this.addClass(input, 'slr-input');

    var control = document.createElement('div');
    this.addClass(control, 'slr-control');
    this.addClass(control, 'slr-control--' + type);

    control.appendChild(label);
    control.appendChild(input);
    this.controls.appendChild(control);

    return input;
};


/* Utilities
   ========================================================================== */

LoopingRecorder.prototype.saveFrame = function(canvas) {
    var totalFrames = this.frameCounter.totalFrames;
    var digits = totalFrames.toString().length;
    var frameString = this.pad(this.frameCounter.frameNumber(), digits);
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
