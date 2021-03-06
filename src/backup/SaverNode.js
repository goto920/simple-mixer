import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

class SaverNode {

  constructor(audioCtx, sampleRate, record, through = false){
    // super();
    console.log('SaverNode new instance');
    this.audioCtx = audioCtx;
    this.sampleRate = sampleRate;
    this.outputSamples = [[],[]];
    this.through = through;

    this.processed = 0;
    this._record = record; // add _ for setter/getter value
    this._node = this.audioCtx.createScriptProcessor(4096,2,2);
    this._processedBuffer = null;
    // Chrome requires output
    this.nInputSamples = 0;

  } // End constructor

  // reset() {this.processed = 0; }
  stop(){ 
    this._node.disconnect();
    console.log('input samples ',this.nInputSamples);
    console.log('recorded ',this.outputSamples[0].length);
    this._node.onaudioprocess = null; 
  }

  get node(){ return this._node; }
  get record(){ return this._record; }
  getProcessedTime() { return (this.processed/this.sampleRate); } 

  get processedBuffer(){ 
    if (this._processedBuffer === null) this.createProcessedBuffer();
    return this._processedBuffer; 
  }

  createProcessedBuffer(){

    const outputBuffer = this.audioCtx.createBuffer(
      this.outputSamples.length, // channels
      this.outputSamples[0].length, // sample length
      this.sampleRate
    );

    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);
    left.set(this.outputSamples[0]);
    right.set(this.outputSamples[1]);
    // Typedarray.set(array[, offset])

    this._processedBuffer = outputBuffer;
    console.log('processedBuffer len = ', outputBuffer.length);
    console.log('this._processedBuffer len = ', this._processedBuffer.length);

  } // end createProcessedBuffer()

  process(inputBuffer, outputBuffer){ // no output
    const nc = inputBuffer.numberOfChannels;

    this.nInputSamples += inputBuffer.length;

    if (this.through){
      for (let channel = 0; channel < nc; channel++){
        const inPCM = inputBuffer.getChannelData(channel);
        const out   = outputBuffer.getChannelData(channel);
        out.set(inPCM); // copy test
      }
    }

    if (this._record){
      // console.log('record');
      for (let channel = 0; channel < nc; channel++){
        const inPCM = inputBuffer.getChannelData(channel);
        for(let i=0; i < inPCM.length; i++) 
          this.outputSamples[channel].push(inPCM[i]);
      }
    }

    this.processed += inputBuffer.length;

    return;
  } // end process

  exportFile(filename){
    console.log ('exportFile: ', filename);
    console.log('length: ', this.outputSamples[0].length);

    if (!this._record) return;

    if (this._processedBuffer === null) this.createProcessedBuffer();

    // const blob = new Blob([toWav(outputBuffer)], {type: 'audio/vnd.wav'});
    const blob = new Blob([toWav(this._processedBuffer)], 
       {type: 'audio/vnd.wav'});
    saveAs(blob, filename);

    return;
  } // end export

} // end class

export default SaverNode;
