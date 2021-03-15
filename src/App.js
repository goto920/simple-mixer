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
   Fast real-time playback is impossible by nature.

 */

import { Component }  from 'react';
import './App.css';
import MyPitchShifter from './jslibs/MyPitchShifter'; // soundtouchJS
import MyPitchShifterWorkletNode from './jslibs/MyPitchShifterWorkletNode';
// UI Components
import PlayButton from './jslibs/PlayButton';
import SpeedPitchControls from './jslibs/SpeedPitchControls';
import TrackGainSliderList from './jslibs/TrackGainSliderList';

import packageJSON from '../package.json';
import messages from './messages.json'; // English/Japanese messages

// material-ui Icons, Tooltip
import { IconButton, Tooltip } from '@material-ui/core';
import StopOutlinedIcon from '@material-ui/icons/StopOutlined';
import LoopOutlinedIcon from '@material-ui/icons/LoopOutlined';
import GetAppIcon from '@material-ui/icons/GetApp';
import PlayCircleFilledWhiteIcon 
   from '@material-ui/icons/PlayCircleFilledWhite';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import MoodIcon from '@material-ui/icons/Mood';
import MicIcon from '@material-ui/icons/Mic';
// import { AudioContext, OfflineAudioContext }  from 'standardized-audio-context';

// get subversion string 
const version = packageJSON.subversion;

// switch languages
let defaultLang = 'en';
let m = messages.en;
console.log(window.navigator.language);
if (window.navigator.language.slice(0,2) === 'ja') {
  defaultLang = 'ja'; 
  m = messages.ja;
}

let iOS = false;
if(  navigator.userAgent.match(/iPhone/i) 
  || navigator.userAgent.match(/iPod/i)
  || navigator.userAgent.match(/iPad/i)){
  iOS = true;
}

// AudioWorklet check with OfflineAudioContext (from Google Labs example)
let tmp = false;

if (OfflineAudioContext) tmp = true; else tmp = false;
const isOfflineAudioContext = tmp;

//let context = new OfflineAudioContext(1, 1, 44100);

let context = new AudioContext();
if (context.audioWorklet && 
    typeof context.audioWorklet.addModule === 'function'){
    tmp = true;
} else tmp = false; 
context.close();
const isAudioWorklet = tmp;

if (isAudioWorklet) console.log('Audio Worklet is available');
  else console.log('Audio Worklet is NOT available');

if (isOfflineAudioContext) console.log('OfflineAudioContext is available');
  else console.log('OfflineAudioContext is NOT available');

class App extends Component {

  constructor (props) {
    super();
    this.audioCtx = new AudioContext(); // Online AudioContext
    this.inputAudio = [];
    this.mixedSource = null;
    this.masterGainNode = null;
 
    this.state = {
      language: defaultLang,
      isPlaying: false,
      timeA: 0,
      playingAt: 0,
      timeB: 0, 
      loop: false,
      loopDelay: 2,
      playButtonNextAction: 'load files first!',
      gains: [],
      masterGain: 75,
      playSpeed: 1.0,
      playPitch: 0.0,
      bypass: false,
      useAudioWorklet: isAudioWorklet,
      micOn: false,
    };

    this.shifter = null;

    this.loadFiles = this.loadFiles.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleGainSlider = this.handleGainSlider.bind(this);
    this.handleTimeSlider = this.handleTimeSlider.bind(this);
    this.playAB = this.playAB.bind(this);
    this.setSpeed = this.setSpeed.bind(this);
    this.setPitch = this.setPitch.bind(this);
    this.switchLanguage = this.switchLanguage.bind(this);
  }   

  componentWillUnmount () { // before closing app
    if (this.audioCtx !== null) this.audioCtx.close();
  }


  render(){

    return (
     <div className="App">
     {m.title}
     <br />
     <center>
     (language) &ensp;
     <span className='tiny-button'>
     <Tooltip title={m.switchLang}>
      <button onClick = {this.switchLanguage}>
      {this.state.language === 'ja' ? 'EN' : 'JP' }</button>
     </Tooltip>
     </span>
     &ensp;(AudioWorklet)
     <Tooltip title={m.worklet}>
     <IconButton name='toggleWorklet'
     onClick = {
       () => {
        if (isAudioWorklet)
        this.setState({useAudioWorklet: !this.state.useAudioWorklet});}
     } >
     <MoodIcon color={this.state.useAudioWorklet? 'primary':'disabled'} />
     </IconButton>
     </Tooltip>
     </center>
     <hr />
     <span className="selectFile">
     <Tooltip title={m.fileReader}>
     <input type="file" name="loadFiles" multiple
        accept="audio/*" onChange={this.loadFiles} />
     </Tooltip>
     &emsp;<span className='tiny-button'>
     <Tooltip title={m.clearFiles}>
     <button name='clearFile' onClick = {() => {
       this.setState({gains: [], 
       playButtonNextAction: 'load files first!'});
       this.inputAudio = []; }} 
     >{m.clearButton}</button></Tooltip></span>
     <br />
     </span><br/>
     <div className='text-divider'>{m.timeTitle}&nbsp;
      ({m.timeSliderPosition}:&nbsp; 
       <font color='green'>{this.state.playingAt.toFixed(2)}</font>)
     </div>
     <center>
     A: {this.state.timeA.toFixed(2)} -- B: {this.state.timeB.toFixed(2)}
     &emsp; song length: {this.inputAudio[0] ? 
          this.inputAudio[0].data.duration.toFixed(2) : 0.00}
     <br />
     <div className='slider'>
     <Tooltip title={m.timeSlider}>
     <input type='range' name='timeSlider'
       min='0' max= {this.inputAudio[0] ? 
              this.inputAudio[0].data.duration : 0}
       value={this.state.playingAt}
       onChange={this.handleTimeSlider}
     />
     </Tooltip>
     </div>
     <span className='tiny-button'>
     <Tooltip title={m.setA}>
     <button name='setA' 
        onClick={()=> this.setState({timeA: this.state.playingAt})}>
        set A
     </button>
     </Tooltip>
      &emsp;
     <Tooltip title={m.setB}>
     <button name='setB' 
        onClick={()=> this.setState({timeB: this.state.playingAt})}>
        set B
     </button>
     </Tooltip>
      &emsp;
     <Tooltip title={m.resetAB}>
     <button name='reset' 
        onClick={()=> this.setState({timeA: 0, timeB: this.inputAudio[0].data.duration})}>reset
     </button>
     </Tooltip>
     </span>
     </center>

     <div className='text-divider'>{m.playerTitle}</div>
     <center>
    <Tooltip title={m.record}>
    <IconButton 
     onClick={()=> this.setState({micOn: !this.state.micOn})} >
    <MicIcon color={this.state.micOn ? 'secondary' : 'primary'} />
    </IconButton>
    </Tooltip>
    <PlayButton 
      nextAction={this.state.playButtonNextAction}
      handler={this.handlePlay}
      messages={m}
   />
     <Tooltip title={m.stopButton}>
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'stop'}})} >
       <StopOutlinedIcon 
     color={this.inputAudio.length ? 'primary' : 'disabled'} />
     </IconButton>
     </Tooltip>
     <Tooltip title={m.loopButton}>
     <IconButton  
       onClick={() => {this.setState({loop: !this.state.loop});}} >
       <LoopOutlinedIcon 
       color={this.state.loop ? 'secondary' : 'primary'} />
     </IconButton>
     </Tooltip>

     <Tooltip title={m.exportButton} aria-label='exportFile'>
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'exportFile'}})} >
       <GetAppIcon 
       color={!this.inputAudio.length || this.state.isPlaying ? 'disabled' : 'primary'} />
     </IconButton>
     </Tooltip>

     <Tooltip title={m.playMixButton} aria-label='playMix'>
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'playMix'}})} >
       <PlayCircleFilledWhiteIcon
       color={!this.inputAudio.length || this.state.isPlaying ? 'disabled' : 'primary'} />
     </IconButton>
     </Tooltip>
     <Tooltip title={m.bypassButton}>
     <IconButton
       onClick={() => this.setState({bypass: !this.state.bypass})}>
       <NotInterestedIcon
       color={this.state.bypass ? 'disabled' : 'primary'} />
    </IconButton>
     </Tooltip>

     </center>

    {this.state.bypass ?  '' : 
    <SpeedPitchControls 
      playSpeed={this.state.playSpeed}
      playPitch={this.state.playPitch}
      setSpeed={this.setSpeed}
      setPitch={this.setPitch}
      messages={m}
    />
    }

     <div className='slider' key='master'>
       <div className='text-divider'>{m.masterGainTitle}&nbsp;
       ({this.state.masterGain})</div>
       <center>
       0 <input type='range' id='master' name='gainSlider' 
          min='0' max='150' value={this.state.masterGain} 
           onChange={this.handleGainSlider} /> 150
       </center>
     </div>
     <div className='text-divider'>{m.trackGainTitle}</div>
     <TrackGainSliderList
        inputAudio={this.inputAudio} 
        gains={this.state.gains}
        handler={this.handleGainSlider}
     />
     <hr />
     {m.version}: {version} &nbsp;&nbsp;
     <a href={m.url}
     target='_blank' rel='noreferrer'>{m.guide}</a><br />
     {m.credit}&nbsp; 
     <a href="https://github.com/cutterbl/SoundTouchJS"
     target='_blank' rel='noreferrer'>SoundTouchJs</a><br />
     <hr />
     </div>
    );
  }

  loadFiles(event){

    if (event.target.name !== 'loadFiles') return;
    if (event.target.files.length === 0) return;
    const files = event.target.files; 

    if (this.audioCtx === null) this.audioCtx = new AudioContext();

    for (let i=0; i < files.length; i++){
      const reader = new FileReader();

      reader.onload = function (e){
       this.audioCtx.decodeAudioData(reader.result,
         function (audioBuffer) {
           if (audioBuffer.numberOfChannels !== 2) {
             alert ('Sorry, only stereo files are supported');
             return;
           }
           this.inputAudio.push({
              name: files[i].name,
              data: audioBuffer,
              source: null,
              gainNode: null,
              gain: 100,
           });
      
           const gains = this.state.gains; gains.push(100);

           this.setState({
             playButtonNextAction: 'Play',
               timeA: 0,
               playingAt: 0,
               timeB: this.inputAudio[0].data.duration, 
               gains: gains,
           });

     // this.inputAudio.sort((a,b) => a.name - b.name); // mmm.. does not work

         }.bind(this),

         function (error) { console.log ("decode error: " + error.err) }
       )

      }.bind(this)

      reader.onerror = function (e){ console.log("File read ", reader.error);}
      reader.readAsArrayBuffer(files[i]);

    } // end for

  } // end loadFiles()

  handleTimeSlider(event){

    if(event.target.name !== 'timeSlider') return;

    if (!this.state.isPlaying)
      this.setState({playingAt: parseFloat(event.target.value)});
  }

  handlePlay(event){

    console.log('handlePlay name/button', 
       event.target.name, this.state.playButtonNextAction);

    if (this.inputAudio.length === 0) alert(m.alert);

    if (event.target.name === 'startPause') {

      switch(this.state.playButtonNextAction){

        case 'Pause':
          console.log('Pause');
          if(this.audioCtx) this.audioCtx.suspend();
          this.setState ({
            playButtonNextAction: 'Resume',
            isPlaying: false 
          });
        break;

        case 'Resume': 
          console.log('Resume');
          if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
          this.setState ({
            playButtonNextAction: 'Pause', 
            isPlaying: true
          });
        break;

        case 'Play':
          console.log('Play');
          if (this.inputAudio.length === 0) break;
           this.playAB (0, this.state.timeA, this.state.timeB);

          this.setState ({playButtonNextAction: 'Pause'})
        break;

        default:
          console.log('default', this.state.playButtonNextAction);
      }

      return;
    }

    if (event.target.name === 'stop') {
      if (this.shifter) this.shifter.stop();
      if (this.mixedSource) this.mixedSource.stop();

      this.setState ({loop: false, playButtonNextAction: 'Play', playingAt: 
         this.state.timeA})
      return;
    }    

    if (event.target.name === 'exportFile' 
       || event.target.name === 'playMix'){
      if (this.inputAudio.length === 0 || this.state.isPlaying) return;

      const recording = true;
      let offline = isOfflineAudioContext;
      // if (iOS) { offline = false; }
      this.playAB (0, this.state.timeA, this.state.timeB, 
          recording, offline, event.target.name);

      return;
    }

  } // end handlePlay()

  handleGainSlider(event){
    if (event.target.name !== 'gainSlider') return;
//       console.log ('slider id= ', event.target.id);
// 
    if (event.target.id === 'master'){
      this.setState({masterGain: parseFloat(event.target.value)});
      if (this.masterGainNode)
        this.masterGainNode.gain.value = parseFloat(event.target.value/100.0);
      return;
    }

    const index = parseInt(event.target.id);

    const gains = this.state.gains;
    gains[index] = parseInt(event.target.value);
    this.setState({gains: gains});
    if (this.inputAudio[index].gainNode !== null)
      this.inputAudio[index].gainNode.gain.value 
           = parseFloat(event.target.value/100.0); 

  } // End handleGainSlider()

  setSpeed(e){
    let speed = this.state.playSpeed;
    switch(e.target.name){
      case 'sub10': speed -=0.1; break;
      case 'add10': speed +=0.1; break;
      case 'sub1': speed -=0.01; break;
      case 'add1': speed +=0.01; break;
      default:
    }
    if (speed < 0.5) speed = 0.5;
    else if (speed > 2.0) speed = 2.0;

    if (this.shifter) this.shifter.tempo = speed;

    this.setState({playSpeed: speed});
  } // End set speed

  setPitch(e){
    let pitch = this.state.playPitch;
    switch(e.target.name){
      case 'sub1': pitch -=1; break;
      case 'add1': pitch +=1; break;
      case 'sub10c': pitch -=0.1; break;
      case 'add10c': pitch +=0.1; break;
      default:
    }

    if (pitch < -12) pitch = -12.0;
    else if (pitch > 12) pitch = 12.0

    if (this.shifter) this.shifter.pitch = Math.pow(2.0,pitch/12.0);

    this.setState({playPitch: pitch});

  } // End setPitch

  switchLanguage(e) {

    if (this.state.language === 'ja') {
      m = messages.en; 
      this.setState({language: 'en'});
    } else {
      m = messages.ja; 
      this.setState({language: 'ja'});
    }
  } // End switchLanguage()

  playAB(delay, timeA, timeB, recording = false, 
       offline = false, exporter='none'){

    console.log('playAB', 
       'delay, timeA, timeB, recording, offline, exporter = ', 
       delay, timeA, timeB, recording, offline, exporter);

    if (this.state.isPlaying) return;
    if (this.audioCtx.state === 'suspended' ) this.audioCtx.resume();

    const sampleRate = this.inputAudio[0].data.sampleRate;
    const channels = this.inputAudio[0].data.numberOfChannels;
    const nInputFrames = (timeB - timeA)*sampleRate;
    const nOutputFrames = Math.max(nInputFrames, 
                      nInputFrames/this.state.playSpeed);

    let context = null; 

    if (offline){

      context = new OfflineAudioContext (
        channels,
        nOutputFrames + 5.0*sampleRate, // add extra 5 second
        sampleRate 
      );
      if (OfflineAudioContext.suspend) context.suspend();

    } else context = this.audioCtx;

    this.setState({isPlaying : true});

    let updateInterval = 1.0;
    if (offline) updateInterval = 10.0;

    const options = {
      processorOptions: {
        bypass: this.state.bypass,
        recording: recording,
        nInputFrames: nInputFrames, 
        updateInterval: updateInterval, 
        sampleRate: sampleRate
      },
    };

    let shifter = null;
    if (!this.state.useAudioWorklet) {
      shifter = new MyPitchShifter( context, nInputFrames, 
        4096, recording, this.state.bypass); // ScriptProcessorNode
      shifter.updateInterval = updateInterval;
    } else { // load the same worklet for OfflineAudioContext
      try {
        this.loadModule(context, 'worklet/bundle.js');
        shifter = new MyPitchShifterWorkletNode( context,
        'my-soundtouch-processor',  // registered in the worklet file
         options // options passed to the AudioWorkletProcessor
        );
      } catch (err) { 
      console.log('Worklet failed. Fallback to ScriptProcessorNode');
        shifter = new MyPitchShifter(context, nInputFrames, 
          4096, recording, this.state.bypass);
        shifter.updateInterval = updateInterval;
      }
    } // end if useAudioWorklet 

    this.shifter = shifter;
    console.log ('PlayAB() this.shifter', this.shifter);

    shifter.tempo = this.state.playSpeed;
    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);

    for (let i=0; i < this.inputAudio.length; i++){

      const source = context.createBufferSource();
      if (offline) source.buffer = this.inputAudio[i].data;
       else source.buffer = this.addZeros(context,this.inputAudio[i].data);

        this.inputAudio[i].source = source;
      const gainNode = context.createGain();
        gainNode.gain.value = this.state.gains[i]/100.0;
        this.inputAudio[i].gainNode = gainNode;
      source.connect(gainNode);
      gainNode.connect(shifter.node);
    }

    const masterGainNode = context.createGain();
    masterGainNode.gain.value = this.state.masterGain/100.0;
    this.masterGainNode = masterGainNode;
    shifter.node.connect(masterGainNode);
    masterGainNode.connect(context.destination);

    for (let i=0; i < this.inputAudio.length; i++)
      this.inputAudio[i].source.start(context.currentTime + delay, timeA);

    if (offline) context.startRendering();

    this.inputAudio[0].source.onended = function(e) {
      console.log('source 0 onended');
      if (this.state.playingAt < timeB) {
        shifter.stop(); 
        this.setState({isPlaying: false, playButtonNextAction: 'Play'});
      }
    }.bind(this);

    shifter.onUpdate = function(val) { 
      this.setState({playingAt: timeA + val});
    }.bind(this);

    if (offline) {
      context.oncomplete = function(e) {
        console.log( 
         'Offline render complete (data is useless though) length = ',
          e.renderedBuffer.length);
      }
    }

    shifter.onEnd = function(recordedBuffer) { 
       // recordedBuffer made in shifter from worklet's message data
      console.log('shifter onEnd');

      for (let i=0; i < this.inputAudio.length; i++)
        this.inputAudio[i].gainNode.disconnect();
      this.setState({isPlaying: false});

      if (exporter === 'exportFile' ) {

        console.log('exportFile');
        shifter.exportToFile('mix_' + Date.now() + '.wav');
        this.setState({isPlaying: false}); // audioBuffer is in the shifter

      } else if (exporter === 'playMix'){

        console.log('playMix');
        const context = this.audioCtx;
        this.setState({isPlaying: true, playButtonNextAction: 'Pause'});
        const source = context.createBufferSource();
          this.mixedSource = source;
          source.buffer = recordedBuffer;
         const masterGainNode = context.createGain();
           this.masterGainNode = masterGainNode;
           masterGainNode.gain.value = this.state.masterGain/100;
         source.connect(this.masterGainNode);
         masterGainNode.connect(context.destination);
         source.start();

         source.onended = function(e) {
           this.mixedSource = null;
           this.setState({isPlaying: false});
         }.bind(this);

      }

   }.bind(this);

  } // END playAB

  async loadModule (context,filename){
    if (!context) return false;

    try {
      await context.audioWorklet.addModule(filename);
      // relative path from public (React)
      return true;
    } catch(e) {
      console.log(e + '\n audioWorklet load failed'); 
      return false;
    }

  }

  addZeros(context,input){ // return zero padded double length AudioBuffer
    console.log('addZeros');
    const output = context.createBuffer(
      input.numberOfChannels, 
      input.length*2 + 5*input.sampleRate, 
      input.sampleRate
    ); // additional 5 sec

    for (let ch = 0; ch < output.numberOfChannels; ch++){
      const inSamples = input.getChannelData(ch);
      const outSamples = output.getChannelData(ch);
      outSamples.set(inSamples);
    }

    return output;
  } // End addZeros()

}; // end class

export default App;
