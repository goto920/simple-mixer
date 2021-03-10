/*

  npm install -g browserify
  npm install esmify --save-dev
  npm install browser-resolve --save-dev

  Copy every file here and fix import lines 
  (export line of node_modules/soundtouchjs/dist/soundtouch.js )

  browserify this-file.js -p esmify > bundle.js

 */

const noop = function() {return;}

import MyPitchShifter from './MyFilter';
// import { SoundTouch } from './soundtouch';

class MySoundTouchProcessor extends AudioWorkletProcessor {
  constructor(options){
    super();

/*
    this.bypass = options.processorOptions.bypass;
    this.recording = options.processorOptions.recording;
    this.nTotalInputFrames = options.processorOptions.nTotalInputFrames;
    this.processedAudioBuffer = options.processorOptions.processedAudioBuffer;
    this.updateInterval = options.processorOptions.updateInterval;
    this.sampleRate = options.processorOptions.sampleRate;
*/

    this.options = options.processrOptions;

    this.nTotalOutputFrames = 0;
    this.nVirtualOutputFrames = 0;
    this.nInputFrames = 0;

    this.playingAt = 0;
    this.lastPlayingAt = 0;

    this.tempo = 1.0;
    this.pitch = 0.0;

    this.soundtouch = new SoundTouch.SoundTouch();
    this.soundtouch.tempo = this.tempo;
    this.soundtouch.pitch = this.pitch;

    this.filter = new MyFilter(this.soundtouch, noop);

    this.recordedSamples = [[],[]];
    this.inSamples = new Float32Array(128*2);
    this.outSamples = new Float32Array(128*2);

    this.port.onmessage = this.messageProcessor;

  } // end constructor

  messageProcessor (event) {
    switch(event.command){
      case 'setTempo': this.soundtouch.temp = event.value; break;
      case 'setPitch': this.soundtouch.pitch = event.value; break;
      case 'setUpdateInterval': this.updateInterval = event.value; break;
      default:
    }

  }

  stop(){
    // send message to AudioWorkletNode
    createProcessedBuffer();
    this.port.postMessage('End');
  }

  updatePlayingAt(){

  }

  process(inputs,outputs,parameters){

     if (this.bypass) { // pass through for test
       if (this.nVirtualOutputFrames <= this.nTotalInputFrames){
         this.passThrough(inputs[0],outputs[0]); // through for test
         this.nVirtualOutputFrames += outputBuffer.length;
       } else this.stop();
   } else {
     if (this.nVirtualOutputFrames <= this.nTotalInputFrames){
       const nOutputFrames = this.processFilter(inputs[0],outputs[0]);
       this.nVirtualOutputFrames += nOutputFrames*this.soundtouch.tempo;
     } else this.stop();
   }

   this.playingAt = this.nVirtualOutputFrames/this.sampleRate;

   if (this.playingAt - this.lastPlayingAt >= this.onUpdateInterval) {
      this.onUpdate();
      this.lastPlayingAt = this.playingAt;
   }

   this.nInputFrames += inputBuffer.length; 

  } // end process()

  passThrough(inputBuffer, outputBuffer){ 
    const nc = outputBuffer.numberOfChannels;
    for (let channel=0; channel < nc; channel++){
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      output.set(inputBuffer.getChannelData(channel)); 

      if (this.recording) 
        for (let i = 0; i < outputBuffer.length; i++) 
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
      this.sampleRate
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
