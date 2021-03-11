const noop = function() {return;}

class MySoundTouchWorkletNode extends AudioWorkletNode {
  constructor(context,workletName, options){
    super(context, workletName, options);

    // this.context = context;
    this.port.onmessage = this.messageProcessor;
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

  messageProcessor(e){
    if(e.command){
      switch(e.command) {
        case 'End': this.onEnd(); break;
        case 'update' : this.onUpdate(); break;
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

};

export default MySoundTouchWorkletNode;
