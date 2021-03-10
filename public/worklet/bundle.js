(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = audioBufferToWav
function audioBufferToWav (buffer, opt) {
  opt = opt || {}

  var numChannels = buffer.numberOfChannels
  var sampleRate = buffer.sampleRate
  var format = opt.float32 ? 3 : 1
  var bitDepth = format === 3 ? 32 : 16

  var result
  if (numChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1))
  } else {
    result = buffer.getChannelData(0)
  }

  return encodeWAV(result, format, sampleRate, numChannels, bitDepth)
}

function encodeWAV (samples, format, sampleRate, numChannels, bitDepth) {
  var bytesPerSample = bitDepth / 8
  var blockAlign = numChannels * bytesPerSample

  var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  var view = new DataView(buffer)

  /* RIFF identifier */
  writeString(view, 0, 'RIFF')
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  /* RIFF type */
  writeString(view, 8, 'WAVE')
  /* format chunk identifier */
  writeString(view, 12, 'fmt ')
  /* format chunk length */
  view.setUint32(16, 16, true)
  /* sample format (raw) */
  view.setUint16(20, format, true)
  /* channel count */
  view.setUint16(22, numChannels, true)
  /* sample rate */
  view.setUint32(24, sampleRate, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true)
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true)
  /* bits per sample */
  view.setUint16(34, bitDepth, true)
  /* data chunk identifier */
  writeString(view, 36, 'data')
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true)
  if (format === 1) { // Raw PCM
    floatTo16BitPCM(view, 44, samples)
  } else {
    writeFloat32(view, 44, samples)
  }

  return buffer
}

function interleave (inputL, inputR) {
  var length = inputL.length + inputR.length
  var result = new Float32Array(length)

  var index = 0
  var inputIndex = 0

  while (index < length) {
    result[index++] = inputL[inputIndex]
    result[index++] = inputR[inputIndex]
    inputIndex++
  }
  return result
}

function writeFloat32 (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 4) {
    output.setFloat32(offset, input[i], true)
  }
}

function floatTo16BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}

function writeString (view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

},{}],2:[function(require,module,exports){
(function (global){(function (){
(function(a,b){if("function"==typeof define&&define.amd)define([],b);else if("undefined"!=typeof exports)b();else{b(),a.FileSaver={exports:{}}.exports}})(this,function(){"use strict";function b(a,b){return"undefined"==typeof b?b={autoBom:!1}:"object"!=typeof b&&(console.warn("Deprecated: Expected third argument to be a object"),b={autoBom:!b}),b.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a}function c(a,b,c){var d=new XMLHttpRequest;d.open("GET",a),d.responseType="blob",d.onload=function(){g(d.response,b,c)},d.onerror=function(){console.error("could not download file")},d.send()}function d(a){var b=new XMLHttpRequest;b.open("HEAD",a,!1);try{b.send()}catch(a){}return 200<=b.status&&299>=b.status}function e(a){try{a.dispatchEvent(new MouseEvent("click"))}catch(c){var b=document.createEvent("MouseEvents");b.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(b)}}var f="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof global&&global.global===global?global:void 0,a=f.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),g=f.saveAs||("object"!=typeof window||window!==f?function(){}:"download"in HTMLAnchorElement.prototype&&!a?function(b,g,h){var i=f.URL||f.webkitURL,j=document.createElement("a");g=g||b.name||"download",j.download=g,j.rel="noopener","string"==typeof b?(j.href=b,j.origin===location.origin?e(j):d(j.href)?c(b,g,h):e(j,j.target="_blank")):(j.href=i.createObjectURL(b),setTimeout(function(){i.revokeObjectURL(j.href)},4E4),setTimeout(function(){e(j)},0))}:"msSaveOrOpenBlob"in navigator?function(f,g,h){if(g=g||f.name||"download","string"!=typeof f)navigator.msSaveOrOpenBlob(b(f,h),g);else if(d(f))c(f,g,h);else{var i=document.createElement("a");i.href=f,i.target="_blank",setTimeout(function(){e(i)})}}:function(b,d,e,g){if(g=g||open("","_blank"),g&&(g.document.title=g.document.body.innerText="downloading..."),"string"==typeof b)return c(b,d,e);var h="application/octet-stream"===b.type,i=/constructor/i.test(f.HTMLElement)||f.safari,j=/CriOS\/[\d]+/.test(navigator.userAgent);if((j||h&&i||a)&&"undefined"!=typeof FileReader){var k=new FileReader;k.onloadend=function(){var a=k.result;a=j?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),g?g.location.href=a:location=a,g=null},k.readAsDataURL(b)}else{var l=f.URL||f.webkitURL,m=l.createObjectURL(b);g?g.location=m:location.href=m,g=null,setTimeout(function(){l.revokeObjectURL(m)},4E4)}});f.saveAs=g.saveAs=g,"undefined"!=typeof module&&(module.exports=g)});


}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _soundtouch = require("./soundtouch.js");

/*
   Written by goto at kmgoto.jp (Mar. 2021)
   Copyright of my code is not claimed.

   Based on soundtouchjs/src/PitchShifter.js, SimpleFilter.js

   Modified for use as intermediate ScriptProcessorNode.
   Note: Output does not work for OfflineAudioContext.

   1) PitchShifter ---> MyPitchShifter (minimum code)
                     includes ScriptProcessorNode

   2) MyFilter extends SimpleFilter

   Pitch modification and slow down/speed up work.
   Slow down only for real-time playback.
   fast playback is impossible by nature.

 */
const noop = function () {
  return;
};

class MyFilter extends _soundtouch.SimpleFilter {
  constructor(pipe, callback = noop) {
    super(null, pipe, callback); // sourceSound, callback are not used

    this.callback = callback;
    this.sourceSound = [];
    this.historyBufferSize = 22050;
    this._sourcePosition = 0;
    this.outputBufferPosition = 0;
    this._position = 0;
  }
  /* new method to put samples from e.inputBuffer in onaudioprocess */


  putSource(source) {
    for (let i = 0; i < source.length; i++) this.sourceSound.push(source[i]);
  } // LR interleaved

  /* new method replaces getWebAudioNode.extract() */


  extractSource(outSamples, numFramesReq, frameOffset = 0) {
    let numFramesExtracted = 0;

    if (this.sourceSound.length < numFramesReq * 2) {
      numFramesExtracted = 0;
    } else {
      outSamples.set(this.sourceSound.slice(0, numFramesReq * 2));
      this.sourceSound.splice(0, numFramesReq * 2);
      numFramesExtracted = numFramesReq;
    }

    return numFramesExtracted;
  }
  /* Override */


  fillInputBuffer(numFrames = 0) {
    // samples are LRLR 
    const samples = new Float32Array(numFrames * 2);
    const numFramesExtracted = this.extractSource(samples, numFrames);
    if (numFramesExtracted > 0) this.inputBuffer.putSamples(samples, 0, numFramesExtracted);
  }
  /* inherited (called when input is end. Not used)
    onEnd() { this.callback(); }
  */


}

exports.default = MyFilter;
;

},{"./soundtouch.js":5}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _soundtouch = require("./soundtouch.js");

var _MyFilter = _interopRequireDefault(require("./MyFilter"));

var _fileSaver = require("file-saver");

var toWav = _interopRequireWildcard(require("audiobuffer-to-wav"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
   Written by goto at kmgoto.jp (Mar. 2021)
   Copyright of my code is not claimed.

   Based on soundtouchjs/src/PitchShifter.js, SimpleFilter.js

   Modified for use as intermediate ScriptProcessorNode.
   Note: Output does not work for OfflineAudioContext.

   1) PitchShifter ---> MyPitchShifter (minimum code)
                     includes ScriptProcessorNode

   2) MyFilter extends SimpleFilter

   Pitch modification and slow down/speed up work.
   Slow down only for real-time playback.
   fast playback is impossible by nature.

 */
const noop = function () {
  return;
};

class MyPitchShifter {
  constructor(context, numOfInputFrames, bufferSize, record = false, bypass = false) {
    console.log('new MyPitchShifter instance');
    this.context = context;
    this.bufferSize = bufferSize;
    this.record = record;
    this.bypass = bypass;
    this.recordedSamples = [[], []];
    this.lastPlayingAt = 0;
    this._soundtouch = new _soundtouch.SoundTouch.SoundTouch();
    this._filter = new _MyFilter.default(this._soundtouch, noop);
    this._onEnd = noop;
    this._onUpdate = noop;
    this._onUpdateInterval = 0.5;
    this._node = context.createScriptProcessor(bufferSize, 2, 2);
    this._node.onaudioprocess = this.onaudioprocess.bind(this);
    this._totalInputFrames = numOfInputFrames;
    this._recordedBuffer = null;
    this._nVirtualOutputFrames = 0;
    this._playingAt = 0;
    this.outSamples = new Float32Array(bufferSize * 2);
    this.inSamples = new Float32Array(bufferSize * 2);
    this.sampleRate = context.sampleRate;
    this.nInputFrames = 0; // this.moreInput = true;
  }

  set totalInputFrames(nframes) {
    this._totalInputFrames = nframes;
  }

  get totalInputFrames() {
    return this._totalInputFrames;
  }

  get totalVirtualOutputFrames() {
    return this._nVirtualOutputFrames;
  }

  get playingAt() {
    return this._playingAt;
  }

  get node() {
    return this._node;
  }

  set tempo(tempo) {
    this._soundtouch.tempo = tempo;
  }

  get tempo() {
    return this._soundtouch.tempo;
  }

  set pitch(pitch) {
    this._soundtouch.pitch = pitch;
  }

  get rate() {
    return this._soundtouch.rate;
  }

  get recordedBuffer() {
    if (this._recordedBuffer === null) this.createProcessedBuffer();
    return this._recordedBuffer;
  }

  set onEnd(func) {
    this._onEnd = func;
  }

  set onUpdate(func) {
    this._onUpdate = func;
  }

  set onUpdateInterval(val) {
    this._onUpdateInterval = val;
  }

  get onUpdateInterval() {
    return this._onUpdateInterval;
  }

  stop() {
    if (this._node.onaudioprocess) {
      console.log('shifter stop');
      this._node.onaudioprocess = null;

      this._node.disconnect();

      this._onEnd();
    }
  }

  createProcessedBuffer() {
    if (!this.record) return;
    const outputBuffer = this.context.createBuffer(this.recordedSamples.length, // channels
    this.recordedSamples[0].length, // sample length
    this.sampleRate);
    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);
    left.set(this.recordedSamples[0]);
    right.set(this.recordedSamples[1]); // Typedarray.set(array[, offset])

    this._recordedBuffer = outputBuffer; // console.log('this._recordedBuffer len = ', this._recordedBuffer.length);
  } // end createProcessedBuffer()


  onaudioprocess(e) {
    if (this.bypass) {
      // pass through for test
      if (this._nVirtualOutputFrames <= this._totalInputFrames) {
        this.passThrough(e.inputBuffer, e.outputBuffer); // through for test

        this._nVirtualOutputFrames += e.outputBuffer.length;
      } else this.stop();
    } else {
      if (this._nVirtualOutputFrames <= this._totalInputFrames) {
        const nOutputFrames = this.process(e.inputBuffer, e.outputBuffer);
        this._nVirtualOutputFrames += nOutputFrames * this._soundtouch.tempo;
      } else this.stop();
    }

    this._playingAt = this._nVirtualOutputFrames / this.sampleRate;

    if (this.playingAt - this.lastPlayingAt >= this._onUpdateInterval) {
      this._onUpdate();

      this.lastPlayingAt = this._playingAt;
    }

    this.nInputFrames += e.inputBuffer.length;
  }

  process(inputBuffer, outputBuffer) {
    // using soundtouchjs 
    // input part
    const leftIn = inputBuffer.getChannelData(0);
    const rightIn = inputBuffer.getChannelData(1);
    const inSamples = this.inSamples; // LR Interleave

    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);

    for (let i = 0; i < inputBuffer.length; i++) {
      inSamples[2 * i] = leftIn[i];
      inSamples[2 * i + 1] = rightIn[i];
    }

    this._filter.putSource(inSamples); // Output  node.onaudioprocess in function getWebAudioNode
    // context, filter, sourcePositionCallback


    const outSamples = this.outSamples;

    const framesExtracted = this._filter.extract(outSamples, this.bufferSize);

    for (let i = 0; i < framesExtracted; i++) {
      left[i] = outSamples[i * 2];
      right[i] = outSamples[i * 2 + 1];

      if (this.record) {
        this.recordedSamples[0].push(left[i]);
        this.recordedSamples[1].push(right[i]);
      }
    }

    return framesExtracted;
  } // End process
  // just copy inputBuffer to outputBuffer for test 


  passThrough(inputBuffer, outputBuffer) {
    const nc = outputBuffer.numberOfChannels;

    for (let channel = 0; channel < nc; channel++) {
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      output.set(inputBuffer.getChannelData(channel));
      if (this.record) for (let i = 0; i < outputBuffer.length; i++) this.recordedSamples[channel].push(input[i]);
    }
  } // End pathThrough()


  exportToFile(filename) {
    if (!this.record) return;
    console.log('exportToFile: ', filename, 'length: ', this.recordedSamples[0].length);
    if (this._recordedBuffer === null) this.createProcessedBuffer();
    const blob = new Blob([toWav(this._recordedBuffer)], {
      type: 'audio/vnd.wav'
    });
    (0, _fileSaver.saveAs)(blob, filename);
    return;
  } // end exportToFile()


}

exports.default = MyPitchShifter;
;

},{"./MyFilter":3,"./soundtouch.js":5,"audiobuffer-to-wav":1,"file-saver":2}],5:[function(require,module,exports){
"use strict";

/*
 * SoundTouch JS v0.1.26 audio processing library
 * Copyright (c) Olli Parviainen
 * Copyright (c) Ryan Berdeen
 * Copyright (c) Jakub Fiala
 * Copyright (c) Steve 'Cutter' Blades
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */
class FifoSampleBuffer {
  constructor() {
    this._vector = new Float32Array();
    this._position = 0;
    this._frameCount = 0;
  }

  get vector() {
    return this._vector;
  }

  get position() {
    return this._position;
  }

  get startIndex() {
    return this._position * 2;
  }

  get frameCount() {
    return this._frameCount;
  }

  get endIndex() {
    return (this._position + this._frameCount) * 2;
  }

  clear() {
    this.receive(this._frameCount);
    this.rewind();
  }

  put(numFrames) {
    this._frameCount += numFrames;
  }

  putSamples(samples, position, numFrames = 0) {
    position = position || 0;
    const sourceOffset = position * 2;

    if (!(numFrames >= 0)) {
      numFrames = (samples.length - sourceOffset) / 2;
    }

    const numSamples = numFrames * 2;
    this.ensureCapacity(numFrames + this._frameCount);
    const destOffset = this.endIndex;
    this.vector.set(samples.subarray(sourceOffset, sourceOffset + numSamples), destOffset);
    this._frameCount += numFrames;
  }

  putBuffer(buffer, position, numFrames = 0) {
    position = position || 0;

    if (!(numFrames >= 0)) {
      numFrames = buffer.frameCount - position;
    }

    this.putSamples(buffer.vector, buffer.position + position, numFrames);
  }

  receive(numFrames) {
    if (!(numFrames >= 0) || numFrames > this._frameCount) {
      numFrames = this.frameCount;
    }

    this._frameCount -= numFrames;
    this._position += numFrames;
  }

  receiveSamples(output, numFrames = 0) {
    const numSamples = numFrames * 2;
    const sourceOffset = this.startIndex;
    output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
    this.receive(numFrames);
  }

  extract(output, position = 0, numFrames = 0) {
    const sourceOffset = this.startIndex + position * 2;
    const numSamples = numFrames * 2;
    output.set(this._vector.subarray(sourceOffset, sourceOffset + numSamples));
  }

  ensureCapacity(numFrames = 0) {
    const minLength = parseInt(numFrames * 2);

    if (this._vector.length < minLength) {
      const newVector = new Float32Array(minLength);
      newVector.set(this._vector.subarray(this.startIndex, this.endIndex));
      this._vector = newVector;
      this._position = 0;
    } else {
      this.rewind();
    }
  }

  ensureAdditionalCapacity(numFrames = 0) {
    this.ensureCapacity(this._frameCount + numFrames);
  }

  rewind() {
    if (this._position > 0) {
      this._vector.set(this._vector.subarray(this.startIndex, this.endIndex));

      this._position = 0;
    }
  }

}

class AbstractFifoSamplePipe {
  constructor(createBuffers) {
    if (createBuffers) {
      this._inputBuffer = new FifoSampleBuffer();
      this._outputBuffer = new FifoSampleBuffer();
    } else {
      this._inputBuffer = this._outputBuffer = null;
    }
  }

  get inputBuffer() {
    return this._inputBuffer;
  }

  set inputBuffer(inputBuffer) {
    this._inputBuffer = inputBuffer;
  }

  get outputBuffer() {
    return this._outputBuffer;
  }

  set outputBuffer(outputBuffer) {
    this._outputBuffer = outputBuffer;
  }

  clear() {
    this._inputBuffer.clear();

    this._outputBuffer.clear();
  }

}

class RateTransposer extends AbstractFifoSamplePipe {
  constructor(createBuffers) {
    super(createBuffers);
    this.reset();
    this._rate = 1;
  }

  set rate(rate) {
    this._rate = rate;
  }

  reset() {
    this.slopeCount = 0;
    this.prevSampleL = 0;
    this.prevSampleR = 0;
  }

  clone() {
    const result = new RateTransposer();
    result.rate = this._rate;
    return result;
  }

  process() {
    const numFrames = this._inputBuffer.frameCount;

    this._outputBuffer.ensureAdditionalCapacity(numFrames / this._rate + 1);

    const numFramesOutput = this.transpose(numFrames);

    this._inputBuffer.receive();

    this._outputBuffer.put(numFramesOutput);
  }

  transpose(numFrames = 0) {
    if (numFrames === 0) {
      return 0;
    }

    const src = this._inputBuffer.vector;
    const srcOffset = this._inputBuffer.startIndex;
    const dest = this._outputBuffer.vector;
    const destOffset = this._outputBuffer.endIndex;
    let used = 0;
    let i = 0;

    while (this.slopeCount < 1.0) {
      dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * this.prevSampleL + this.slopeCount * src[srcOffset];
      dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * this.prevSampleR + this.slopeCount * src[srcOffset + 1];
      i = i + 1;
      this.slopeCount += this._rate;
    }

    this.slopeCount -= 1.0;

    if (numFrames !== 1) {
      out: while (true) {
        while (this.slopeCount > 1.0) {
          this.slopeCount -= 1.0;
          used = used + 1;

          if (used >= numFrames - 1) {
            break out;
          }
        }

        const srcIndex = srcOffset + 2 * used;
        dest[destOffset + 2 * i] = (1.0 - this.slopeCount) * src[srcIndex] + this.slopeCount * src[srcIndex + 2];
        dest[destOffset + 2 * i + 1] = (1.0 - this.slopeCount) * src[srcIndex + 1] + this.slopeCount * src[srcIndex + 3];
        i = i + 1;
        this.slopeCount += this._rate;
      }
    }

    this.prevSampleL = src[srcOffset + 2 * numFrames - 2];
    this.prevSampleR = src[srcOffset + 2 * numFrames - 1];
    return i;
  }

}

class FilterSupport {
  constructor(pipe) {
    this._pipe = pipe;
  }

  get pipe() {
    return this._pipe;
  }

  get inputBuffer() {
    return this._pipe.inputBuffer;
  }

  get outputBuffer() {
    return this._pipe.outputBuffer;
  }

  fillInputBuffer() {
    throw new Error('fillInputBuffer() not overridden');
  }

  fillOutputBuffer(numFrames = 0) {
    while (this.outputBuffer.frameCount < numFrames) {
      const numInputFrames = 8192 * 2 - this.inputBuffer.frameCount;
      this.fillInputBuffer(numInputFrames);

      if (this.inputBuffer.frameCount < 8192 * 2) {
        break;
      }

      this._pipe.process();
    }
  }

  clear() {
    this._pipe.clear();
  }

}

const noop = function () {
  return;
};

class SimpleFilter extends FilterSupport {
  constructor(sourceSound, pipe, callback = noop) {
    super(pipe);
    this.callback = callback;
    this.sourceSound = sourceSound;
    this.historyBufferSize = 22050;
    this._sourcePosition = 0;
    this.outputBufferPosition = 0;
    this._position = 0;
  }

  get position() {
    return this._position;
  }

  set position(position) {
    if (position > this._position) {
      throw new RangeError('New position may not be greater than current position');
    }

    const newOutputBufferPosition = this.outputBufferPosition - (this._position - position);

    if (newOutputBufferPosition < 0) {
      throw new RangeError('New position falls outside of history buffer');
    }

    this.outputBufferPosition = newOutputBufferPosition;
    this._position = position;
  }

  get sourcePosition() {
    return this._sourcePosition;
  }

  set sourcePosition(sourcePosition) {
    this.clear();
    this._sourcePosition = sourcePosition;
  }

  onEnd() {
    this.callback();
  }

  fillInputBuffer(numFrames = 0) {
    const samples = new Float32Array(numFrames * 2);
    const numFramesExtracted = this.sourceSound.extract(samples, numFrames, this._sourcePosition);
    this._sourcePosition += numFramesExtracted;
    this.inputBuffer.putSamples(samples, 0, numFramesExtracted);
  }

  extract(target, numFrames = 0) {
    this.fillOutputBuffer(this.outputBufferPosition + numFrames);
    const numFramesExtracted = Math.min(numFrames, this.outputBuffer.frameCount - this.outputBufferPosition);
    this.outputBuffer.extract(target, this.outputBufferPosition, numFramesExtracted);
    const currentFrames = this.outputBufferPosition + numFramesExtracted;
    this.outputBufferPosition = Math.min(this.historyBufferSize, currentFrames);
    this.outputBuffer.receive(Math.max(currentFrames - this.historyBufferSize, 0));
    this._position += numFramesExtracted;
    return numFramesExtracted;
  }

  handleSampleData(event) {
    this.extract(event.data, 4096);
  }

  clear() {
    super.clear();
    this.outputBufferPosition = 0;
  }

}

const USE_AUTO_SEQUENCE_LEN = 0;
const DEFAULT_SEQUENCE_MS = USE_AUTO_SEQUENCE_LEN;
const USE_AUTO_SEEKWINDOW_LEN = 0;
const DEFAULT_SEEKWINDOW_MS = USE_AUTO_SEEKWINDOW_LEN;
const DEFAULT_OVERLAP_MS = 8;
const _SCAN_OFFSETS = [[124, 186, 248, 310, 372, 434, 496, 558, 620, 682, 744, 806, 868, 930, 992, 1054, 1116, 1178, 1240, 1302, 1364, 1426, 1488, 0], [-100, -75, -50, -25, 25, 50, 75, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [-20, -15, -10, -5, 5, 10, 15, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [-4, -3, -2, -1, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
const AUTOSEQ_TEMPO_LOW = 0.5;
const AUTOSEQ_TEMPO_TOP = 2.0;
const AUTOSEQ_AT_MIN = 125.0;
const AUTOSEQ_AT_MAX = 50.0;
const AUTOSEQ_K = (AUTOSEQ_AT_MAX - AUTOSEQ_AT_MIN) / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);
const AUTOSEQ_C = AUTOSEQ_AT_MIN - AUTOSEQ_K * AUTOSEQ_TEMPO_LOW;
const AUTOSEEK_AT_MIN = 25.0;
const AUTOSEEK_AT_MAX = 15.0;
const AUTOSEEK_K = (AUTOSEEK_AT_MAX - AUTOSEEK_AT_MIN) / (AUTOSEQ_TEMPO_TOP - AUTOSEQ_TEMPO_LOW);
const AUTOSEEK_C = AUTOSEEK_AT_MIN - AUTOSEEK_K * AUTOSEQ_TEMPO_LOW;

class Stretch extends AbstractFifoSamplePipe {
  constructor(createBuffers) {
    super(createBuffers);
    this._quickSeek = true;
    this.midBufferDirty = false;
    this.midBuffer = null;
    this.overlapLength = 0;
    this.autoSeqSetting = true;
    this.autoSeekSetting = true;
    this._tempo = 1;
    this.setParameters(44100, DEFAULT_SEQUENCE_MS, DEFAULT_SEEKWINDOW_MS, DEFAULT_OVERLAP_MS);
  }

  clear() {
    super.clear();
    this.clearMidBuffer();
  }

  clearMidBuffer() {
    if (this.midBufferDirty) {
      this.midBufferDirty = false;
      this.midBuffer = null;
    }
  }

  setParameters(sampleRate, sequenceMs, seekWindowMs, overlapMs) {
    if (sampleRate > 0) {
      this.sampleRate = sampleRate;
    }

    if (overlapMs > 0) {
      this.overlapMs = overlapMs;
    }

    if (sequenceMs > 0) {
      this.sequenceMs = sequenceMs;
      this.autoSeqSetting = false;
    } else {
      this.autoSeqSetting = true;
    }

    if (seekWindowMs > 0) {
      this.seekWindowMs = seekWindowMs;
      this.autoSeekSetting = false;
    } else {
      this.autoSeekSetting = true;
    }

    this.calculateSequenceParameters();
    this.calculateOverlapLength(this.overlapMs);
    this.tempo = this._tempo;
  }

  set tempo(newTempo) {
    let intskip;
    this._tempo = newTempo;
    this.calculateSequenceParameters();
    this.nominalSkip = this._tempo * (this.seekWindowLength - this.overlapLength);
    this.skipFract = 0;
    intskip = Math.floor(this.nominalSkip + 0.5);
    this.sampleReq = Math.max(intskip + this.overlapLength, this.seekWindowLength) + this.seekLength;
  }

  get tempo() {
    return this._tempo;
  }

  get inputChunkSize() {
    return this.sampleReq;
  }

  get outputChunkSize() {
    return this.overlapLength + Math.max(0, this.seekWindowLength - 2 * this.overlapLength);
  }

  calculateOverlapLength(overlapInMsec = 0) {
    let newOvl;
    newOvl = this.sampleRate * overlapInMsec / 1000;
    newOvl = newOvl < 16 ? 16 : newOvl;
    newOvl -= newOvl % 8;
    this.overlapLength = newOvl;
    this.refMidBuffer = new Float32Array(this.overlapLength * 2);
    this.midBuffer = new Float32Array(this.overlapLength * 2);
  }

  checkLimits(x, mi, ma) {
    return x < mi ? mi : x > ma ? ma : x;
  }

  calculateSequenceParameters() {
    let seq;
    let seek;

    if (this.autoSeqSetting) {
      seq = AUTOSEQ_C + AUTOSEQ_K * this._tempo;
      seq = this.checkLimits(seq, AUTOSEQ_AT_MAX, AUTOSEQ_AT_MIN);
      this.sequenceMs = Math.floor(seq + 0.5);
    }

    if (this.autoSeekSetting) {
      seek = AUTOSEEK_C + AUTOSEEK_K * this._tempo;
      seek = this.checkLimits(seek, AUTOSEEK_AT_MAX, AUTOSEEK_AT_MIN);
      this.seekWindowMs = Math.floor(seek + 0.5);
    }

    this.seekWindowLength = Math.floor(this.sampleRate * this.sequenceMs / 1000);
    this.seekLength = Math.floor(this.sampleRate * this.seekWindowMs / 1000);
  }

  set quickSeek(enable) {
    this._quickSeek = enable;
  }

  clone() {
    const result = new Stretch();
    result.tempo = this._tempo;
    result.setParameters(this.sampleRate, this.sequenceMs, this.seekWindowMs, this.overlapMs);
    return result;
  }

  seekBestOverlapPosition() {
    return this._quickSeek ? this.seekBestOverlapPositionStereoQuick() : this.seekBestOverlapPositionStereo();
  }

  seekBestOverlapPositionStereo() {
    let bestOffset;
    let bestCorrelation;
    let correlation;
    let i = 0;
    this.preCalculateCorrelationReferenceStereo();
    bestOffset = 0;
    bestCorrelation = Number.MIN_VALUE;

    for (; i < this.seekLength; i = i + 1) {
      correlation = this.calculateCrossCorrelationStereo(2 * i, this.refMidBuffer);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = i;
      }
    }

    return bestOffset;
  }

  seekBestOverlapPositionStereoQuick() {
    let bestOffset;
    let bestCorrelation;
    let correlation;
    let scanCount = 0;
    let correlationOffset;
    let tempOffset;
    this.preCalculateCorrelationReferenceStereo();
    bestCorrelation = Number.MIN_VALUE;
    bestOffset = 0;
    correlationOffset = 0;
    tempOffset = 0;

    for (; scanCount < 4; scanCount = scanCount + 1) {
      let j = 0;

      while (_SCAN_OFFSETS[scanCount][j]) {
        tempOffset = correlationOffset + _SCAN_OFFSETS[scanCount][j];

        if (tempOffset >= this.seekLength) {
          break;
        }

        correlation = this.calculateCrossCorrelationStereo(2 * tempOffset, this.refMidBuffer);

        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = tempOffset;
        }

        j = j + 1;
      }

      correlationOffset = bestOffset;
    }

    return bestOffset;
  }

  preCalculateCorrelationReferenceStereo() {
    let i = 0;
    let context;
    let temp;

    for (; i < this.overlapLength; i = i + 1) {
      temp = i * (this.overlapLength - i);
      context = i * 2;
      this.refMidBuffer[context] = this.midBuffer[context] * temp;
      this.refMidBuffer[context + 1] = this.midBuffer[context + 1] * temp;
    }
  }

  calculateCrossCorrelationStereo(mixingPosition, compare) {
    const mixing = this._inputBuffer.vector;
    mixingPosition += this._inputBuffer.startIndex;
    let correlation = 0;
    let i = 2;
    const calcLength = 2 * this.overlapLength;
    let mixingOffset;

    for (; i < calcLength; i = i + 2) {
      mixingOffset = i + mixingPosition;
      correlation += mixing[mixingOffset] * compare[i] + mixing[mixingOffset + 1] * compare[i + 1];
    }

    return correlation;
  }

  overlap(overlapPosition) {
    this.overlapStereo(2 * overlapPosition);
  }

  overlapStereo(inputPosition) {
    const input = this._inputBuffer.vector;
    inputPosition += this._inputBuffer.startIndex;
    const output = this._outputBuffer.vector;
    const outputPosition = this._outputBuffer.endIndex;
    let i = 0;
    let context;
    let tempFrame;
    const frameScale = 1 / this.overlapLength;
    let fi;
    let inputOffset;
    let outputOffset;

    for (; i < this.overlapLength; i = i + 1) {
      tempFrame = (this.overlapLength - i) * frameScale;
      fi = i * frameScale;
      context = 2 * i;
      inputOffset = context + inputPosition;
      outputOffset = context + outputPosition;
      output[outputOffset + 0] = input[inputOffset + 0] * fi + this.midBuffer[context + 0] * tempFrame;
      output[outputOffset + 1] = input[inputOffset + 1] * fi + this.midBuffer[context + 1] * tempFrame;
    }
  }

  process() {
    let offset;
    let temp;
    let overlapSkip;

    if (this.midBuffer === null) {
      if (this._inputBuffer.frameCount < this.overlapLength) {
        return;
      }

      this.midBuffer = new Float32Array(this.overlapLength * 2);

      this._inputBuffer.receiveSamples(this.midBuffer, this.overlapLength);
    }

    while (this._inputBuffer.frameCount >= this.sampleReq) {
      offset = this.seekBestOverlapPosition();

      this._outputBuffer.ensureAdditionalCapacity(this.overlapLength);

      this.overlap(Math.floor(offset));

      this._outputBuffer.put(this.overlapLength);

      temp = this.seekWindowLength - 2 * this.overlapLength;

      if (temp > 0) {
        this._outputBuffer.putBuffer(this._inputBuffer, offset + this.overlapLength, temp);
      }

      const start = this._inputBuffer.startIndex + 2 * (offset + this.seekWindowLength - this.overlapLength);
      this.midBuffer.set(this._inputBuffer.vector.subarray(start, start + 2 * this.overlapLength));
      this.skipFract += this.nominalSkip;
      overlapSkip = Math.floor(this.skipFract);
      this.skipFract -= overlapSkip;

      this._inputBuffer.receive(overlapSkip);
    }
  }

}

const testFloatEqual = function (a, b) {
  return (a > b ? a - b : b - a) > 1e-10;
};

class SoundTouch {
  constructor() {
    this.transposer = new RateTransposer(false);
    this.stretch = new Stretch(false);
    this._inputBuffer = new FifoSampleBuffer();
    this._intermediateBuffer = new FifoSampleBuffer();
    this._outputBuffer = new FifoSampleBuffer();
    this._rate = 0;
    this._tempo = 0;
    this.virtualPitch = 1.0;
    this.virtualRate = 1.0;
    this.virtualTempo = 1.0;
    this.calculateEffectiveRateAndTempo();
  }

  clear() {
    this.transposer.clear();
    this.stretch.clear();
  }

  clone() {
    const result = new SoundTouch();
    result.rate = this.rate;
    result.tempo = this.tempo;
    return result;
  }

  get rate() {
    return this._rate;
  }

  set rate(rate) {
    this.virtualRate = rate;
    this.calculateEffectiveRateAndTempo();
  }

  set rateChange(rateChange) {
    this._rate = 1.0 + 0.01 * rateChange;
  }

  get tempo() {
    return this._tempo;
  }

  set tempo(tempo) {
    this.virtualTempo = tempo;
    this.calculateEffectiveRateAndTempo();
  }

  set tempoChange(tempoChange) {
    this.tempo = 1.0 + 0.01 * tempoChange;
  }

  set pitch(pitch) {
    this.virtualPitch = pitch;
    this.calculateEffectiveRateAndTempo();
  }

  set pitchOctaves(pitchOctaves) {
    this.pitch = Math.exp(0.69314718056 * pitchOctaves);
    this.calculateEffectiveRateAndTempo();
  }

  set pitchSemitones(pitchSemitones) {
    this.pitchOctaves = pitchSemitones / 12.0;
  }

  get inputBuffer() {
    return this._inputBuffer;
  }

  get outputBuffer() {
    return this._outputBuffer;
  }

  calculateEffectiveRateAndTempo() {
    const previousTempo = this._tempo;
    const previousRate = this._rate;
    this._tempo = this.virtualTempo / this.virtualPitch;
    this._rate = this.virtualRate * this.virtualPitch;

    if (testFloatEqual(this._tempo, previousTempo)) {
      this.stretch.tempo = this._tempo;
    }

    if (testFloatEqual(this._rate, previousRate)) {
      this.transposer.rate = this._rate;
    }

    if (this._rate > 1.0) {
      if (this._outputBuffer != this.transposer.outputBuffer) {
        this.stretch.inputBuffer = this._inputBuffer;
        this.stretch.outputBuffer = this._intermediateBuffer;
        this.transposer.inputBuffer = this._intermediateBuffer;
        this.transposer.outputBuffer = this._outputBuffer;
      }
    } else {
      if (this._outputBuffer != this.stretch.outputBuffer) {
        this.transposer.inputBuffer = this._inputBuffer;
        this.transposer.outputBuffer = this._intermediateBuffer;
        this.stretch.inputBuffer = this._intermediateBuffer;
        this.stretch.outputBuffer = this._outputBuffer;
      }
    }
  }

  process() {
    if (this._rate > 1.0) {
      this.stretch.process();
      this.transposer.process();
    } else {
      this.transposer.process();
      this.stretch.process();
    }
  }

}

class WebAudioBufferSource {
  constructor(buffer) {
    this.buffer = buffer;
    this._position = 0;
  }

  get dualChannel() {
    return this.buffer.numberOfChannels > 1;
  }

  get position() {
    return this._position;
  }

  set position(value) {
    this._position = value;
  }

  extract(target, numFrames = 0, position = 0) {
    this.position = position;
    let left = this.buffer.getChannelData(0);
    let right = this.dualChannel ? this.buffer.getChannelData(1) : this.buffer.getChannelData(0);
    let i = 0;

    for (; i < numFrames; i++) {
      target[i * 2] = left[i + position];
      target[i * 2 + 1] = right[i + position];
    }

    return Math.min(numFrames, left.length - position);
  }

}

const getWebAudioNode = function (context, filter, sourcePositionCallback = noop, bufferSize = 4096) {
  const node = context.createScriptProcessor(bufferSize, 2, 2);
  const samples = new Float32Array(bufferSize * 2);

  node.onaudioprocess = event => {
    let left = event.outputBuffer.getChannelData(0);
    let right = event.outputBuffer.getChannelData(1);
    let framesExtracted = filter.extract(samples, bufferSize);
    sourcePositionCallback(filter.sourcePosition);

    if (framesExtracted === 0) {
      filter.onEnd();
    }

    let i = 0;

    for (; i < framesExtracted; i++) {
      left[i] = samples[i * 2];
      right[i] = samples[i * 2 + 1];
    }
  };

  return node;
};

const pad = function (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

const minsSecs = function (secs) {
  const mins = Math.floor(secs / 60);
  const seconds = secs - mins * 60;
  return `${mins}:${pad(parseInt(seconds), 2)}`;
};

const onUpdate = function (sourcePosition) {
  const currentTimePlayed = this.timePlayed;
  const sampleRate = this.sampleRate;
  this.sourcePosition = sourcePosition;
  this.timePlayed = sourcePosition / sampleRate;

  if (currentTimePlayed !== this.timePlayed) {
    const timePlayed = new CustomEvent('play', {
      detail: {
        timePlayed: this.timePlayed,
        formattedTimePlayed: this.formattedTimePlayed,
        percentagePlayed: this.percentagePlayed
      }
    });

    this._node.dispatchEvent(timePlayed);
  }
};

class PitchShifter {
  constructor(context, buffer, bufferSize, onEnd = noop) {
    this._soundtouch = new SoundTouch();
    const source = new WebAudioBufferSource(buffer);
    this.timePlayed = 0;
    this.sourcePosition = 0;
    this._filter = new SimpleFilter(source, this._soundtouch, onEnd);
    this._node = getWebAudioNode(context, this._filter, sourcePostion => onUpdate.call(this, sourcePostion), bufferSize);
    this.tempo = 1;
    this.rate = 1;
    this.duration = buffer.duration;
    this.sampleRate = context.sampleRate;
    this.listeners = [];
  }

  get formattedDuration() {
    return minsSecs(this.duration);
  }

  get formattedTimePlayed() {
    return minsSecs(this.timePlayed);
  }

  get percentagePlayed() {
    return 100 * this._filter.sourcePosition / (this.duration * this.sampleRate);
  }

  set percentagePlayed(perc) {
    this._filter.sourcePosition = parseInt(perc * this.duration * this.sampleRate);
    this.sourcePosition = this._filter.sourcePosition;
    this.timePlayed = this.sourcePosition / this.sampleRate;
  }

  get node() {
    return this._node;
  }

  set pitch(pitch) {
    this._soundtouch.pitch = pitch;
  }

  set pitchSemitones(semitone) {
    this._soundtouch.pitchSemitones = semitone;
  }

  set rate(rate) {
    this._soundtouch.rate = rate;
  }

  set tempo(tempo) {
    this._soundtouch.tempo = tempo;
  }

  connect(toNode) {
    this._node.connect(toNode);
  }

  disconnect() {
    this._node.disconnect();
  }

  on(eventName, cb) {
    this.listeners.push({
      name: eventName,
      cb: cb
    });

    this._node.addEventListener(eventName, event => cb(event.detail));
  }

  off(eventName = null) {
    let listeners = this.listeners;

    if (eventName) {
      listeners = listeners.filter(e => e.name === eventName);
    }

    listeners.forEach(e => {
      this._node.removeEventListener(e.name, event => e.cb(event.detail));
    });
  }

}
/*
export { AbstractFifoSamplePipe, PitchShifter, RateTransposer, SimpleFilter, SoundTouch, Stretch, WebAudioBufferSource, getWebAudioNode };

*/


module.exports = {
  AbstractFifoSamplePipe,
  PitchShifter,
  RateTransposer,
  SimpleFilter,
  SoundTouch,
  Stretch,
  WebAudioBufferSource,
  getWebAudioNode
};

},{}]},{},[4]);
