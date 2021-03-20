/*
   Written by goto at kmgoto.jp (Mar. 2021)
   Copyright of my code is not claimed.

   Based on soundtouchjs/src/PitchShifter.js, SimpleFilter.js

   Modified for use as intermediate ScriptProcessorNode.
   Note: Output does not work for OfflineAudioContext.

   1) PitchShifter ---> MyPitchShifter (minimum code)
                     includes ScriptProcessorNode

   2) MyFilter extends SimpleFilter

   Pitch modification and slow down/speed up work.
   Slow down only for real-time playback.
   fast playback is impossible by nature.

 */

import { SimpleFilter } from 'soundtouchjs'; 

const noop = function () {return;}

export default class MyFilter extends SimpleFilter {
  constructor(pipe, callback = noop){
    super(null, pipe, callback); // sourceSound, callback are not used
    this.callback = callback;
    this.sourceSound = [];
    this.historyBufferSize = 22050;
    this._sourcePosition = 0;
    this.outputBufferPosition = 0;
    this._position = 0;
  }

/* new method to put samples from e.inputBuffer in onaudioprocess */
  putSource(source){ 
    //console.log('putSource');
    // for (let i = 0; i < source.length; i++) 
       //this.sourceSound.push(source[i]);
    //
   this.sourceSound.push([...source]);
  } // LR interleaved

/* new method replaces getWebAudioNode.extract() */
  extractSource(outSamples, numFramesReq, frameOffset = 0){
    // console.log('extractSource');
   
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

/* Override */
  fillInputBuffer(numFrames = 0){// samples are LRLR 
    const samples = new Float32Array(numFrames * 2);
    const numFramesExtracted = this.extractSource(samples,numFrames);
    if (numFramesExtracted > 0)
      this.inputBuffer.putSamples(samples,0,numFramesExtracted);
  } 

/* inherited (called when input is end. Not used)
  onEnd() { this.callback(); }
*/


};
