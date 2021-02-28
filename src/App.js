import React, { Component }  from 'react';
import './App.css';
import packageJSON from '../package.json';
import { IconButton } from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import PauseCircleOutlineOutlinedIcon
        from '@material-ui/icons/PauseCircleOutlineOutlined';
import StopOutlinedIcon from '@material-ui/icons/StopOutlined';
import LoopOutlinedIcon from '@material-ui/icons/LoopOutlined';

const version = packageJSON.subversion;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

class App extends Component {
  constructor (props) {
    super();
    this.audioCtx = new AudioContext();
    this.inputAudio = [];
 
    this.state = {
      timeA: 0,
      playingAt: 0,
      timeB: 0, 
      loop: false,
      loopDelay: 2,
      startButtonStr: 'load files first!',
      gains: [],
      masterGain: 0.7*100,
    };

    this.loadFiles = this.loadFiles.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleGainSlider = this.handleGainSlider.bind(this);
  }   

  render(){

    const PlayButton = () => {
       let icon;
       switch(this.state.startButtonStr){
         case 'load files first!':
           icon = 
             <IconButton disabled>
             <ClearIcon color='disabled' fontSize='large' />
             </IconButton>;
         break;
         case 'Play': case 'Resume':
           icon = <IconButton  
             onClick={() => this.handlePlay({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon color='primary' fontSize='large' />
             </IconButton>;
         break;
         case 'Pause': 
           icon = <IconButton  
             onClick={() => this.handlePlay({target: {name: 'startPause'}})} >
             <PauseCircleOutlineOutlinedIcon color='primary' fontSize='large' />
             </IconButton>;
         break;
         default:
           icon = 'undefined';
       }
       return (<span>{icon}</span>);
    };

    const sliders = this.state.gains.map((value, index) => {
      return (
      <div className='slider' key={index}>
      <center>
      {this.inputAudio[index].name} ({this.state.gains[index]})<br />
      0 <input type='range' id={index} name='gainSlider' 
      min='0' max='100' value={this.state.gains[index]} 
      onChange={this.handleGainSlider} /> 100
      </center>
      </div>
      );
    });

    return (
     <div className="App">
     KG's Simple Mixer (Select stem files and play)<hr />
     <span className="selectFile">
     <input type="file" name="loadFiles" multiple="multiple"
        accept="audio/*" onChange={this.loadFiles} /><br />
     </span>
     <hr />
     Player Controls:&nbsp;&nbsp; 
     <PlayButton />
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'stop'}})} >
       <StopOutlinedIcon fontSize='large' 
       color={this.isPlaying ? 'primary' : 'disabled'} />
     </IconButton>
     <IconButton  
       onClick={() => {this.setState({loop: !this.state.loop});}} >
       <LoopOutlinedIcon fontSize='large' 
       color={this.state.loop ? 'secondary' : 'primary'} />
     </IconButton>
     <hr />
     <div className='slider' key='master'>
       <center>
       Master Gain ({this.state.masterGain}) <br />
       0 <input type='range' id='master' name='gainSlider' 
          min='0' max='100' value={this.state.masterGain} 
           onChange={this.handleGainSlider} /> 100
       </center>
     </div>
     <hr />
     <center>Channel Gain</center>
     {sliders}
     <hr />
     Version: {version}
     </div>
    );
  }

  loadFiles(event){

    if (event.target.name !== 'loadFiles') return;
    if (event.target.files.length.length === 0) return;
    const files = event.target.files; 

    if (this.audioCtx !== null) this.audioCtx.close();
    this.audioCtx = new AudioContext();
    this.isPlaying = false;

    this.inputAudio = []; // clear
    const gains = [];
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
            });

           gains.push(100);
           if (i => files.length -1){
             this.setState({
               startButtonStr: 'Play',
               timeA: 0,
               playingAt: 0,
               //timeB: this.inputAudio[0].data.duration,
               timeB: 10,
               gains: gains,
               masterGain: 0.7*100,
             });
           } // end if

         }.bind(this),
         function (error) { console.log ("decode error: " + error.err) }
       )
      }.bind(this)

      reader.onerror = function (e){ console.log("File read ", reader.error);}

      reader.readAsArrayBuffer(files[i]);

    } // end for

  } // end loadFiles()

  playAB(delay, timeA, timeB){
    console.log('playAB, isPlaying', delay, timeA, timeB, this.isPlaying);

    if (this.isPlaying) return;

    if (this.audioCtx.state === 'suspended' ) this.audioCtx.resume();

    for (let i=0; i < this.inputAudio.length; i++){

      const source = this.audioCtx.createBufferSource();
      const masterGainNode = this.audioCtx.createGain();
        masterGainNode.gain.value = this.state.masterGain/100.0;

      source.buffer = this.inputAudio[i].data;
        this.inputAudio[i].source = source;
      const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = this.state.gains[i]/100.0;
        this.inputAudio[i].gainNode = gainNode;
        this.inputAudio[i].masterGainNode = masterGainNode;
      source.connect(gainNode);
      gainNode.connect(masterGainNode);
      masterGainNode.connect(this.audioCtx.destination);
    }

    const gains = [];
    for (let i=0; i < this.inputAudio.length; i++)
       gains.push(100*this.inputAudio[i].gainNode.gain.value);

    this.setState({gains: gains});

    for (let i=0; i < this.inputAudio.length; i++)
      this.inputAudio[i].source.start(
        this.audioCtx.currentTime +delay, timeA, timeB - timeA);

    this.inputAudio[0].source.onended = function () {
      console.log('source.onended');
      this.isPlaying = false;
      if (this.state.loop) this.playAB(2, timeA, timeB);
    }.bind(this);

    this.isPlaying = true;
  }

  handlePlay(event){

    console.log('Name', event.target.name);

    if (event.target.name === 'startPause') {

      switch(this.state.startButtonStr){
        case 'Pause':
          console.log('Pause');
          this.audioCtx.suspend();
          this.isPlayng = false;
          this.setState ({startButtonStr: 'Resume'});
        break;

        case 'Play': case 'Resume':
          if (this.inputAudio.length === 0) break;
          if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
          this.playAB (0, this.state.timeA, 
            this.state.timeB - this.state.timeA);
          this.setState ({startButtonStr: 'Pause'})
        break;

        default:
      }

      return;
    }

    if (event.target.name === 'stop') {
      if (this.inputAudio.length === 0) return;

      for (let i=0; i < this.inputAudio.length; i++)
        if (this.inputAudio[i].source) this.inputAudio[i].source.stop();

      this.isPlaying = false;
      this.setState ({startButtonStr: 'Play'})
      return;
    }    

  } // end handlePlay()

  handleGainSlider(event){
    if (event.target.name !== 'gainSlider') return;
    // console.log ('slider id= ', event.target.id);

    if (event.target.id === 'master'){
      const gain = parseFloat(event.target.value);
      this.setState({masterGain: gain});
      for (let index=0; index < this.inputAudio.length; index++) {
        if (this.inputAudio[index].masterGainNode !== null)
          this.inputAudio[index].masterGainNode.gain.value 
            = parseFloat(event.target.value/100.0); 
      }
      return;
    }

    const index = parseInt(event.target.id);

    const gains = this.state.gains;
    gains[index] = parseInt(event.target.value);
    this.setState({gains: gains});
    if (this.inputAudio[index].gainNode !== null)
      this.inputAudio[index].gainNode.gain.value 
           = parseFloat(event.target.value/100.0); 

  }

} // end class

export default App;
