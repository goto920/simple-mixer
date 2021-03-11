/*

  npm install -g browserify
  npm install esmify --save-dev
  npm install browser-resolve --save-dev

  Copy every file here and fix import lines 
  (export line of node_modules/soundtouchjs/dist/soundtouch.js )

  browserify this-file.js -p esmify > bundle.js

  To be loaded by 
   audioCtx.audioWorklet.loadModule('worklet/bundle.js)
   You can use any output file name. 
   In case of React, the path is relative to public/.

  Note: soundtouch.js is directly imported since the last line 
    needs to be modified to create "bundle.js".

    // export { AbstractFifoSamplePipe, ....
    module.exports = { AbstractFifosamplePipe, ....

 */

const noop = function() {return;}

import MyFilter from './MyFilter';
import { SoundTouch } from './soundtouch';

class MySoundTouchProcessor extends AudioWorkletProcessor {
  constructor(options){
    super();
//    super(options);
    console.log('worklet', options);
/*
    this.bypass = options.processorOptions.bypass;
    this.recording = options.processorOptions.recording;
    this.InputFrames = options.processorOptions.nInputFrames;
    this.processedAudioBuffer = options.processorOptions.processedAudioBuffer;
    this.updateInterval = options.processorOptions.updateInterval;
    this.sampleRate = options.processorOptions.sampleRate;
*/

    this.options = options.processorOptions;
    console.log('this.options', this.options);

    this.nOutputFrames = 0;
    this.nVirtualOutputFrames = 0;
    this.nInputFrames = 0;

    this.playingAt = 0;
    this.lastPlayingAt = 0;

    this.tempo = 1.0;
    this.pitch = 0.0;

    this.soundtouch = new SoundTouch();
    this.soundtouch.tempo = this.tempo;
    this.soundtouch.pitch = this.pitch;

    this.filter = new MyFilter(this.soundtouch, noop);

    this.recordedSamples = [[],[]];
    this.inSamples = new Float32Array(128*2);
    this.outSamples = new Float32Array(128*2);

    this.port.onmessage = this.messageProcessor.bind(this);
    // this.process = this.process.bind(this);
    // this.passThrough = this.passThrough.bind(this);

  } // end constructor

  messageProcessor (event) {

    if (command) {
      const command = event.command;
      switch(command){

        case 'setTempo': 
          this.soundtouch.tempo = event.args[0];
          this.port.postMessage({ 
            status: 'OK', args: ['setTempo', this.soundtouch.tempo], });
        break;

        case 'getTempo': 
          this.port.postMessage({
            status: 'OK', args: ['getTempo', this.soundtouch.tempo],
          });
        break;

        case 'setPitch': 
          this.soundtouch.pitch = event.args[0];
          this.port.postMessage({
            status: 'OK', args: ['setPitch', this.soundtouch.pitch]});
        break;

        case 'getPitch': 
          this.port.postMessage({ 
          status: 'OK', args: ['getPitch', this.soundtouch.pitch]});
        break;

        case 'setUpdateInterval': 
          this.options.updateInterval = event.args[0];
          this.port.postMessage({ 
            status: 'OK', args: ['getPitch', this.options.updateInterval]});
        break;

        default:
      } // end switch
    } // end if (command)

  } // end messageProcessor()

  stop() {
    this.createProcessedBuffer();
    this.port.postMessage({ command: 'End', args: []});
  }

  updatePlayingAt(){
    this.port.postMessage({ command: 'update', 
      args: [this.playingAt] });
  }

  process(inputs,outputs,parameters){
     // console.log('worklet process called');
     if (this.options.bypass) { // pass through for test
       if (this.nVirtualOutputFrames <= this.nInputFrames){
         this.passThrough(inputs[0],outputs[0]); // through for test
         this.nVirtualOutputFrames += outputs[0].length;
       } else this.stop();
   } else {
     if (this.nVirtualOutputFrames <= this.nInputFrames){
       const nOutputFrames = this.processFilter(inputs[0],outputs[0]);
       this.nVirtualOutputFrames += nOutputFrames*this.soundtouch.tempo;
     } else this.stop();
   }

   this.playingAt = this.nVirtualOutputFrames/this.options.sampleRate;

   if (this.playingAt - this.lastPlayingAt >= this.onUpdateInterval) {
      this.updatePlayintAt();
      this.lastPlayingAt = this.playingAt;
   }

   this.nInputFrames += inputs[0].length; 

  } // end process()

  passThrough(inputBuffer, outputBuffer){ 
    // input is just left, right array of 128 frames
    // console.log('passThrough', inputBuffer[0].length)

    const nc = outputBuffer.length; // channel

    for (let channel = 0; channel < nc; channel++){
      const input = inputBuffer[channel];
      const output = outputBuffer[channel];
      output.set(input); 

      if (this.recording) 
        for (let i = 0; i < output.length; i++) 
          this.recordedSamples[channel].push(input[i]);
    }

  } // End passThrough()

  processFilter(inputBuffer,outputBuffer) { // using soundtouchjs 
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

    this.filter.putSource(inSamples);
   // Output  node.onaudioprocess in function getWebAudioNode
   // context, filter, sourcePositionCallback

    const framesExtracted 
      = this.filter.extract(this.outSamples, this.bufferSize);

    for (let i=0; i < framesExtracted; i++) {
      left[i]  = this.outSamples[i * 2]; 
      right[i] = this.outSamples[i * 2 + 1];

      if (this.recording) {
        this.recordedSamples[0].push(left[i]);
        this.recordedSamples[1].push(right[i]);
      }
    } 

    return framesExtracted;

  } // End process


  createProcessedBuffer(){

    if (!this.record) return;

    const outputBuffer = this.context.createBuffer(
      this.recordedSamples.length, // channels
      this.recordedSamples[0].length, // sample length
      this.options.ampleRate
    );

    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);
    left.set(this.recordedSamples[0]);
    right.set(this.recordedSamples[1]);
    // Typedarray.set(array[, offset])

    this.recordedBuffer = outputBuffer; // Audio buffer returned as the argument
    // console.log('this._recordedBuffer len = ', this._recordedBuffer.length);

  } // end createProcessedBuffer()


};

registerProcessor('my-soundtouch-processor', MySoundTouchProcessor);
