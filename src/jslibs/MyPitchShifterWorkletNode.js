import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

const noop = function() {return;}
// const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

class MyPitchShifterWorkletNode extends AudioWorkletNode {
  constructor(context,workletName, options){
    super(context, workletName, options);

    this.name = this.constructor.name;

    // this.context = context; // already in super class
    this.recording = options.processorOptions.recording;
    this.sampleRate = options.processorOptions.sampleRate;
    this.port.onmessage = this.messageProcessor.bind(this);
    this._onUpdate = noop;
    this._onEnd = noop;
    this.recordedSamples = null;
    this._recordedBuffer = null;
   
    this.running = true;

  } // End constructor()

get node(){ return this;} // for compatibility

  set onEnd (func) { this._onEnd = func; }
  set onUpdate (func) { this._onUpdate = func;}

  set onUpdateInterval (value) { 
    this.port.postMessage({command: 'onUpdateInterval', args: [value]});}
  set tempo(value){
    this.port.postMessage({command: 'setTempo', args: [value]}); }
  set pitch(value){
    this.port.postMessage({command: 'setPitch', args: [value]}); }
  get tempo(){
    this.port.postMessage({command: 'getTempo', args: []}); 
    return this.tempo;
  }
  get pitch(){
    this.port.postMessage({command: 'getPitch', args: []}); 
    return this.pitch;
  }

  get recordedBuffer(){
    return this._recordedBuffer;
  }

  async stop(){
    if (!this.running) return;

    console.log(this.name, '.stop()');
    await this.port.postMessage({command: 'stop', args: []});

    this.disconnect();
/*
    // await this._recordedBuffer is filled
    console.log(this.name,'sleep begin');
    await sleep(3000); // sleep in msec
    console.log(this.name,'sleep end');
*/
    this._onEnd(this._recordedBuffer);

    this.running = false;
  }

  messageProcessor(e){
    if(e.data.command){
      const {command,args} = e.data;
      // console.log(this.name, 'recvd', command);
      switch(command) {
        case 'End':
          // console.log(this.name, 'recvd', command);
        /*
          this.recordedSamples = args[0]; 
          if (this.recordedSamples)
             console.log (this.name, 'worklet stopped. recordedSamples');
          else
             console.log (this.name, 'worklet stopped. NO recordedSamples');
          if (this.recording) this.createRecordedBuffer();
        */

          this.stop();
        break;
        case 'update' : 
          this._onUpdate(args[0]); // this.playingAt = args[0];
        break;

        default:
      }
      return;
    }

    if (e.data.status){
      const value = e.data.args[1];
      switch(e.data.args[0]){
        case 'getTempo': this.tempo = value; break;
        case 'getPitch': this.pitch = value; break;
        default:
      }
      return;
    }
  } // End messgeProcessor()

  exportToFile (filename, audioBuffer = null){

    let output = null;
    if (audioBuffer !== null) output = audioBuffer;
    else if (this._recordedBuffer !== null)
      output = this._recordBuffer; // use internal record
    else {console.log ('output AudioBuffer is null'); return; }

    const blob = new Blob([toWav(output)], {type: 'audio/vnd.wav'});
    saveAs(blob, filename);

    return;
  } // end exportToFile()

  createRecordedBuffer() {
    if (!this.recordedSamples) {
      console.log (this.name,'this.recordedBuffer empty') 
      return;
    }

    if (this.recordedSamples[0].length === 0) return null;

    this._recordedBuffer = this.context.createBuffer(
      this.recordedSamples.length, // channels
      this.recordedSamples[0].length, // sample length
      this.sampleRate
    );

    const left = this._recordedBuffer.getChannelData(0);
    const right = this._recordedBuffer.getChannelData(1);
    left.set(this.recordedSamples[0]);
    right.set(this.recordedSamples[1]);

    console.log(this.name,'createRecordedBuffer done');
    return this._recordedBuffer;

  } // End createRecordedBuffer

};

export default MyPitchShifterWorkletNode;

