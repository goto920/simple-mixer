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

import * as SoundTouch from 'soundtouchjs';
import MyFilter from './MyFilter';
import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

const noop = function() {return;}

export default class MyPitchShifter {
  constructor(context, numOfInputFrames, bufferSize, 
      record = false, bypass = false){

    console.log('new MyPitchShifter instance');
    this.context = context;
    this.bufferSize = bufferSize;
    this.record = record;
    this.bypass = bypass;
    this.recordedSamples = [[],[]];
    this.lastPlayingAt = 0;

    this._soundtouch = new SoundTouch.SoundTouch();
    this._filter = new MyFilter(this._soundtouch, noop); 
    this._onEnd = noop;
    this._onUpdate = noop;
    this._onUpdateInterval = 0.5;

    this._node = context.createScriptProcessor(bufferSize,2,2);
    this._node.onaudioprocess = this.onaudioprocess.bind(this);
    this._totalInputFrames = numOfInputFrames;
    this._recordedBuffer = null;
    this._nVirtualOutputFrames = 0;
    this._playingAt = 0;

    this.outSamples = new Float32Array(bufferSize*2);
    this.inSamples  = new Float32Array(bufferSize*2);
    this.sampleRate = context.sampleRate; 
    this.nInputFrames = 0;
    // this.moreInput = true;

  }

  set totalInputFrames(nframes){ this._totalInputFrames = nframes;}
  get totalInputFrames(){ return this._totalInputFrames;}

  get totalVirtualOutputFrames(){ return this._nVirtualOutputFrames;}

  get playingAt(){
    return this._playingAt;
  }

  get node(){ return this._node; }
  set tempo(tempo){ this._soundtouch.tempo = tempo; }
  get tempo(){ return this._soundtouch.tempo; }
  set pitch(pitch){ this._soundtouch.pitch = pitch; }
  get rate(){ return this._soundtouch.rate; }

  get recordedBuffer(){ 
    if (this._recordedBuffer === null) this.createProcessedBuffer();
    return this._recordedBuffer; 
  }

  set onEnd(func){ this._onEnd = func; }
  set onUpdate(func){ this._onUpdate = func; }
  set onUpdateInterval(val){ this._onUpdateInterval = val;}
  get onUpdateInterval(){ return this._onUpdateInterval;}

  stop(){ 
    if (this._node.onaudioprocess) {
      console.log('shifter stop');
      this._node.onaudioprocess = null; 
      this._node.disconnect();
      this._onEnd(); 
    }
  }

/*
  connect(node){
    this._node.connect(node);
  }
*/


  createProcessedBuffer(){

    if (!this.record) return;

    const outputBuffer = this.context.createBuffer(
      this.recordedSamples.length, // channels
      this.recordedSamples[0].length, // sample length
      this.sampleRate
    );

    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);
    left.set(this.recordedSamples[0]);
    right.set(this.recordedSamples[1]);
    // Typedarray.set(array[, offset])

    this._recordedBuffer = outputBuffer;
    // console.log('this._recordedBuffer len = ', this._recordedBuffer.length);

  } // end createProcessedBuffer()

  onaudioprocess(e){

   if (this.bypass) { // pass through for test
     if (this._nVirtualOutputFrames <= this._totalInputFrames){
       this.passThrough(e.inputBuffer,e.outputBuffer); // through for test
       this._nVirtualOutputFrames += e.outputBuffer.length;
     } else this.stop();
   } else {
     if (this._nVirtualOutputFrames <= this._totalInputFrames){
       const nOutputFrames = this.process(e.inputBuffer,e.outputBuffer);
       this._nVirtualOutputFrames += nOutputFrames*this._soundtouch.tempo;
     } else this.stop();
   }

   this._playingAt = this._nVirtualOutputFrames/this.sampleRate;

   if (this.playingAt - this.lastPlayingAt >= this._onUpdateInterval) {
      this._onUpdate();
      this.lastPlayingAt = this._playingAt;
   }

   this.nInputFrames += e.inputBuffer.length; 

  }

  process(inputBuffer,outputBuffer) { // using soundtouchjs 
    // input part

    const leftIn = inputBuffer.getChannelData(0);
    const rightIn = inputBuffer.getChannelData(1);
    const inSamples = this.inSamples; // LR Interleave
    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);

    for (let i = 0; i < inputBuffer.length; i++) {
        inSamples[2*i] = leftIn[i]; 
        inSamples[2*i + 1] = rightIn[i]; 
    }
    this._filter.putSource(inSamples);

   // Output  node.onaudioprocess in function getWebAudioNode
   // context, filter, sourcePositionCallback
    const outSamples = this.outSamples;
    const framesExtracted = this._filter.extract(outSamples, this.bufferSize);

    for (let i=0; i < framesExtracted; i++) {
      left[i]  = outSamples[i * 2]; 
      right[i] = outSamples[i * 2 + 1];
      if (this.record) {
        this.recordedSamples[0].push(left[i]);
        this.recordedSamples[1].push(right[i]);
      }
    } 

    return framesExtracted;

  } // End process

 // just copy inputBuffer to outputBuffer for test 
  passThrough(inputBuffer, outputBuffer){ 
    const nc = outputBuffer.numberOfChannels;
    for (let channel=0; channel < nc; channel++){
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      output.set(inputBuffer.getChannelData(channel)); 

      if (this.record) 
        for (let i = 0; i < outputBuffer.length; i++) 
          this.recordedSamples[channel].push(input[i]);
    }

  } // End pathThrough()

  exportToFile (filename){
    if (!this.record) return;

    console.log ('exportToFile: ', filename,
      'length: ', this.recordedSamples[0].length);

    if (this._recordedBuffer === null) this.createProcessedBuffer();

    const blob = new Blob([toWav(this._recordedBuffer)], 
       {type: 'audio/vnd.wav'});
    saveAs(blob, filename);

    return;
  } // end exportToFile()

};
