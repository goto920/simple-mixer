# jslibs/MyPitchShifter.js and MyFilter.js outline #

## Concept ##
- This module works as a wrapper of intermediate ScriptProcessor Node
  - in any buffersize (4096, 2048 etc.)
  - works with OfflineAudioContext
- Original soundtouchJS/PitchShifter.js is designed to be a source node
  - All audio samples are loaded at once in the constructor

```
PitchShifter.js --> context.destination or other nodes
 (audio source) output only

souce --> MyPitchShifter.node --> context.destination  or other nodes
      input                 output

Note: 

playback speed <100%: output.length > input.length
              = 100%: output.length = input.length
              > 100%: output.length < input.length
   
```

# MyPitchShifter.js #

## import ##

```
import * as SoundTouch from 'soundtouchjs'; // npm install soundtouchjs
import MyFilter from './MyFilter'; // jslibs/MyFilter.js
import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

```

## constructor ##

```
export default class MyPitchShifter {
  constructor(context, numOfInputFrames, bufferSize, 
      record = false, bypass = false){

    this.context = context;
    // this.... store args
    this.lastPlayingAt = 0;
    this.recordedSamples = [[],[]]; // 2-dim Float32Array to store output

    // SoundTouch instance
    this._soundtouch = new SoundTouch.SoundTouch(); 

    // buffered input/output to/from SoundTouch
    this._filter = new MyFilter(this._soundtouch, noop); 

    // callback functions set in App.js (main)
    this._onEnd = noop; 
    this._onUpdate = noop; 

    // ScriptProcessor
    this._node = context.createScriptProcessor(bufferSize,2,2);
    // To define onaudioprocess of ScriptProsessor in this instance
    this._node.onaudioprocess = this.onaudioprocess.bind(this);

    this._totalInputFrames = numOfInputFrames;
    this._recordedBuffer = null; // AudioBuffer to return in onEnd()
    this._nVirtualOutputFrames = 0; // # of output frames adjusted to speed
    this._playingAt = 0; // virtual Time
    // omit
 }
```

## important setter/public method ##

```
  set tempo(tempo){ this._soundtouch.tempo = tempo; }
  set pitch(pitch){ this._soundtouch.pitch = pitch; }

// set callback function
  set onEnd(func){ this._onEnd = func; } // return this._recordedBuffer
  set onUpdate(func){ this._onUpdate = func; } // return this._playintAt
  set updateInterval(val){ this._updateInterval = val;}

  stop(){  
   if (this._node.onaudioprocess) {
      this._node.onaudioprocess = null; 
      this._node.disconnect();
      if (this._recordedBuffer === null) this.createProcessedBuffer();
      this._onUpdate(this._playingAt);
      this._onEnd(this._recordedBuffer); 
   }
  }

```

## onaudioprocess(e) ##

- Audio processing is in process() 
- passThrough() is also defined for test (just copy input to output)
- nVirtualOutputFrames is the number of processed frames if speed were 1.

```
 onaudioprocess(e){

   if (this._nVirtualOutputFrames <= this._totalInputFrames){
      const nOutputFrames = this.process(e.inputBuffer,e.outputBuffer);
      this._nVirtualOutputFrames += nOutputFrames*this._soundtouch.tempo;
   } else this.stop();

   this._playingAt = this._nVirtualOutputFrames/this.sampleRate;

   if (this.playingAt - this.lastPlayingAt >= this._updateInterval) {
      this._onUpdate(this._playingAt);
      this.lastPlayingAt = this._playingAt;
   }
   this.nInputFrames += e.inputBuffer.length;  

 }

```

## process(input, output) ##

```
 process(inputBuffer,outputBuffer) { // using soundtouchjs 
  // input part
    const leftIn = inputBuffer.getChannelData(0);
    const rightIn = inputBuffer.getChannelData(1);
    const inSamples = this.inSamples; // LR Interleave
    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);

    // convert separate arrays L and R to interleaved single array LRLR...
    for (let i = 0; i < inputBuffer.length; i++) {
        inSamples[2*i] = leftIn[i]; 
        inSamples[2*i + 1] = rightIn[i]; 
    }
    this._filter.putSource(inSamples); // put sample into the buffer (MyFilter)

   // output part
    const outSamples = this.outSamples;
    const framesExtracted = this._filter.extract(outSamples, this.bufferSize);

   // LR interleaved samples to outputBuffer (L, R)
   // if (this.record) add outputbuffer to this.recordedSamples
  
    return frameExtracted; 
}

```
## support methods ##

```
  createProcessedBuffer(){
    // copy 2-dim Float32Array samples to AudioBuffer

    const outputBuffer = this.context.createBuffer( ...
    // copy this.recordedSamples to outputBuffer
    this._recordedBuffer = outputBuffer;
  } 

  exportToFile (filename){
    const blob = new Blob([toWav(this._recordedBuffer)], 
     {type: 'audio/vnd.wav'});
    saveAs(blob, filename);
  } 
```

# MyFilter.js (short) #

```
export default class MyFilter extends SimpleFilter {

  constructor(pipe, callback = noop){// pipe is SoundTouch instance
    super(null, pipe, callback); 
    this.callback = callback;
    this.sourceSound = []; // source input buffer
    this.historyBufferSize = 22050;
    this._sourcePosition = 0;
    this.outputBufferPosition = 0;
    this._position = 0;
  }

/* new method to put samples from e.inputBuffer in onaudioprocess */
  putSource(source){ 
    //console.log('putSource');
    for (let i = 0; i < source.length; i++) 
       this.sourceSound.push(source[i]);
  } // LR interleaved

/* new method replaces getWebAudioNode.extract() */
// extract source only if there are enough samples (x 2 for stereo)
  extractSource(outSamples, numFramesReq, frameOffset = 0){
   
    let numFramesExtracted = 0;
    if (this.sourceSound.length < numFramesReq*2) {
      numFramesExtracted = 0;
    } else { 
      outSamples.set(this.sourceSound.slice(0,numFramesReq*2));
      this.sourceSound.splice(0,numFramesReq*2);
      numFramesExtracted = numFramesReq;
    }
    return numFramesExtracted;
  }

/* Override method */
  fillInputBuffer(numFrames = 0){// samples are LRLR 
    const samples = new Float32Array(numFrames * 2);
    const numFramesExtracted = this.extractSource(samples,numFrames);
    if (numFramesExtracted > 0)
      this.inputBuffer.putSamples(samples,0,numFramesExtracted);
  } 

};

```
