# App.js outline #

## import ##

```
import { Component }  from 'react';
import './App.css';
import MyPitchShifter from './jslibs/MyPitchShifter'; 
// (omit)
// My JS programs are in src/jslibs/, public/worklet/src

import packageJSON from '../package.json'; // get subversion string I define
import messages from './messages.json'; // English/Japanese messages

// material-ui Icons, Tooltip
import { IconButton, Tooltip } from '@material-ui/core';
import StopOutlinedIcon from '@material-ui/icons/StopOutlined';
// (omit)
```

## Global scope (before class def) ##

```
if (window.navigator.language.slice(0,2) === 'ja') 
...// find browser language setting

// check browser capability
if (OfflineAudioContext)
...
if (AudioWorkletNode)
...
let context = new AudioContext(); 
if (context.audioWorklet && 
    typeof context.audioWorklet.addModule === 'function')
...
context.close();
```

## class App extends Component (export default) ##

### constructor (props) ##

```
    this.audioCtx = null; // created in loadFile()
    this.inputAudio = []; // filled in loadFile()
    this.mixedSource = null; // used to stop when playing processed buffer
    this.shifter = null; // used to stop processing

    this.state = {
      isPlaying: false, // for playback control
      // omit
      playButtonNextAction: 'load files first!', // for playbutton state
      gains: [], // gain for inputAudio[]
      // omit
    }

    // UI handlers (needs bind(this))
    this.loadFiles = this.loadFiles.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    // omit

```

### render() (quite long) ###

```
return (
 // title
 //toggle language
   <Tooltip title={m.switchLang}>
      <button onClick = {this.switchLanguage}>
      {this.state.language === 'ja' ? 'EN' : 'JP' }</button>
   </Tooltip>
 // toggle worklet on/off (material UI)
  <Tooltip title={m.worklet}> 
  <IconButton name='toggleWorklet' ...
 // File selector
     <Tooltip title={m.fileReader}>
     <input type="file" name="loadFiles" multiple
        accept="audio/*" onChange={this.loadFiles} />
     </Tooltip>
 // File clearButton (omit)
 // Playback time slider, timeA, timeB set
     <input type='range' name='timeSlider' ...
     <button name='setA' 
        onClick={()=> this.setState({timeA: this.state.playingAt})}>
        set A
     </button> ...
 // reset A, B
     <button name='reset' 
        onClick={()=> this.setState({timeA: 0, timeB: this.inputAudio[0].data.duration})}>reset ....
// Player Controls
     <div className='text-divider'>{m.playerTitle}</div>
// Mic on/off
   <IconButton 
     onClick={()=> this.setState({micOn: !this.state.micOn})} >
    <MicIcon color={this.state.micOn ? 'secondary' : 'primary'} />
    </IconButton>
// PlayButton (./jslibs/PlayButton.js) -- change color and shape
   <PlayButton 
      nextAction={this.state.playButtonNextAction}
      handler={this.handlePlay}
      messages={m}
   />
/* Stop 
   name: 'stop' as IconButton prop does not work.
   There is no way to know which is clicked Icon or Button.
   Then give a name to the handler with arrow function.
*/
   <IconButton  
     onClick={() => this.handlePlay({target: {name: 'stop'}})} >
     <StopOutlinedIcon 
     color={this.inputAudio.length ? 'primary' : 'disabled'} />
   </IconButton>


//Loop Button (omit)

// File Export (Offline)
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'exportFile'}})} >
       <GetAppIcon 
       color={!this.inputAudio.length || this.state.isPlaying ? 'disabled' : 'primary'} />
     </IconButton>
// Play mix (Offline) (omit)
// Bypass SoundTouch processing (copy input to output)
     <IconButton
       onClick={() => this.setState({bypass: !this.state.bypass})}>
       <NotInterestedIcon
       color={this.state.bypass ? 'disabled' : 'primary'} />
    </IconButton>
// Speed Pitch Controls (./jslib/SpeedPitchControls.js)
    {this.state.bypass ?  '' : 
    <SpeedPitchControls 
      playSpeed={this.state.playSpeed}
      playPitch={this.state.playPitch}
      setSpeed={this.setSpeed}
      setPitch={this.setPitch}
      messages={m}
    />
    }
// master gain slider
0 <input type='range' id='master' name='gainSlider' 
          min='0' max='150' value={this.state.masterGain} 
           onChange={this.handleGainSlider} /> 150
// track gain sliders (./jslibs/)
    <TrackGainSliderList
        inputAudio={this.inputAudio} 
        gains={this.state.gains}
        handler={this.handleGainSlider}
     />
// Version, credit, URL etc. (omit)
);
```

### playAB (important) ###

```
async playAB(delay, timeA, timeB, recording = false, 
       offline = false, exporter='none'){
// delay: interval between loop
// play between timeA and timeB in the sources
// recording on/off 
// (works also for AudioContext if OfflineAudioContext is not available
// exporter: 'exportToFile' or 'playMix'

    const nInputFrames = (timeB - timeA)*sampleRate;
    const nOutputFrames = Math.max(nInputFrames, 
       nInputFrames/this.state.playSpeed); // expected number of output 

    let context = null;
    if (offline){
      context = new OfflineAudioContext ( // omit);
      await this.loadModule (context, 'worklet/bundle.js');
      // addModule() required every time
    } else context = this.audioCtx; // AudioContext created in loadFiles()

    let updateInterval = 1.0;
    if (offline) updateInterval = 10.0;
    // playing time update interval callback from MyPitchShifter(Node)
 
    const options = {
      processorOptions: { // Options passwd to AudioWorkletProcessor

      }
    }

    /* choose MyPitchShifter (ScriptProcessor interface)
     currently use ScriptProcessor for OfflineAudioContext
     because FireFox crashes with Offline AudioWorklet
    */ 
    if (!this.state.useAudioWorklet || offline) { 
        // Offline worklet not working perfectly yet
      shifter = new MyPitchShifter( context, nInputFrames, 
        4096, recording, this.state.bypass); // ScriptProcessorNode
      shifter.updateInterval = updateInterval;
    } else { 
      try {
        shifter = new MyPitchShifterWorkletNode( context, 
          'my-soundtouch-processor', options); // ScriptProcessorNode
        shifter.updateInterval = updateInterval;
        console.log('AudioWorkletNode functional');
      } catch (err) { 
        // fallback to MyPitchShifter (ScriptProcessor)
    }

    // Allow stop by UI only for AudioContext (real-time)
    if (!offline) this.shifter = shifter;

    // set initial temp and pitch (set from UI)
    shifter.tempo = this.state.playSpeed;
    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);

   // addZeros add silence of 105% of original length at the end
   for (let i=0; i < this.inputAudio.length; i++){
      const source = context.createBufferSource();
      if (i === 0) 
        source.buffer = this.addZeros(context,this.inputAudio[i].data);
      else source.buffer = this.inputAudio[i].data;
    // connect sources --> gainNode --> shifter.node
   }

  if (!offline) { 
   // shifter.node --> masterGainNode --> context.destination
  } else shifter.node.connect(context.destination);

  // start all sources (Note: stop(end) is not set. It is intentional) 
  for (let i=0; i < this.inputAudio.length; i++)
    this.inputAudio[i].source.start(context.currentTime + delay, timeA);
// real-time processing begins here

  if (offline) context.startRendering();
// offline processing begins here

/* Set callbacks */

/* this.inputAudio[0].source.onended = function(e) { */ // Nothing to do 

// Time slider update called from MyPitchShifter(Node)
   shifter.onUpdate = function(val) { 
      this.setState({playingAt: timeA + val});
   }.bind(this);

  if (offline) {
     // Called when OfflineAudioContext ends.
      context.oncomplete = function(e) { 
        console.log( 
         'Offline render complete (data is useless though) length = ',
          e.renderedBuffer.length);
      // e.renderBuffer is the recording if the content is OK but NG so far.
      }
  }

  // Called from MyPitchShifter(Node) when it detects the end of output
  // Or stopped with UI (real-time only)
  shifter.onEnd = function(recordedBuffer) { 
    // recording is returned as recordedBuffer (AudioBuffer)

    // disconnect all gainNode (connected to shifter)

    // export function is in MyPitchShifter(Node)
    if (exporter === 'exportFile' ) 
      shifter.exportToFile('mix_' + Date.now() + '.wav') 

    if (exporter === 'playMix') // omit playback recordedBuffer
 }.bind(this);

```

### support methods ###

```
 async loadFiles(event){ // Multiple file of single file one by one
  const files = event.target.files; // list of files

  // create AudioContext() and load worklet module (first time only)
  if (this.audioCtx === null) { 
    try {
      this.audioCtx = new AudioContext();
      await this.loadModule(this.audioCtx,'worklet/bundle.js');
    } catch(e) ....

  for (let i=0; i < files.length; i++){
     const reader = new FileReader();
     reader.onload = function (e){
       this.audioCtx.decodeAudioData(reader.result,
        function (audioBuffer) {
          // fill (push) this.inputAudio[] and gains[]
          // setState(...)
        }
    ....
    reader.readAsArrayBuffer(files[i]);
  } // end for

/* **************************************** */
 async loadModule ( // load worklet file 
    context,filename,moduleName,workletOptions) {
    await context.audioWorklet.addModule(filename);
 }

/* **************************************** */
 addZeros(context,input){ // return zero padded double length AudioBuffer
  // original  --> original + original*1.05 (silence)
 }
```

### UI action handlers (a few examples) ###

```
 handleTimeSlider(event){
    if (!this.state.isPlaying)
      this.setState({playingAt: parseFloat(event.target.value)});
 }

 handlePlay(event){ // make it shorter?
   if (event.target.name === 'startPause') 
     switch(this.state.playButtonNextAction){
     // Pause, Resume, Play
       case 'Play':
        this.playAB (0, this.state.timeA, this.state.timeB);
        this.setState ({playButtonNextAction: 'Pause'})
        break;
   }
   if (event.target.name === 'stop'){
     if (this.shifter) this.shifter.stop();
     if (this.mixedSource) this.mixedSource.stop();
   }
   if (event.target.name === 'exportFile' 
       || event.target.name === 'playMix'){
     this.playAB (0, this.state.timeA, this.state.timeB, 
          recording, offline, event.target.name);
   ...
   } 
 }

```
