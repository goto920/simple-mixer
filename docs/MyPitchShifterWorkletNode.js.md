# jslibs/MyPitchShifterWorkletNode.js, public/worklet/src/MySoundTouchWorklet.js #

- AudioWorklet is public/worklet/src/MySoundTouchWorklet.js
  - https://github.com/cutterbl/soundtouchjs-audio-worklet is NOT used
     - soundtouchjs-audio-worklet uses soundtouchJS (pure JS implementation)
- MySoundTouchWorklet is my original code
  - using a copy of jslib/MyFilter.js 
and a copy of soundtouchjs/dist/soundtouch.js

## Concept/data flow ##

```
in App.js
             onUpdate()   onEnd()      export or play (e.renderedBuffer)
                  ^        ^                ^
                  |        |                |
           MyPitchShifterWorkletNode   oncomplete(e) 
                   ^ |
   source +        | |                 +-> context.destination 
          |        | |                 | 
    input |        | |message          | output
          V        | V                 | 
       MySoundTouchWorklet ('my-soundtouch-processor')

```
# src/jslibs/MyPitchShifterWorkletNode.js #

- Just an interface to the AudioWorklet and main (App.js. Then this is short.

```
import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

const noop = function() {return;}
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

class MyPitchShifterWorkletNode extends AudioWorkletNode {
  constructor(context,workletName, options){
    super(context, workletName, options); // options are passed to worklet
  // this.sampleRate =  (get from options) ...
  // omit 
  // similar to MyPitchShifter.js
  this.port.onmessage = this.messageProcessor.bind(this);
  this._onUpdate = noop;
  this._onEnd = noop;
  }

 // for compatibility with ScriptProcessor version
  set node(){ return this;} 
  set onEnd (func) { this._onEnd = func; }
  set onUpdate (func) { this._onUpdate = func;}

  // send a message to worklet to set parameters
  set onUpdateInterval (value) { 
    this.port.postMessage({command: 'onUpdateInterval', args: [value]});}
  set tempo(value){
    this.port.postMessage({command: 'setTempo', args: [value]}); }
  set pitch(value){
    this.port.postMessage({command: 'setPitch', args: [value]}); }

  async stop(){
    console.log(this.name, '.stop()');
    this.disconnect();
    await sleep(3000); // sleep in m sec 
    // to wait for recorded buffer is returned
    this._onEnd(this._recordedBuffer);
  }

  messageProcessor(e){
    if(e.data.command){
      const {command,args} = e.data;
      case 'End': 
       // receive recorded samples
       // create AudioBuffer
       this.stop(); 
      break;
      case 'update' : 
       this._onUpdate(args[0]); // this.playingAt = args[0];
      break;
    // ... omit
  }   

 exportToFile (filename){
  // omit
 }

 createRecordedBuffer() {
  // omit
 }


```

# public/worklet/src/MySoundTouchWorklet.js #

- Processing half of MyPitchShifter.js (ScriptProcessor)
- message passing is used instead of callback
- A Large message (recorded samples) makes Firefox crash 

```
import MyFilter from './MyFilter-modified';
import { SoundTouch } from './soundtouch-modified';

class MySoundTouchWorkletProcessor extends AudioWorkletProcessor {
  constructor(options){ // options given to MyPitchShifterWorkletNode
    // omit
    // Set messageProcessor method to handle received messages
    this.port.onmessage = this.messageProcessor.bind(this);
    this.soundtouch = new SoundTouch();
    this.filter = new MyFilter(this.soundtouch, noop);
    // omit
}

/* process (input and output are array of AudioBuffers[channel] 
 * channel[0][0] left, [0][1] right 
 * "return false" stops call to process() in the case of Chrome
 * Other lines are exactly same as in ScriptProcessor onaudioprocess
 */
  process(inputs,outputs,parameters){ // parameters not used
    if (inputs[0].length !== 2) return true; // no input (must be 2 for stereo) 

    if (this.nVirtualOutputFrames <= this.options.nInputFrames){
        const nOutputFrames = this.processFilter(inputs[0],outputs[0]);
        this.nVirtualOutputFrames += nOutputFrames*this.soundtouch.tempo;
    } else {this.stop(); return false;}
    // omit
  }

  processFilter(inputBuffer,outputBuffer) { // using soundtouchjs
    // almost same as in MyPitchShifter.process()
  }

  /* send a message to MyPitchShifterNode (AudioWorkletNode) 
   * instead of callback 
   */ 
  updatePlayingAt(){
    this.port.postMessage({ command: 'update', args: [this.playingAt] });
  }

  /* stop internally and send a notice and recorded audio samples as a message
   * Firefox crashes with a large message (out of memory?)
   */
 async stop() {
    console.log (this.name, '.stop() recording', this.options.recording);
    this.process = null; // "return null" does not work on Firefox
    await this.updatePlayingAt();

 await this.port.postMessage({ 
        command: 'End', args: [this.recordedSamples]});

 messageProcessor (event) {
   const {command,args} = event.data;
   // switch
   switch(command){
    case 'setTempo': ... break;
    case 'setPitch': ... break;
    // omit 
   }
 }

}; // end of class

// register module name used in MyPitchShifterWorkletNode (AudioWorkletNode)
registerProcessor('my-soundtouch-processor', MySoundTouchWorkletProcessor);

```
