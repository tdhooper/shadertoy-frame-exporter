
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function addClass(el, className) {
    if (el.classList) {
        el.classList.add(className);
    } else {
        el.className += ' ' + className;
    }
}

function removeClass(el, className) {
    if (el.classList) {
        el.classList.remove(className);
    } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
}


var LoopingRecorder = function() {
    this.player = document.getElementById('player');
    this.createUi();
    this.prefix = 'img';
};

LoopingRecorder.prototype.createUi = function() {
    this.controls = document.createElement('div');
    addClass(this.controls, 'slr-controls');
    insertAfter(this.controls, this.player);

    this.widthInput = this.createInput('width', 500);
    this.heightInput = this.createInput('height', 500);
    this.fpsInput = this.createInput('fps', 30);
    this.secondsInput = this.createInput('seconds', 1);

    var button = document.createElement('button');
    button.textContent = 'Save frames';
    this.controls.appendChild(button);
    button.addEventListener('click', this.startRecording.bind(this));
};

LoopingRecorder.prototype.createInput = function(name, value) {
    var id = name;

    var label = document.createElement('label');
    label.textContent = name + ':';
    label.setAttribute('for', id);
    addClass(label, 'slr-label');

    var input = document.createElement('input');
    input.id = id;
    input.type = 'number';
    input.value = value;
    addClass(input, 'slr-input');
    addClass(input, 'slr-input--' + name);

    this.controls.appendChild(label);
    this.controls.appendChild(input);

    return input;
};

LoopingRecorder.prototype.startRecording = function() {
    this.setUp();
};

LoopingRecorder.prototype.stopRecording = function() {
    this.tearDown();
};

LoopingRecorder.prototype.setUp = function() {
    addClass(this.player, 'slr-recording');

    this.original_width = gShaderToy.mCanvas.width;
    this.original_height = gShaderToy.mCanvas.height;

    var width = parseInt(this.widthInput.value, 10);
    var height = parseInt(this.heightInput.value, 10);
    gShaderToy.resize(width, height);

    this.original_mIsPaused = gShaderToy.mIsPaused;
    if (gShaderToy.mIsPaused) {
        gShaderToy.pauseTime();
    }

    this.original_mTf = gShaderToy.mTf;
    gShaderToy.resetTime();
    this.timeSeconds = 0;
    gShaderToy.mTo = 0;

    this.original_getRealTime = window.getRealTime;
    window.getRealTime = this.getRealTime.bind(this);

    this.fps = parseInt(this.fpsInput.value, 10);
    this.loopSeconds = parseInt(this.secondsInput.value, 10);
    this.frameNumber = 0;

    this.original_RequestAnimationFrame = gShaderToy.mEffect.RequestAnimationFrame;
    gShaderToy.mEffect.RequestAnimationFrame = this.RequestAnimationFrame.bind(this);
};

LoopingRecorder.prototype.tearDown = function() {
    removeClass(this.player, 'lr-recording');

    gShaderToy.resize(this.original_width, this.original_height);

    if (this.original_mIsPaused) {
        gShaderToy.pauseTime();
    }

    gShaderToy.mTf = this.original_mTf;

    window.getRealTime = this.original_getRealTime;

    gShaderToy.mEffect.RequestAnimationFrame = this.original_RequestAnimationFrame;
};

LoopingRecorder.prototype.RequestAnimationFrame = function(render) {
    var patched = function() {
        this.timeSeconds += 1 / this.fps;
        if (this.timeSeconds > this.loopSeconds) {
            this.stopRecording();
            render();
        } else {
            render();
            this.saveFrame();            
        }
    };
    this.original_RequestAnimationFrame.call(gShaderToy.mEffect, patched.bind(this));
};

LoopingRecorder.prototype.saveFrame = function() {
    var totalFrames = this.fps * this.loopSeconds;
    var digits = totalFrames.toString().length;
    var frameString = this.pad(this.frameNumber, digits);
    var filename = this.prefix + frameString + '.png';
    gShaderToy.mCanvas.toBlob(function(blob) {
        saveAs(blob, filename);
    });
    this.frameNumber += 1;
};

LoopingRecorder.prototype.getRealTime = function() {
    return this.timeSeconds * 1000;
};

LoopingRecorder.prototype.pad = function(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
};

window.loopingRecorder = new LoopingRecorder();
