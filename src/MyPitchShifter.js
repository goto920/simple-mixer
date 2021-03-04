import * as SoundTouch from 'soundtouchjs';
import MyFilter from './MyFilter';

const noop = function() {return;}

export default class MyPitchShifter {
  constructor(context,bufferSize){
    this.context = context;
    this.bufferSize = bufferSize;

    this._soundtouch = new SoundTouch.SoundTouch();
    this._filter = new MyFilter(this._soundtouch, noop); 
    this._onEnd = noop;

    this._node = context.createScriptProcessor(bufferSize,2,2);
    this._node.onaudioprocess = this.onaudioprocess.bind(this);

    this.outSamples = new Float32Array(bufferSize*2);
    this.inSamples  = new Float32Array(bufferSize*2);
    this.sampleRate = context.sampleRate; 
    this._totalInputFrames = 0;
    this.processedFrames = 0;
    this.moreInput = true;
    this.moreOutput = true;
  }

  set totalInputFrames(nframes){ this._totalInputFrames = nframes;}
  get node(){ return this._node; }
  set tempo(tempo){ this._soundtouch.tempo = tempo; }
  get tempo(){ return this._soundtouch.tempo; }
  set pitch(pitch){ this._soundtouch.pitch = pitch; }
  get rate(){ return this._soundtouch.rate; }

  set onEnd(func){
    this._onEnd = func;
  }

  onaudioprocess = function(e){
    // this.bypass(e.inputBuffer,e.outputBuffer); // through for test

    if (this.moreInput 
        && this.processedFrames > this._totalInputFrames){
      console.log ('onaudioprocess: End of input');
      this.moreInput = false;
    }

    if (this.moreOutput){
      const nOutputFrames = this.process(e.inputBuffer,e.outputBuffer);
      if (!this.moreInput && nOutputFrames === 0) {
        console.log ('onaudioprocess: End of output');
        this.moreOutput = false;
        this._onEnd(); // callback
      }
    }

    if (this.moreInput) this.processedFrames += e.inputBuffer.length;

  }

  process(inputBuffer,outputBuffer) { // using soundtouchjs 
    // input part

    const leftIn = inputBuffer.getChannelData(0);
    const rightIn = inputBuffer.getChannelData(1);
    const inSamples = this.inSamples; // LR Interleave
    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);

    if (this.moreInput) {
      for (let i = 0; i < inputBuffer.length; i++) {
        inSamples[2*i] = leftIn[i]; 
        inSamples[2*i + 1] = rightIn[i]; 
      }
      this._filter.putSource(inSamples);
    }

   // Output  node.onaudioprocess in function getWebAudioNode
   // context, filter, sourcePositionCallback
    const outSamples = this.outSamples;
    const framesExtracted 
      = this._filter.extract(outSamples, this.bufferSize);

    for (let i=0; i < framesExtracted; i++) {
       left[i] = outSamples[i * 2]; right[i] = outSamples[i * 2 + 1];} 

    return framesExtracted;

  } // End process

 // just copy inputBuffer to outputBuffer for test 
  bypass(inputBuffer, outputBuffer){ 
    const nc = outputBuffer.numberOfChannels;

    for (let channel=0; channel < nc; channel++){
      const out = outputBuffer.getChannelData(channel);
      out.set(inputBuffer.getChannelData(channel)); 
  //    out.push(inputBuffer.getChannelData(channel)); // test (double)
    }
  }

};
