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

import React, { Component }  from 'react';
import './App.css';
import MyPitchShifter from './MyPitchShifter'; // soundtouchJS
import MySoundTouchWorkletNode from './MySoundTouchWorkletNode';

import packageJSON from '../package.json';
import messages from './messages.json'; // English/Japanese messages

// material-ui Icons, Tooltip
import { IconButton, Tooltip } from '@material-ui/core';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import PauseCircleOutlineOutlinedIcon
        from '@material-ui/icons/PauseCircleOutlineOutlined';
import StopOutlinedIcon from '@material-ui/icons/StopOutlined';
import LoopOutlinedIcon from '@material-ui/icons/LoopOutlined';
import GetAppIcon from '@material-ui/icons/GetApp';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import PlayCircleFilledWhiteIcon 
   from '@material-ui/icons/PlayCircleFilledWhite';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import MoodIcon from '@material-ui/icons/Mood';

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

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext 
 || window.webkitOfflineAudioContext;

let tmp = false;
let context = new OfflineAudioContext(1, 1, 44100);
if (context.audioWorklet && 
    typeof context.audioWorklet.addModule === 'function'){
    tmp = true;
}
const isAudioWorklet = tmp;

if (isAudioWorklet) console.log('Audio Worklet is available');
  else console.log('Audio Worklet is NOT available');

class App extends Component {

  constructor (props) {
    super();
    this.audioCtx = new AudioContext(); // Online AudioContext
    this.inputAudio = [];
    this.mixedSource = null;
    this.masterGainNode = null;
    this.sliders = [];
 
    this.state = {
      language: defaultLang,
      isPlaying: false,
      timeA: 0,
      playingAt: 0,
      timeB: 0, 
      loop: false,
      loopDelay: 2,
      startButtonStr: 'load files first!',
      gains: [],
      masterGain: 75,
      playSpeed: 1.0,
      playPitch: 0.0,
      bypass: false,
      useAudioWorklet: isAudioWorklet,
    };

    this.shifter = null;

    this.loadFiles = this.loadFiles.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleGainSlider = this.handleGainSlider.bind(this);
    this.handleTimeSlider = this.handleTimeSlider.bind(this);
    this.playAB = this.playAB.bind(this);
    this.playABWorklet = this.playABWorklet.bind(this);
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
       this.setState({gains: [], startButtonStr: 'load files first!'});
       this.inputAudio = []; this.sliders = [];} } >{m.clearButton}</button></Tooltip></span>
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
    {(() => {
       let icon;
       switch(this.state.startButtonStr){
         case 'load files first!':
           icon = 
             <Tooltip title={m.alert}>
             <span><IconButton
             onClick={() => this.handlePlay({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon color='disabled'/>
             </IconButton></span></Tooltip>;
         break;
         case 'Play': 
           icon = <Tooltip title={m.playButton}><IconButton  
             onClick={() => this.handlePlay({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon color='primary' />
             </IconButton></Tooltip>;
         break;
         case 'Resume':
           icon = <IconButton  
             onClick={() => this.handlePlay({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon style={{color: '#00aa00' }} />
             </IconButton>;
         break;
         case 'Pause': 
           icon = <IconButton  
             onClick={() => this.handlePlay({target: {name: 'startPause'}})} >
             <PauseCircleOutlineOutlinedIcon color='primary' />
             </IconButton>;
         break;
         default:
           icon = 'undefined';
       }
       return (<span>{icon}</span>);
      })()
    }
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
     <span>
     <div className='text-divider'>{m.speedTitle1} 
       (<font color= 'green'>{(100*this.state.playSpeed).toFixed(0)}%)</font>
       &nbsp; {m.speedTitle2}
    </div>
    <center>
     &plusmn; 10% <IconButton 
         onClick={() => this.setSpeed({target: {name: 'sub10'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
         onClick={() => this.setSpeed({target: {name: 'add10'}})} > 
     <AddIcon color='primary'/> </IconButton>
     &nbsp;&nbsp;&nbsp;
     &plusmn; 1% <IconButton
        onClick={() => this.setSpeed({target: {name: 'sub1'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
        onClick={() => this.setSpeed({target: {name: 'add1'}})} > 
     <AddIcon color='primary'/> </IconButton>
</center>

     <div className='text-divider'>{m.pitchTitle}&nbsp; 
 (<font color='green'>{this.state.playPitch.toFixed(1)}</font>) (-12 -- +12)</div>
<center>
     b/# <IconButton
        onClick={() => this.setPitch({target: {name: 'sub1'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
        onClick={() => this.setPitch({target: {name: 'add1'}})} > 
     <AddIcon color='primary'/> </IconButton>
     &nbsp;&nbsp;&nbsp;
     &plusmn; 10 cents <IconButton
        onClick={() => this.setPitch({target: {name: 'sub10c'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
        onClick={() => this.setPitch({target: {name: 'add10c'}})} > 
     <AddIcon color='primary'/> </IconButton>
      </center></span>
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
       {this.inputAudio.length > 0 ? 
       <div className='slider' key={0}>
       <center>
       {this.inputAudio[0].name} ({this.state.gains[0]})<br />
        0 <input type='range' id={0} name='gainSlider' 
        min='0' max='100' value={this.state.gains[0]}
        onChange={this.handleGainSlider} /> 100
      </center></div> : <div></div>}

       {this.inputAudio.length > 1 ? 
       <div className='slider' key={1}>
       <center>
       {this.inputAudio[1].name} ({this.state.gains[1]})<br />
        0 <input type='range' id={1} name='gainSlider' 
        min='0' max='100' value={this.state.gains[1]}
        onChange={this.handleGainSlider} /> 100
      </center></div> : <div></div>}

       {this.inputAudio.length > 2 ? 
       <div className='slider' key={2}>
       <center>
       {this.inputAudio[2].name} ({this.state.gains[2]})<br />
        0 <input type='range' id={2} name='gainSlider' 
        min='0' max='100' value={this.state.gains[2]}
        onChange={this.handleGainSlider} /> 100
      </center></div> : <div></div>}

       {this.inputAudio.length > 3 ? 
       <div className='slider' key={3}>
       <center>
       {this.inputAudio[3].name} ({this.state.gains[3]})<br />
        0 <input type='range' id={3} name='gainSlider' 
        min='0' max='100' value={this.state.gains[3]}
        onChange={this.handleGainSlider} /> 100
      </center></div> : <div></div>}

       {this.inputAudio.length > 4 ? 
       <div className='slider' key={4}>
       <center>
       {this.inputAudio[4].name} ({this.state.gains[4]})<br />
        0 <input type='range' id={4} name='gainSlider' 
        min='0' max='100' value={this.state.gains[4]}
        onChange={this.handleGainSlider} /> 100
      </center></div> : <div></div>}

       {this.inputAudio.length > 5 ? 
       <div className='slider' key={5}>
       <center>
       {this.inputAudio[5].name} ({this.state.gains[5]})<br />
        0 <input type='range' id={5} name='gainSlider' 
        min='0' max='100' value={this.state.gains[5]}
        onChange={this.handleGainSlider} /> 100
      </center></div> : <div></div>}

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

    if (this.audioCtx === null) this.audioCtx = new window.AudioContext();

    this.loadModule(this.audioCtx);

    for (let i=0; i < files.length; i++){
      const reader = new FileReader();

      reader.onload = function (e){
       this.audioCtx.decodeAudioData(reader.result,
         function (audioBuffer) {
           this.inputAudio.push({
              name: files[i].name,
              data: audioBuffer,
              source: null,
              gainNode: null,
              gain: 100,
           });
      
     /*   
           console.log ('inputAudio, gains length', 
              this.inputAudio.length, this.state.gains.length);
     */
          
           // const gains = [...this.state.gains, 100];
           const gains = this.state.gains; gains.push(100);

           this.setState({
             startButtonStr: 'Play',
               timeA: 0,
               playingAt: 0,
               timeB: this.inputAudio[0].data.duration, 
               gains: gains,
           });

           // this.inputAudio.sort((a,b) => a.name - b.name);

         }.bind(this),

         function (error) { console.log ("decode error: " + error.err) }
       )

      }.bind(this)

      reader.onerror = function (e){ console.log("File read ", reader.error);}
      reader.readAsArrayBuffer(files[i]);

    } // end for

  } // end loadFiles()

  playAB(delay, timeA, timeB, recording = false, 
       offline = false, exporter='none'){

    console.log('playAB', 
      'delay, timeA, timeB, recording, offline, exporter =', 
      delay, timeA, timeB, recording, offline, exporter);

    if (this.state.isPlaying) return;
    if (this.audioCtx.state === 'suspended' ) this.audioCtx.resume();

    this.setState({isPlaying : true});
    this.shifter = null;

    const sampleRate = this.inputAudio[0].data.sampleRate;
    const channels = this.inputAudio[0].data.numberOfChannels;
    const nInputFrames = (timeB - timeA)*sampleRate;
    const nOutputFrames = Math.max(nInputFrames, 
                      nInputFrames/this.state.playSpeed);
  
    let context;
    if (offline) {
      context = new window.OfflineAudioContext (
        channels, // typically 2
        nOutputFrames + 1.0*sampleRate, // length in frames (add 1 sec)
        sampleRate
       ); // Offline
      if (window.OfflineAudioContext.suspend) context.suspend();

    } else context = this.audioCtx;

    const shifter = new MyPitchShifter(
       context, nInputFrames, 4096, recording, this.state.bypass);

    if (!offline) this.shifter = shifter; // to allow change while playing

    shifter.tempo = this.state.playSpeed;

    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);

    if (!offline) {
      const masterGainNode = context.createGain();
      masterGainNode.gain.value = this.state.masterGain/100.0;
      this.masterGainNode = masterGainNode;
    }

    for (let i=0; i < this.inputAudio.length; i++){
      const source = context.createBufferSource();
      source.buffer = this.inputAudio[i].data;
        this.inputAudio[i].source = source;
      const gainNode = context.createGain();
        gainNode.gain.value = this.state.gains[i]/100.0;
        this.inputAudio[i].gainNode = gainNode;
      source.connect(gainNode);
      gainNode.connect(shifter.node);
    }

    if (offline)   
      shifter.node.connect(context.destination);
    else {
      const masterGainNode = context.createGain();
      this.masterGainNode = masterGainNode;
      masterGainNode.gain.value = this.state.masterGain/100.0;
      shifter.node.connect(masterGainNode);
      masterGainNode.connect(context.destination);
    }

    const startedAt = context.currentTime + delay;
    for (let i=0; i < this.inputAudio.length; i++){
      this.inputAudio[i].source.start(startedAt, timeA, timeB - timeA);
    }

    if (offline) context.startRendering();

    this.setState({playingAt: timeA});

    if (offline)
      shifter.onUpdateInterval = 10.0;
    else shifter.onUpdateInterval = 1.0;

    shifter.onUpdate = function() {
      this.setState({playingAt: timeA + shifter.playingAt});
    }.bind(this);

    shifter.onEnd = function () { // callback from MyPitchShifter
      console.log('MyPitchShifter.onEnd');

      for (let i=0; i < this.inputAudio.length; i++)
            this.inputAudio[i].gainNode.disconnect();

      if (exporter === 'exportFile' ) {
         // console.log ('Call exportToFile');
         shifter.exportToFile('mix_' + Date.now() + '.wav');
      } else if (exporter === 'playMix'){
         console.log ('playing mix');
         const context = this.audioCtx;
         const source = context.createBufferSource();
           this.mixedSource = source;
           source.buffer = shifter.recordedBuffer;
         const masterGainNode = context.createGain();
           this.masterGainNode = masterGainNode;
           masterGainNode.gain.value = 1.0;
         source.connect(this.masterGainNode);
         masterGainNode.connect(context.destination);
         source.start();

         source.onended = function(e) {
           this.mixedSource = null;
           this.setState({isPlaying: false});
         }.bind(this)

      }
 
      this.shifter = null;

      this.setState({
        playingAt: this.state.timeA, // maybe modified during playback
        isPlaying: false
      });

      if (!offline && this.state.loop) 
           this.playAB(2, this.state.timeA, this.state.timeB);
        else this.setState({ startButtonStr: 'Pause' });

    }.bind(this);

    // if (!offline) /* When stop button is pressed */
      this.inputAudio[0].source.onended = function (e) { 
        if (this.state.playingAt < timeB) {
          shifter.stop(); 
          this.setState({isPlaying: false, startButtonStr: 'Play'});
        }
      }.bind(this)

    if (offline)
      context.oncomplete = function(e) {
        console.log( 
         'Offline render complete (data is useless though) length = ',
          e.renderedBuffer.length);
      }

  } // END playAB

  handleTimeSlider(event){

    if(event.target.name !== 'timeSlider') return;

    if (!this.state.isPlaying)
      this.setState({playingAt: parseFloat(event.target.value)});
  }

  handlePlay(event){

    console.log('handlePlay name/button', 
       event.target.name, this.state.startButtonStr);

    if (this.inputAudio.length === 0) alert(m.alert);

    if (event.target.name === 'startPause') {

      switch(this.state.startButtonStr){

        case 'Pause':
          console.log('Pause');
          if(this.audioCtx) this.audioCtx.suspend();
          this.setState ({
            startButtonStr: 'Resume',
            isPlaying: false 
          });
        break;

        case 'Resume': 
          console.log('Resume');
          if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
          this.setState ({
            startButtonStr: 'Pause', 
            isPlaying: true
          });
        break;

        case 'Play':
          console.log('Play');
          if (this.inputAudio.length === 0) break;
          if (this.state.useAudioWorklet)
            this.playABWorklet (0, this.state.timeA, this.state.timeB);
          else this.playAB (0, this.state.timeA, this.state.timeB);

          this.setState ({startButtonStr: 'Pause'})
        break;

        default:
          console.log('default', this.state.startButtonStr);
      }

      return;
    }

    if (event.target.name === 'stop') {
      if (this.inputAudio.length === 0 && this.mixedSource === null) return;

      for (let i=0; i < this.inputAudio.length; i++)
        if (this.inputAudio[i].source) this.inputAudio[i].source.stop();

      if (this.mixedSource) this.mixedSource.stop();

      this.setState ({loop: false, startButtonStr: 'Play', playingAt: 
         this.state.timeA})
      return;
    }    

    if (event.target.name === 'exportFile' 
       || event.target.name === 'playMix'){
      if (this.inputAudio.length === 0 || this.state.isPlaying) return;
      const recording = true;
      let offline = true; 
      if (iOS) { offline = false; }
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

    if (this.shifter) {
      this.shifter.tempo = speed;
      // console.log("Tempo set: ", this.shifter.tempo);
    }

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

    if (this.shifter){
      this.shifter.pitch = Math.pow(2.0,pitch/12.0);
      // console.log("Rate set: ", this.shifter.rate); 
    }

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

/* Experimental */

  playABWorklet(delay, timeA, timeB, recording = false, 
       offline = false, exporter='none'){

    console.log('playABWorklet', 
       'delay, timeA, timeB, recording, offline, exporter = ', 
       delay, timeA, timeB, recording, offline, exporter);

    if (this.state.isPlaying) return;
    if (this.audioCtx.state === 'suspended' ) this.audioCtx.resume();

    const sampleRate = this.inputAudio[0].data.sampleRate;
    const channels = this.inputAudio[0].data.numberOfChannels;
    const nInputFrames = (timeB - timeA)*sampleRate;
    const nOutputFrames = Math.max(nInputFrames, 
                      nInputFrames/this.state.playSpeed);
  
    let context = this.audioCtx;
    this.setState({isPlaying : true});

    const options = {
      processorOptions: {
        bypass: this.state.bypass,
        recording: recording,
        nInputFrames: nInputFrames, 
        processedAudioBuffer: [],
        updateInterval: 1.0, 
        sampleRate: sampleRate
      },
    };

    const shifter = new MySoundTouchWorkletNode(
      context,
      'my-soundtouch-processor',  // registered name in the worklet file
      options // options to the AudioWorkletProcessor
    );

    this.shifter = shifter;

    shifter.tempo = this.state.playSpeed;
    shifter.pitch = Math.pow(2.0,this.state.playPitch/12.0);

    for (let i=0; i < this.inputAudio.length; i++){
      const source = context.createBufferSource();
      source.buffer = this.addZeros(context,this.inputAudio[i].data);
        this.inputAudio[i].source = source;
      const gainNode = context.createGain();
        gainNode.gain.value = this.state.gains[i]/100.0;
        this.inputAudio[i].gainNode = gainNode;
        source.connect(gainNode);
        gainNode.connect(shifter);
    }

    if (!offline) {
      const masterGainNode = context.createGain();
      masterGainNode.gain.value = this.state.masterGain/100.0;
      this.masterGainNode = masterGainNode;
      shifter.connect(masterGainNode);
      masterGainNode.connect(context.destination);
    }

    const startedAt = context.currentTime + delay;
    // const startedAt = context.currentTime + 2;
    for (let i=0; i < this.inputAudio.length; i++){
      // this.inputAudio[i].source.start(startedAt, timeA, timeB - timeA);
      this.inputAudio[i].source.start(startedAt, timeA);
    }

    this.inputAudio[0].source.onended = function(e) {
      console.log('source 0', e);
      shifter.stop();
    }

   shifter.onUpdate = function(val) { 
     this.setState({playingAt: timeA + val});
   }.bind(this);

   shifter.onEnd = function() {
     console.log('shifter onEnd');
     for (let i=0; i < this.inputAudio.length; i++)
       this.inputAudio[i].gainNode.disconnect();

          if (exporter === 'exportFile' ) {
         // console.log ('Call exportToFile');
         shifter.exportToFile('mix_' + Date.now() + '.wav');
      } else if (exporter === 'playMix'){
         console.log ('playing mix');
         const context = this.audioCtx;
         const source = context.createBufferSource();
           this.mixedSource = source;
           source.buffer = shifter.recordedBuffer;
         const masterGainNode = context.createGain();
           this.masterGainNode = masterGainNode;
           masterGainNode.gain.value = 1.0;
         source.connect(this.masterGainNode);
         masterGainNode.connect(context.destination);
         source.start();

         source.onended = function(e) {
           this.mixedSource = null;
           this.setState({isPlaying: false});
         }.bind(this)
      }

     this.shifter = null;
     this.setState({isPlaying: false, startButtonStr: 'Play'});

     if (!offline && this.state.loop) 
       this.playABWorklet(2, this.state.timeA, this.state.timeB);
     else 
       this.setState({ startButtonStr: 'Play' });

   }.bind(this);

  } // END playABWorklet

  async loadModule (context){
    if (!context) return false;

    try {
      await context.audioWorklet.addModule('worklet/bundle.js');
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
