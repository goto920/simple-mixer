import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

const noop = function() {return;}
const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

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
    console.log(this.name, '.stop()');
/*
    if (this.recording){
      console.log('Node --> worklet getRecordedSamples');
      this.port.postMessage({command: 'getRecordedSamples', args: []});
    }
*/
    this.disconnect();
    // await this._recordedBuffer is filled
    console.log(this.name,'sleep begin');
    await sleep(3000); // sleep in msec
    console.log(this.name,'sleep end');
    this._onEnd(this._recordedBuffer);
  }

  messageProcessor(e){
    if(e.data.command){
      const {command,args} = e.data;
      console.log(this.name, 'recvd', command);
      switch(command) {
        case 'End':
          this.recordedSamples = args[0]; 
          if (this.recording) this.createRecordedBuffer();
          console.log (this.name, 'Worklet end. recordedSamples', 
          this.recordedSamples[0].length);
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

  exportToFile (filename){
    if (!this.recording) return;
    if (!this._recordedBuffer){
      console.log(this.name,'recordedBuffer is null! Cannot export');
      return;
    }

    const blob = new Blob([toWav(this._recordedBuffer)], 
       {type: 'audio/vnd.wav'});
    saveAs(blob, filename);

    return;
  } // end exportToFile()

  createRecordedBuffer() {
    console.log (this.name,'output from worklet', 
      this.recordedSamples[0].length);

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
