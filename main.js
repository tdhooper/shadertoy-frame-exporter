
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
};

LoopingRecorder.prototype.createUi = function() {
    this.controls = document.createElement('div');
    addClass(this.controls, 'slr-controls');
    insertAfter(this.controls, this.player);

    this.widthInput = this.createInput('width', 500);
    this.heightInput = this.createInput('height', 500);
    this.fpsInput = this.createInput('fps', 30);
    this.secondsInput = this.createInput('seconds', 1);
    this.bitrateInput = this.createInput('bitrate', 250000000);

    var button = document.createElement('button');
    button.textContent = 'Record';
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
    gShaderToy.mMediaRecorder.start();
};

LoopingRecorder.prototype.stopRecording = function() {
    gShaderToy.mMediaRecorder.stop();
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

    var bitrate = parseInt(this.bitrateInput.value, 10);
    this.setRecorderOptions({
        videoBitsPerSecond: bitrate
    });

    this.original_RequestAnimationFrame = gShaderToy.mEffect.RequestAnimationFrame;
    gShaderToy.mEffect.RequestAnimationFrame = this.RequestAnimationFrame.bind(this);

    this.original_getRealTime = window.getRealTime;
    window.getRealTime = this.getRealTime.bind(this);

    this.fps = parseInt(this.fpsInput.value, 10);
    this.loopSeconds = parseInt(this.secondsInput.value, 10);
};

LoopingRecorder.prototype.tearDown = function() {
    removeClass(this.player, 'lr-recording');

    gShaderToy.resize(this.original_width, this.original_height);

    if (this.original_mIsPaused) {
        gShaderToy.pauseTime();
    }

    gShaderToy.mTf = this.original_mTf;

    this.setRecorderOptions();

    gShaderToy.mEffect.RequestAnimationFrame = this.original_RequestAnimationFrame;

    window.getRealTime = this.original_getRealTime;
};

LoopingRecorder.prototype.RequestAnimationFrame = function(id) {
    this.timeSeconds += 1 / this.fps;
    if (this.timeSeconds > this.loopSeconds) {
        this.stopRecording();
    }
    this.original_RequestAnimationFrame.call(gShaderToy.mEffect, id);
};

LoopingRecorder.prototype.getRealTime = function() {
    return this.timeSeconds * 1000;
};

LoopingRecorder.prototype.setRecorderOptions = function(recorderOptions) {
    // The following is copied from https://www.shadertoy.com/lib/piLibs.js
    // changed to allow updating MediaRecorder options
    function piCreateMediaRecorder(isRecordingCallback, canvas) 
    {
        if (piCanMediaRecorded(canvas) == false)
        {
            return null;
        }
        
        var mediaRecorder = new MediaRecorder(canvas.captureStream(), recorderOptions);
        var chunks = [];
        
        mediaRecorder.ondataavailable = function(e) 
        {
            if (e.data.size > 0) 
            {
                chunks.push(e.data);
            }
        };
     
        mediaRecorder.onstart = function(){ 
            isRecordingCallback( true );
        };
        
        mediaRecorder.onstop = function()
        {
             isRecordingCallback( false );
             let blob     = new Blob(chunks, {type: "video/webm"});
             chunks       = [];
             let videoURL = window.URL.createObjectURL(blob);
             let url      = window.URL.createObjectURL(blob);
             let a        = document.createElement("a");
             document.body.appendChild(a);
             a.style      = "display: none";
             a.href       = url;
             a.download   = "capture.webm";
             a.click();
             window.URL.revokeObjectURL(url);
         };
        
        return mediaRecorder;
    }

    gShaderToy.mMediaRecorder = piCreateMediaRecorder(function(b) 
      {
           var ele = document.getElementById("myRecord");
           if( b )
               ele.style.background="url('/img/themes/" + gThemeName + "/recordOn.png')";
           else
               ele.style.background="url('/img/themes/" + gThemeName + "/recordOff.png')";
      }, gShaderToy.mCanvas);
};

window.loopingRecorder = new LoopingRecorder();
