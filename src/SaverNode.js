import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

class SaverNode {

  constructor(audioCtx, sampleRate){
    // super();
    this.audioCtx = audioCtx;
    this.sampleRate = sampleRate;
    this.outputSamples = [[],[]];

    this.processed = 0;
    this._record = false; // add _ for setter/getter value
    this._node = this.audioCtx.createScriptProcessor(4096,2,0);

    // this.process = this.process.bind(this);
    // this.exportFile = this.exportFile.bind(this);
    // this.getProcessedTime = this.getProcessedTime.bind(this);
  } // End constructor

  reset() {this.processed = 0; }

  get node(){
    return this._node;
  }

  get record(){
    return this._record;
  }

  set record(value){
    this._record = value;
  }

  getProcessedTime() {
    return (this.processed/this.sampleRate); 
  } // End getCurrentTime

  getProcessedSample() {
    return this.processed;
  } // End getCurrentTime

  process(inputBuffer, outputBuffer){ // no output
    const nc = inputBuffer.numberOfChannels;

    if (this._record){
      for (let channel = 0; channel < nc; channel++){
        const inPCM = inputBuffer.getChannelData(channel);
        for(let i=0; i < inPCM.length; i++)
          this.outputSamples[channel].push(inPCM[i]);
      }
    }

    this.processed += inputBuffer.getChannelData(0).length;

    return;
  } // end process

  exportFile(filename){

    if (!this._record) return;
    console.log ('exportFile: ', filename);
    console.log('length: ', this.outputSamples[0].length);

    let outputBuffer = this.audioCtx.createBuffer(
      this.outputSamples.length, // channels
      this.outputSamples[0].length, // sample length
      this.sampleRate
    );

    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);

    left.set(this.outputSamples[0]);
    right.set(this.outputSamples[1]);
    // TypedArray.prototype.set()
    // typedarray.set(array[, offset])

    const blob = new Blob([toWav(outputBuffer)], {type: 'audio/vnd.wav'});
    saveAs(blob, filename);

    return;
  } // end export

} // end class

export default SaverNode;
