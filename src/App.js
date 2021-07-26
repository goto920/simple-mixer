/*

   Copyright of my code is not claimed.

   Based on soundtouchjs/src/PitchShifter.js, SimpleFilter.js

   AudioWorkletNode and AudioWorkletProcessor is used if available.

   AudioWorkletProcessor code is in public/worklet/ 
      (public is the document root.)

   Status:
     ScriptProcessorNode (Chrome, Firefox, Safari)
       -- AudioContext, OfflineAudioContext (e.renderedBuffer is NOT usable)

     AudioWorkletNode/AudioWorkletProcessor (Chrome, Firefox)
       -- AudioContext, OfflineAudioContext (e.renderedBuffer is usable)

     Safari does not implement AudioWorklet at all.
     This app is quite memory intensive and may not work on smartphones.

   See details in docs/ and demo page.

 */

import { Component }  from 'react';
import './App.css';
import checkAudioWorklet from './jslibs/checkAudioWorklet';
import MyPitchShifter from './jslibs/MyPitchShifter'; // soundtouchJS

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


// For Safari
const AudioContext = window.AudioContext || window.webkitAudioContext;
const OfflineAudioContext 
    = window.OfflineAudioContext || window.webkitOfflineAudioContext;

const result = checkAudioWorklet();

const {isAudioContext, isOfflineAudioContext, isAudioWorkletNode,
       isAudioWorklet, isAddModule, isOfflineAddModule,
       isOfflineAudioWorklet } = result;

const isAudioWorkletAvailable = isAudioContext & isAudioWorkletNode 
      & isAudioWorklet & isAddModule;
const isOfflineAudioWorkletAvailable = isOfflineAudioContext 
      & isAudioWorkletNode & isOfflineAudioWorklet & isOfflineAddModule;

console.log('AudioWorklet available? :', 
'online: ', isAudioWorkletAvailable ? 'true' : 'false',
', offline: ', isOfflineAudioWorkletAvailable ? 'true' : 'false');

// Conditional dynamic import only if AudioWorklet is available

class App extends Component {

  constructor (props) {
    super();
    this.audioCtx = null;
    this.inputAudio = []; // filled in loadFiles
    this.mixedSource = null;
    this.masterGainNode = null;
    this.recLatency = 0.1;
 
    this.state = {
      numTracks: 0,
      language: defaultLang,
      isPlaying: false,
      timeA: 0,
      playingAt: 0,
      timeB: 0, 
      loop: false,
      loopDelay: 2,
      playButtonNextAction: 'load files first!',
      masterGain: 75,
      playSpeed: 1.0,
      playPitch: 0.0,
      bypass: true,
      useAudioWorklet: isAudioWorkletAvailable,
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

// Recording
    this.mediaRecorder = null;
    this.setMediaRecorder = this.setMediaRecorder.bind(this);
    this.recordedChunks = [];
  }   

  componentWillUnmount () { // before closing app
    if (this.audioCtx !== null) this.audioCtx.close();
  }

  render(){

    return (
     <div className="App">
     {m.title}
     <br />

{/* language selection */}
     <center>
     (language) &ensp;
     <span className='tiny-button'>
     <Tooltip title={m.switchLang}>
      <button onClick = {this.switchLanguage}>
      {this.state.language === 'ja' ? 'EN' : 'JP' }</button>
     </Tooltip>
     </span>&ensp;
{/* AudioWorklet on/off */}
(AudioWorklet)
     <Tooltip title={m.worklet}>
     <IconButton name='toggleWorklet'
     onClick = {
       () => {
        if (isAudioWorkletNode)
        this.setState({useAudioWorklet: !this.state.useAudioWorklet});}
     } >
     <MoodIcon color={this.state.useAudioWorklet? 'primary':'disabled'} />
     </IconButton>
     </Tooltip>
     </center>
     <hr />

{/* loading file(s) Fix for iPadOs :audio/* does not work */}
     <span className='selectFile'>
     <Tooltip title={m.fileReader}>
     <form id='fileLoader' style={{display: 'inline'}}>
     <input type='file' name="loadFiles" multiple
        accept="audio/*,.wav,.mp3,.aac,.m4a,.opus" 
        onChange={this.loadFiles} />
     </form>
     </Tooltip>
     &emsp;
{/* clear input files */}
<span className='tiny-button'>
     <Tooltip title={m.clearFiles}>
     <button name='clearFile' onClick = {() => {
        if (this.state.isPlaying) return;
        this.setState({playButtonNextAction: 'load files first!'});
        document.getElementById('fileLoader').reset();
        this.inputAudio.forEach ((element) => {delete element.data;});
        this.inputAudio = []; }} 
     >{m.clearButton}</button></Tooltip></span>
     <br />
     </span><br/>
{/* time sliders */}
     <div className='text-divider'>{m.timeTitle}&nbsp;
      ({m.timeSliderPosition}:&nbsp; 
       <font color='green'>
       {('00000' + this.state.playingAt.toFixed(1)).slice(-5)}</font>)
     </div>

{/* time A, B, song length */}
     <center>
     A: {('00000' + this.state.timeA.toFixed(1)).slice(-5)} 
         -- B: {('00000' + this.state.timeB.toFixed(1)).slice(-5)}
     &emsp; song length: {this.inputAudio[0] ? 
    ('00000' + this.inputAudio[0].data.duration.toFixed(1)).slice(-5) : 0.00}
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

{/* set TimeA, B, reset */}

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
         onClick={()=> this.setState({timeA: 0, 
          timeB: this.inputAudio[0].data.duration})}>reset
     </button>
     </Tooltip>
     </span>
     </center>
     <br />

{/* Player controls */}
     <div className='text-divider'>{m.playerTitle}</div>
     <center>
{/* Microphone on/off (toggle state.micOn) */}
    <Tooltip title={m.record}>
    <IconButton 
     onClick={this.setMediaRecorder} >
    <MicIcon color={this.state.micOn ? 'secondary' : 'primary'} />
    </IconButton>
    </Tooltip>

   {/* Play button with switching icons in separate file */}
    <PlayButton 
      nextAction={this.state.playButtonNextAction}
      handler={this.handlePlay}
      messages={m}
   />
   {/* Stop button */}
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
    {/* File export */}
     <Tooltip title={m.exportButton} aria-label='exportFile'>
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'exportFile'}})} >
       <GetAppIcon 
       color={!this.inputAudio.length 
         || this.state.isPlaying ? 'disabled' : 'primary'} />
     </IconButton>
     </Tooltip>

    {/* play Mix after rendering audio (online for ScriptProcessor) */}
     <Tooltip title={m.playMixButton} aria-label='playMix'>
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'playMix'}})} >
       <PlayCircleFilledWhiteIcon
       color={!this.inputAudio.length || this.state.isPlaying ? 'disabled' : 'primary'} />
     </IconButton>
     </Tooltip>
    {/* bypass processing */}
     <Tooltip title={m.bypassButton}>
     <IconButton
       onClick={() => 
        { if (this.state.isPlaying) return;
          this.setState({bypass: !this.state.bypass})}
      }>
       <NotInterestedIcon
       color={this.state.bypass ? 'disabled' : 'primary'} />
    </IconButton>
     </Tooltip>

     </center>
{/* Speed controls in separate file */}
    {this.state.bypass ?  '' : 
    <SpeedPitchControls 
      playSpeed={this.state.playSpeed}
      playPitch={this.state.playPitch}
      setSpeed={this.setSpeed}
      setPitch={this.setPitch}
      messages={m}
    />
    }

{/* Master Gain control */}
     <div className='slider' key='master'>
       <div className='text-divider'>{m.masterGainTitle}&nbsp;
       ({('000' + this.state.masterGain).slice(-3)})</div>
       <center>
       0 <input type='range' id='master' name='gainSlider' 
          min='0' max='150' 
          value={this.state.masterGain}
           onChange={this.handleGainSlider} /> 150
       </center>
     </div>

{/* Track gain controls in separate file */}
     <br />
     <div className='text-divider'>{m.trackGainTitle}</div>
     <TrackGainSliderList
        inputAudio={this.inputAudio} 
        length = {this.state.numTracks}
        handler={this.handleGainSlider}
     />
     <hr />

{/* version and help URL */}
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

  async loadFiles(event){

    if (event.target.name !== 'loadFiles') return;
    if (event.target.files.length === 0) return;
    const files = event.target.files; 

    console.log('loadFiles', files);

    if (this.audioCtx === null) {
      console.log('AudioContext');
      this.audioCtx = new AudioContext();
      try {
        if (isAudioWorkletAvailable) {
          await this.loadModule(this.audioCtx,'worklet/bundle.js');
          console.log('AudioContext worklet module loaded');
        }
      } catch (error) {
        console.log(error);
      }
    }

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

           this.inputAudio.sort((a,b) => {
             if(a.name < b.name) return -1;
             if (a.name > b.name) return 1;
             return 0;
           });
 
           this.setState({numTracks: this.inputAudio.length});  

           if (i === 0)
           this.setState({
             playButtonNextAction: 'Play',
               timeA: 0,
               playingAt: 0,
               timeB: this.inputAudio[0].data.duration, 
           });

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
/*
        // Mic recording
         if (this.state.micOn && this.mediaRecorder !== null) 
           this.mediaRecorder.start();
*/

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
      if (this.state.micOn && this.mediaRecorder !== null)
        this.mediaRecorder.stop();

      this.setState ({loop: false, playButtonNextAction: 'Play', 
          playingAt: this.state.timeA, isPlaying: false})

      return;
    }    

    if (event.target.name === 'exportFile' 
       || event.target.name === 'playMix'){

      if (this.inputAudio.length === 0 || this.state.isPlaying) return;

      const recording = true;
      let offline = isOfflineAudioContext;
      this.playAB (0, this.state.timeA, this.state.timeB, 
          recording, offline, event.target.name);

      return;
    }

  } // end handlePlay()

  handleGainSlider(event){
    if (event.target.name !== 'gainSlider') return;
      // console.log ('slider id= ', event.target.id);
// 
    if (event.target.id === 'master'){
      this.setState({masterGain: parseFloat(event.target.value)});
      if (this.masterGainNode)
        this.masterGainNode.gain.value = parseFloat(event.target.value/100.0);
      return;
    }

    const index = parseInt(event.target.id);

    const inputAudio = this.inputAudio[index];
    inputAudio.gain = parseInt(event.target.value);
    if (inputAudio.gainNode !== null)
      inputAudio.gainNode.gain.value 
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

  async playAB(delay, timeA, timeB, 
       recording = false, offline = false, exporter='none'){

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
        nOutputFrames*1.1, // add 10%
        sampleRate 
      );
      if (this.state.useAudioWorklet) {
        await this.loadModule (context, 'worklet/bundle.js');
        console.log('OfflineAudioContext Worklet module loaded');
      }
      if (OfflineAudioContext.suspend) context.suspend();
    } else context = this.audioCtx;

    this.setState({isPlaying : true});

    let updateInterval = 1.0;
    if (offline) updateInterval = 10.0;

    const options = { // For worklet 
      processorOptions: {
        bypass: this.state.bypass,
        recording: false, // recording is done in OfflineAudioContext
        nInputFrames: nInputFrames, 
        updateInterval: updateInterval, 
        sampleRate: sampleRate
      },
    };

    let shifter = null;
    if (!this.state.useAudioWorklet) { 
        // Offline worklet not working perfectly yet
      shifter = new MyPitchShifter( context, nInputFrames, 
        4096, recording, this.state.bypass); // ScriptProcessorNode
      shifter.updateInterval = updateInterval;
    } else { // Use worklet
      try {
        // Dynamic import to avoid "Safari misses AudioWorkletnode"
        const module
          = await import('./jslibs/MyPitchShifterWorkletNode');
        delete this.shifter; this.shifter = null;
        shifter = new module.default(context, 
          'my-soundtouch-processor', options); 
           console.log('AudioWorkletNode functional');
        shifter.updateInterval = updateInterval;
      } catch (err) { 
        console.log(err);
        delete this.shifter; this.shifter = null;
        shifter = new MyPitchShifter( context, nInputFrames, 
          4096, recording, this.state.bypass); // ScriptProcessorNode
        shifter.updateInterval = updateInterval;
        console.log('Worklet failed. Fallback to ScriptProcessorNode');
        // Creation of shifter does not work for Online (reason unknown)

      }
    } // end if useAudioWorklet 

    if (!offline) this.shifter = shifter;

    shifter.tempo = this.state.playSpeed;
    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);

    for (let i=0; i < this.inputAudio.length; i++){
      const inputAudio = this.inputAudio[i];
      const source = context.createBufferSource();
      if (i === 0)
         source.buffer = this.addZeros(context,inputAudio.data);
       else 
         source.buffer = inputAudio.data;
        inputAudio.source = source;
      const gainNode = context.createGain();
        gainNode.gain.value = inputAudio.gain/100.0;
        inputAudio.gainNode = gainNode;
      source.connect(gainNode);
      gainNode.connect(shifter.node);
    }


  if (!offline) {
    const masterGainNode = context.createGain();
    masterGainNode.gain.value = this.state.masterGain/100.0;
    this.masterGainNode = masterGainNode;
    shifter.node.connect(masterGainNode);
    masterGainNode.connect(context.destination);
  } else shifter.node.connect(context.destination);


    const begin = context.currentTime + delay;
    this.inputAudio.forEach ( (element) => {
      if (element.name === 'recordTrack')
        element.source.start(begin, timeA + this.recLatency);
      else 
        element.source.start(begin, timeA);
      }
    );
    // Mic recording
    if (this.state.micOn && this.mediaRecorder !== null) 
       this.mediaRecorder.start();

    if (offline) {
      console.log('startRendering');
      context.startRendering();
    }

    shifter.onUpdate = function(val) { 
      this.setState({playingAt: timeA + val});
    }.bind(this);

    if (offline) {
      context.oncomplete = function(e) {
        console.log( 
         'Offline render complete (data is useless though) length = ',
          e.renderedBuffer.length);

        if (this.state.useAudioWorklet){
          if (exporter === 'exportFile') {
            console.log('exportFile in oncomlete'); 
            shifter.exportToFile('mix_' + Date.now() + '.wav', 
              e.renderedBuffer);
          } else if (exporter === 'playMix') {
            console.log('playMix in oncomlete'); 
            this.playSource(e.renderedBuffer);
          } else console.log('exporter unknown: ', exporter);
        }

      }.bind(this);
    }

    shifter.onEnd = function(recordedBuffer) { 
       // recordedBuffer made in shifter from worklet's message data
      console.log('shifter onEnd');

      for (let i=0; i < this.inputAudio.length; i++)
      this.inputAudio.forEach (
        (element) => { 
          if (element.source) {
            element.source.stop();
            element.gainNode.disconnect();
            element.source.buffer = null;
            element.source = null;
          }
        }
      );
      if (this.mediaRecorder !== null) this.mediaRecorder.stop();

      this.setState({isPlaying: false, playingAt: this.state.timeA});

      if (this.state.loop) {
        console.log('loop from', this.state.timeA);
        this.playAB (this.state.loopDelay, this.state.timeA, this.state.timeB);
      } else this.setState({playButtonNextAction: 'Play'});

      if (!this.state.useAudioWorklet) {
        if (exporter === 'exportFile' ) {
          shifter.exportToFile('mix_' + Date.now() + '.wav');
          this.setState({isPlaying: false}); // audioBuffer is in the shifter
        } else if (exporter === 'playMix')
          this.playSource(recordedBuffer);
      } 

   }.bind(this);

  } // END playAB

  async loadModule (
    context,filename,moduleName,workletOptions) {
      if (!context) return false;
      let name = context.constructor.name;

      try {
        await context.audioWorklet.addModule(filename);
        //console.log(name, 'AudioWorklet loaded');
      } catch(e) {
        console.log(e, name, 'AudioWorklet load failed');
        return null
      }

    return true;
  }

  addZeros(context,input){ // return zero padded double length AudioBuffer
    console.log('addZeros');
    const output = context.createBuffer(
      input.numberOfChannels, 
      input.length*2*1.05, // extra 5%
      input.sampleRate
    ); // additional 5 sec

    for (let ch = 0; ch < output.numberOfChannels; ch++){
      const inSamples = input.getChannelData(ch);
      const outSamples = output.getChannelData(ch);
      outSamples.set(inSamples);
    }

    return output;
  } // End addZeros()


  playSource(audioBuffer){ 
     if (audioBuffer === null) {console.log('audioBuffer null'); return;}

     const context = this.audioCtx;
     this.setState({isPlaying: true, playButtonNextAction: 'Pause'});
     const source = context.createBufferSource();
     this.mixedSource = source;
     source.buffer = audioBuffer;
     const masterGainNode = context.createGain();
       this.masterGainNode = masterGainNode;
       masterGainNode.gain.value = this.state.masterGain/100;
     source.connect(this.masterGainNode);
       masterGainNode.connect(context.destination);
     source.start();

     source.onended = function(e) {
       this.mixedSource.buffer = null;
       this.mixedSource = null;
       this.setState({isPlaying: false});
     }.bind(this);
  }

// Mic Recorder
  setMediaRecorder(e){

   if (this.state.micOn) {
      this.mediaRecorder = null;
      this.setState({micOn: false});
      return;
   }

   // see https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
    const constraints = { 
      audio: {
        autoGainControl: false, // default true
        // channelCount: 2, // device dependent
        echoCancellation: false, // default true
        latency: this.recLatency, // 20 m sec
        noiseSuppression: false, // default true
        sampleRate: 44100,
        sampleSize: 16, // 16 bits?
        // volume: // deprecated
      },
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

       console.log('getUserMedia supported.');

       navigator.mediaDevices.getUserMedia(constraints)
       .then (stream => { 

         this.mediaRecorder = new MediaRecorder(stream);

         this.mediaRecorder.ondataavailable = e => { 
           this.recordedChunks.push(e.data);
         } 

         this.mediaRecorder.onstop = e => {
           stream.getTracks().forEach(t => t.stop());
           const blob = new Blob(this.recordedChunks);
           this.recordedChunks = [];
           this.setState({micOn: false});
          
           const fileReader = new FileReader();

           fileReader.onload = () => {

             this.audioCtx.decodeAudioData(fileReader.result, 
              audioBuffer => {
                this.inputAudio.push({
                  name: "recordedTrack",
                  data: audioBuffer,
                  source: null,
                  gainNode: null,
                  gain: 100,
                });
              // console.log("decode success: recorded chunks"); 
              this.setState({numTracks: this.inputAudio.length});

              }, 
              error => { console.log("decode error: " + error.err) }
             ); // decodeAudioData

           } // onload

           fileReader.readAsArrayBuffer(blob);
         }// onstop 

       }); // getUserMedia
       this.setState({micOn: true});
     } // if

  } // setMediaRecorder

}; // end class

export default App;
