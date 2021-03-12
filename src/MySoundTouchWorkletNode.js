import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

const noop = function() {return;}

class MySoundTouchWorkletNode extends AudioWorkletNode {
  constructor(context,workletName, options){
    super(context, workletName, options);

    // this.context = context;
    this.port.onmessage = this.messageProcessor.bind(this);
    this._onUpdate = noop;
    this._onEnd = noop;

  } // End constructor()

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

  stop(){
    this.disconnect();
    this._onEnd();
  }

  messageProcessor(e){
    // console.log('Node Recvd', e);
    if(e.data.command){
      switch(e.data.command) {
        case 'End': 
          this.stop();
        break;
        case 'update' : 
          // this.playingAt = e.data.args[0];
          this._onUpdate(e.data.args[0]); 
        break;
        default:
      }
      return;
    }

    if (e.status && e.status === 'OK'){
      const value = e.args[1];
      switch(e.args[0]){
        case 'getTempo': this.tempo = value; break;
        case 'getPitch': this.pitch = value; break;
        default:
      }
    }
  } // End messgeProcessor()

  exportToFile (filename){
    if (!this.record) return;

    if (this._recordedBuffer === null) this.createProcessedBuffer();

    const blob = new Blob([toWav(this._recordedBuffer)], 
       {type: 'audio/vnd.wav'});
    saveAs(blob, filename);

    return;
  } // end exportToFile()


};

export default MySoundTouchWorkletNode;
