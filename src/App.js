import React, { Component }  from 'react';
import './App.css';
import packageJSON from '../package.json';
import { IconButton, Tooltip } from '@material-ui/core';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import PauseCircleOutlineOutlinedIcon
        from '@material-ui/icons/PauseCircleOutlineOutlined';
import StopOutlinedIcon from '@material-ui/icons/StopOutlined';
import LoopOutlinedIcon from '@material-ui/icons/LoopOutlined';
import GetAppIcon from '@material-ui/icons/GetApp';
import SaverNode from './SaverNode';

const version = packageJSON.subversion;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

class App extends Component {
  constructor (props) {
    super();
    this.audioCtx = new AudioContext();
    this.inputAudio = [];
    this.masterGainNode = null;
    this.sliderTimer = null;
    this.startedAt = 0;
 
    this.state = {
      isPlaying: false,
      timeA: 0,
      playingAt: 0,
      timeB: 0, 
      loop: false,
      loopDelay: 2,
      startButtonStr: 'load files first!',
      gains: [],
      masterGain: 75,
    };

    this.loadFiles = this.loadFiles.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handleGainSlider = this.handleGainSlider.bind(this);
    this.handleTimeSlider = this.handleTimeSlider.bind(this);
    this.playAB = this.playAB.bind(this);
  }   

  componentWillUnmount () { // before closing app
    if (this.audioCtx !== null) this.audioCtx.close();
  }


  render(){

    const PlayButton = () => {
       let icon;
       switch(this.state.startButtonStr){
         case 'load files first!':
           icon = 
             <Tooltip title='Load file first'>
             <span><IconButton>
             <PlayCircleOutlineIcon color='disabled' />
             </IconButton></span></Tooltip>;
         break;
         case 'Play': 
           icon = <Tooltip title='play A to B'><IconButton  
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
     PlayingAt: {this.state.playingAt.toFixed(2)}&nbsp;&nbsp; 
     Duration: {this.inputAudio[0] ? 
                this.inputAudio[0].data.duration.toFixed(2) : 0.00}
     <center>
     <div className='slider'>
     <input type='range' name='timeSlider'
       min='0' max= {this.inputAudio[0] ? 
              this.inputAudio[0].data.duration : 0}
       value={this.state.playingAt}
       onChange={this.handleTimeSlider}
     />
     </div>
     A: {this.state.timeA.toFixed(2)} -- B: {this.state.timeB.toFixed(2)}
     </center>
     <hr />

     <PlayButton />
     <Tooltip title='stop and rewined to A'>
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'stop'}})} >
       <StopOutlinedIcon 
     color={this.inputAudio.length ? 'primary' : 'disabled'} />
     </IconButton>
     </Tooltip>
     <Tooltip title='toggle loop AB'>
     <IconButton  
       onClick={() => {this.setState({loop: !this.state.loop});}} >
       <LoopOutlinedIcon 
       color={this.state.loop ? 'secondary' : 'primary'} />
     </IconButton>
     </Tooltip>
     <span className='tiny-button'>
     <Tooltip title='play and click or stop, move slider, and click'>
     <button name='setA' 
        onClick={()=> this.setState({timeA: this.state.playingAt})}>
        set A
     </button>
     </Tooltip>
      &nbsp;&nbsp;&nbsp;
     <Tooltip title='play and click or stop, move slider, and click'>
     <button name='setB' 
        onClick={()=> this.setState({timeB: this.state.playingAt})}>
        set B
     </button>
     </Tooltip>
      &nbsp;&nbsp;&nbsp;
     <Tooltip title='reset AB'>
     <button name='reset' 
        onClick={()=> this.setState({timeA: 0, timeB: this.inputAudio[0].data.duration})}>reset
     </button>
     </Tooltip>
     </span>
     <Tooltip title='Export after playback' aria-label='export'>
     <IconButton  
       onClick={() => this.handlePlay({target: {name: 'export'}})} >
       <GetAppIcon 
       color={this.state.isPlaying ? 'disabled' : 'primary'} />
     </IconButton>
     </Tooltip>
     <hr />
     <div className='slider' key='master'>
       <center>
       Master Gain ({this.state.masterGain}) <br />
       0 <input type='range' id='master' name='gainSlider' 
          min='0' max='150' value={this.state.masterGain} 
           onChange={this.handleGainSlider} /> 150
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
    this.setState({isPlaying: false});

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
               timeB: this.inputAudio[0].data.duration, // test timeB: 10,
               gains: gains,
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

  playAB(delay, timeA, timeB, exportFile=false){

    console.log('playAB', 
    delay, timeA, timeB, 'export: ', exportFile);

    if (this.state.isPlaying) return;

    if (this.audioCtx.state === 'suspended' ) this.audioCtx.resume();
    this.setState({isPlaying : true});

    const saver 
      = new SaverNode(this.audioCtx,this.inputAudio[0].data.sampleRate);
    const saverNode = this.audioCtx.createScriptProcessor(4096,2,2);

    const masterGainNode = this.audioCtx.createGain();
      masterGainNode.gain.value = this.state.masterGain/100.0;
    this.masterGainNode = masterGainNode;

    for (let i=0; i < this.inputAudio.length; i++){
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.inputAudio[i].data;
        this.inputAudio[i].source = source;
      const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = this.state.gains[i]/100.0;
        this.inputAudio[i].gainNode = gainNode;
      source.connect(gainNode);
      gainNode.connect(saverNode);
    }

    saverNode.connect(masterGainNode);

    masterGainNode.connect(this.audioCtx.destination);

    if (exportFile) saver.setRecord(true);

    this.startedAt = this.audioCtx.currentTime + delay;
    for (let i=0; i < this.inputAudio.length; i++){
      this.inputAudio[i].source.start(this.startedAt, timeA, timeB - timeA);
    }
    this.setState({playingAt: timeA});

    let count = 0;
    saverNode.onaudioprocess = function(e){
      saver.process(e.inputBuffer,e.outputBuffer);
      if (count++ % 10 === 0)
        this.setState({playingAt: timeA + saver.getProcessedTime()});
    }.bind(this);

    this.inputAudio[0].source.onended = function () {
      console.log('source.onended');

      for (let i=0; i < this.inputAudio.length; i++)
        this.inputAudio[i].gainNode.disconnect(saverNode);
      saverNode.disconnect(masterGainNode);
      if (exportFile) saver.exportFile('mix.wav');
      this.setState({
        playingAt: this.state.timeA,
        isPlaying: false
      }); 

      if (this.state.loop) this.playAB(2, timeA, timeB);
    }.bind(this);

  } // END playAB

  handleTimeSlider(event){
    if(event.target.name !== 'timeSlider') return;
    this.setState({playingAt: parseFloat(event.target.value)});
  }

  handlePlay(event){

    console.log('Name', event.target.name, this.state.startButtonStr);

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
          this.startedAt = this.audioCtx.currentTime;
          if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
          this.setState ({
            startButtonStr: 'Pause', 
            isPlaying: true
          });
        break;

        case 'Play':
          console.log('Play');
          if (this.inputAudio.length === 0) break;
          this.playAB (0, this.state.timeA, this.state.timeB);
          this.setState ({startButtonStr: 'Pause'})
        break;

        default:
          console.log('default', this.state.startButtonStr);
      }

      return;
    }

    if (event.target.name === 'stop') {
      if (this.inputAudio.length === 0) return;

      for (let i=0; i < this.inputAudio.length; i++)
        if (this.inputAudio[i].source) this.inputAudio[i].source.stop();

      this.setState ({loop: false, startButtonStr: 'Play', playingAt: 
         this.state.timeA})
      return;
    }    

    if (event.target.name === 'export'){
      if (this.inputAudio.length === 0) return;
        this.playAB (0, this.state.timeA, this.state.timeB, true);
      return;
    }

  } // end handlePlay()

  handleGainSlider(event){
    if (event.target.name !== 'gainSlider') return;
    // console.log ('slider id= ', event.target.id);

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

}; // end class

export default App;
