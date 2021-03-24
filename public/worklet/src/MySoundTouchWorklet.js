/*

  npm install -g browserify
  npm install esmify --save-dev
  npm install browser-resolve --save-dev

  Copy every file here and fix import lines 
  (export line of node_modules/soundtouchjs/dist/soundtouch.js )

  browserify this-file.js -p esmify > ../bundle.js
  (as public/worklet/bundle.js)

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

import MyFilter from './MyFilter-modified';
import { SoundTouch } from './soundtouch-modified';

class MySoundTouchWorkletProcessor extends AudioWorkletProcessor {
  constructor(options){
     super();
//    super(options);
     this.name = this.constructor.name;
    // console.log(this.name, options);

/*
    options.processorOptions {
            bypass: true/false,
            recording: true/false,
            nInputFrames: 
            updateInterval: callback interval for playingAt,
            sampleRate:
    }
*/

    this.options = options.processorOptions;

    this.nOutputFrames = 0;
    this.nVirtualOutputFrames = 0;

    this.playingAt = 0;
    this.lastPlayingAt = 0;

    this.updateInterval = this.options.updateInterval;
    this.soundtouch = new SoundTouch();
    // console.log(this.name, this.soundtouch);
    this.filter = new MyFilter(this.soundtouch, noop);

    this.recordedSamples = [[],[]];

    this.inSamples = new Float32Array(128*2);
    this.outSamples = new Float32Array(128*2);

    this.port.onmessage = this.messageProcessor.bind(this);
    this.process = this.process.bind(this);
    this.passThrough = this.passThrough.bind(this);
    this.running = true;

  } // end constructor

  messageProcessor (event) {

    if (event.data.command) {
      const {command,args} = event.data;
      // console.log(this.name, command);
      switch(command){
        case 'setTempo': 
          this.soundtouch.tempo = args[0];
          this.port.postMessage({ 
            status: 'OK', args: [command, this.soundtouch.tempo], });
        break;

        case 'getTempo': 
          this.port.postMessage({
            status: 'OK', args: [command, this.soundtouch.tempo],
          });
        break;

        case 'setPitch': 
          this.soundtouch.pitch = args[0];
          this.port.postMessage({
            status: 'OK', args: [command, this.soundtouch.pitch]});
        break;

        case 'getPitch': 
          this.port.postMessage({ 
          status: 'OK', args: [command, this.soundtouch.pitch]});
        break;

        case 'setUpdateInterval': 
          this.options.updateInterval = args[0];
          this.port.postMessage({ 
            status: 'OK', args: [command, this.updateInterval]});
        break;
     
        case 'stop': this.stop(); break;

        default:
      } // end switch
    } // end if (command)

  } // end messageProcessor()

  async stop() {

    if (!this.running) return;

    this.running = false;

    console.log (this.name, '.stop() with recording', this.options.recording);
    this.process = null; // "return null" does not work on Firefox
    await this.updatePlayingAt();
    console.log (this.name, 'updatePlayingAt sent');

    if (this.options.recording)
      console.log (this.name, 'recordedSamples', 
        this.recordedSamples[0].length, 'nInputFrames', 
        this.options.nInputFrames);
  
    try {
       await this.port.postMessage({ 
        command: 'End', args: [this.recordedSamples]});
    } catch (e) { console.log(this.name, e);}

    console.log (this.name, 'Worklet --> Node: End');
  }

  updatePlayingAt(){
    this.port.postMessage({ command: 'update', args: [this.playingAt] });
  }

  process(inputs,outputs,parameters){
    if (inputs[0].length !== 2) return true;

    if (this.options.bypass) { // pass through for test
      if (this.nVirtualOutputFrames <= this.options.nInputFrames){
        this.passThrough(inputs[0],outputs[0]); // through for test
        this.nVirtualOutputFrames += outputs[0][0].length;
      } else {
        console.log(this.name, 'calling stop() at', this.playingAt); 
          this.stop(); return false; }

    } else {
      if (this.nVirtualOutputFrames <= this.options.nInputFrames){
        const nOutputFrames = this.processFilter(inputs[0],outputs[0]);
        this.nVirtualOutputFrames += nOutputFrames*this.soundtouch.tempo;
      } else {
        console.log(this.name, 'calling stop() at', this.playingAt); 
        this.stop(); return false; }
    }

   this.playingAt = this.nVirtualOutputFrames/this.options.sampleRate;

   if (this.playingAt - this.lastPlayingAt >= this.options.updateInterval) {
      this.updatePlayingAt();
      this.lastPlayingAt = this.playingAt;
   }

   this.options.nInputFrames += inputs[0].length; 

   return true;
  } // end process()

  passThrough(inputBuffer, outputBuffer){ 
    // input is just left, right array of 128 frames
    // console.log('passThrough', inputBuffer[0].length)

    const nc = outputBuffer.length; // channel

    for (let channel = 0; channel < nc; channel++){
      const input = inputBuffer[channel];
      const output = outputBuffer[channel];
      output.set(input); 

      if (this.options.recording) 
        for (let i = 0; i < output.length; i++) 
          this.recordedSamples[channel].push(input[i]);
    }

  } // End passThrough()

  processFilter(inputBuffer,outputBuffer) { // using soundtouchjs 
    // 128 frames (fixed length) for AudioWorkletProcessor

    // input part
    const leftIn = inputBuffer[0];
    const rightIn = inputBuffer[1];
    const left = outputBuffer[0];
    const right = outputBuffer[1];

    const inSamples = this.inSamples; // LR Interleaved for soundtouch

    for (let i = 0; i < inputBuffer[0].length; i++) {
      inSamples[2*i] = leftIn[i]; 
      inSamples[2*i + 1] = rightIn[i]; 
    }

    this.filter.putSource(inSamples);

    const framesExtracted = this.filter.extract(this.outSamples, 128);

    for (let i=0; i < framesExtracted; i++) {
      left[i]  = this.outSamples[i * 2]; 
      right[i] = this.outSamples[i * 2 + 1];

      if (this.options.recording) {
        this.recordedSamples[0].push(left[i]);
        this.recordedSamples[1].push(right[i]);
      }
    } 

    return framesExtracted;

  } // End processFilter()


};

registerProcessor('my-soundtouch-processor', MySoundTouchWorkletProcessor);
