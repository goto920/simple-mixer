import {saveAs} from 'file-saver';
import * as toWav from 'audiobuffer-to-wav';

class SaverNode {

  constructor(audioCtx, sampleRate){
    // super();
    this.audioCtx = audioCtx;
    this.sampleRate = sampleRate;
    this.outputSamples = [[],[]];

    this.processed = 0;
    this.record = false;

    // this.process = this.process.bind(this);
    // this.exportFile = this.exportFile.bind(this);
    // this.getProcessedTime = this.getProcessedTime.bind(this);
  } // End constructor

  reset() {this.processed = 0; }
  setRecord(val) {this.record = val;}

  getProcessedTime() {
    return (this.processed/this.sampleRate); 
  } // End getCurrentTime

  getProcessedSample() {
    return this.processed;
  } // End getCurrentTime

  process(inputBuffer, outputBuffer){
    const nc = outputBuffer.numberOfChannels;

    for (let channel = 0; channel < nc; channel++){
      const inPCM = inputBuffer.getChannelData(channel);
      const outPCM = outputBuffer.getChannelData(channel);
      outPCM.set(inPCM);

      if (this.record){
        for (let i = 0; i < outPCM.length; i++){
          this.outputSamples[channel].push(outPCM[i]);
        } 
      } // end this.record

    }
    // console.log('outSamples: ', this.outputSamples[0].length);
 
    this.processed += inputBuffer.getChannelData(0).length;

    return;
  } // end process

  exportFile(filename){

    if (!this.record) return;

    console.log ('exportFile: ', filename);
    console.log ('channels:', this.outputSamples.length);
    console.log('length: ', this.outputSamples[0].length);

    let outputBuffer = this.audioCtx.createBuffer(
      this.outputSamples.length, // channels
      this.outputSamples[0].length, // sample length
      this.sampleRate
    );

    const left = outputBuffer.getChannelData(0);
    const right = outputBuffer.getChannelData(1);

    for (let i = 0; i < left.length; i++ ){
      left[i]  = this.outputSamples[0][i]; 
      right[i] = this.outputSamples[1][i]; 
    }

    // left.set(this.outputSamples[0]);
    // right.set(this.outputSamples[1]);

    const blob = new Blob([toWav(outputBuffer)], {type: 'audio/vnd.wav'});
    saveAs(blob, filename);

    return;
  } // end export

} // end class

export default SaverNode;
