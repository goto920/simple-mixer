/* by goto at kmgoto.jp (Mar. 2021) */

export default function checkAudioWorklet() {

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const OfflineAudioContext = window.OfflineAudioContext 
      || window.webkitOfflineAudioContext;

  let isAudioContext = false;
  let isOfflineAudioContext = false;
  let isAudioWorkletNode = false;
  let isAudioWorklet = false;
  let isOfflineAudioWorklet = false;
  let isAddModule = false;
  let isOfflineAddModule = false;

  if (typeof AudioContext === 'function') isAudioContext = true;
  if (typeof OfflineAudioContext === 'function') isOfflineAudioContext = true;
  if (typeof AudioWorkletNode === 'function') isAudioWorkletNode = true;

  if (isAudioContext) {
    const context = new AudioContext();
    try {
      if (typeof context.audioWorklet !== 'undefined') {
        isAudioWorklet = true;
        if (typeof context.audioWorklet.addModule === 'function') 
        isAddModule = true;
      }
    } catch(e) {console.log(e);}
    context.close();
  }

  if (isOfflineAudioContext){
    const context = new OfflineAudioContext(1,1,44100);
    try {
      if (typeof context.audioWorklet !== 'undefined'){ 
        isOfflineAudioWorklet = true;
        if (typeof context.audioWorklet.addModule === 'function') 
          isOfflineAddModule = true;
        }
    } catch(e) {console.log(e);}
  }

  return {
    isAudioContext: isAudioContext,
    isOfflineAudioContext: isOfflineAudioContext,
    isAudioWorkletNode: isAudioWorkletNode,
    isAudioWorklet: isAudioWorklet,
    isOfflineAudioWorklet: isOfflineAudioWorklet,
    isAddModule: isAddModule,
    isOfflineAddModule: isOfflineAddModule,
  };
} // end function
