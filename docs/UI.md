# User Interface Components #

I am not a programmer for product quality UI applications. 
Suggestions are always welcome.

- Tried to reduce re-render
- Used meterial-ui ToolTip, IconButton, and many Icons

## App.js ##

### in render, return() ###
```
// Toggle JP and EN (messages are in lange.json)

<Tooltip title={m.switchLang}>
  <button onClick = {this.switchLanguage}>
  {this.state.language === 'ja' ? 'EN' : 'JP' }</button>
// (closing tags are omitted)
--> select will be better for three or more languages

// toggle worklet on/off (default on if available)
    <Tooltip title={m.worklet}>
     <IconButton name='toggleWorklet'
     onClick = {
       () => { if (isAudioWorkletNode)
        this.setState({useAudioWorklet: !this.state.useAudioWorklet});}
      } >
     <MoodIcon color={this.state.useAudioWorklet? 'primary':'disabled'} />

// audio file reader(loader)
    <Tooltip title={m.fileReader}>
     <input type="file" name="loadFiles" multiple
        accept="audio/*" onChange={this.loadFiles} />

// clear loaded audio files (standard button)
     <Tooltip title={m.clearFiles}>
     <button name='clearFile' onClick = {() => {
       this.setState({gains: [], 
       playButtonNextAction: 'load files first!'});
       this.inputAudio = []; }} 
     >{m.clearButton}</button></Tooltip></span>

// show time
     ({m.timeSliderPosition}:&nbsp; 
       <font color='green'>{this.state.playingAt.toFixed(2)}</font>)
     </div>
     <center>
     A: {this.state.timeA.toFixed(2)} -- B: {this.state.timeB.toFixed(2)}
     &emsp; song length: {this.inputAudio[0] ? 
          this.inputAudio[0].data.duration.toFixed(2) : 0.00}

// time slider 
    <Tooltip title={m.timeSlider}>
     <input type='range' name='timeSlider'
       min='0' max= {this.inputAudio[0] ? 
              this.inputAudio[0].data.duration : 0}
       value={this.state.playingAt}
       onChange={this.handleTimeSlider}
     />

// set time A
    <Tooltip title={m.setA}>
     <button name='setA' 
        onClick={()=> this.setState({timeA: this.state.playingAt})}>
        set A
     </button>

// set time B, reset (omitted)

// record on/off (recordint is not implemented yet)
    <Tooltip title={m.record}>
    <IconButton 
     onClick={()=> this.setState({micOn: !this.state.micOn})} >
    <MicIcon color={this.state.micOn ? 'secondary' : 'primary'} />
    </IconButton>
    </Tooltip>

// Play button (in jslibs/PlayButton.js)
    <PlayButton 
      nextAction={this.state.playButtonNextAction}
      handler={this.handlePlay}
      messages={m}
   />
--> Pass the state, handler, messages to PlayButton as props
    The child component use the handler to notify the changes

// Stop button
    <IconButton  
       onClick={() => this.handlePlay({target: {name: 'stop'}})} >
       <StopOutlinedIcon 
     color={this.inputAudio.length ? 'primary' : 'disabled'} />
     </IconButton>
     </Tooltip>
--> <IconButton name='stop' does not work if the icon is clicked.

// loop on/off (omitted) 

// exportFile, playMix, bypass (omitted)

// hide speed/pitch controls if bypass is set
    {this.state.bypass ?  '' : 
    <SpeedPitchControls 
      playSpeed={this.state.playSpeed}
      playPitch={this.state.playPitch}
      setSpeed={this.setSpeed}
      setPitch={this.setPitch}
      messages={m}
    />
    }

// master gain
    <div className='slider' key='master'>
       <div className='text-divider'>{m.masterGainTitle}&nbsp;
       ({this.state.masterGain})</div>
       <center>
       0 <input type='range' id='master' name='gainSlider' 
          min='0' max='150' value={this.state.masterGain} 
           onChange={this.handleGainSlider} /> 150

// track gains (# of tracks  = # of loaded audio files)
// jslibs/TrackGainSliderList.js --> TrackGainSlider.js (one slider)
     <div className='text-divider'>{m.trackGainTitle}</div>
     <TrackGainSliderList
        inputAudio={this.inputAudio} 
        gains={this.state.gains}
        handler={this.handleGainSlider}
     />

// version, URL (omitted)
 
```

## jslibs/PlayButton.js ##

```
// re render() only if nextAction ('Play', 'Pause', 'Stop' etc.)
// or language is changed
// no state defined in constructor()
  shouldComponentUpdate(nextProps, nextState){
    if (nextProps.nextAction !== this.props.nextAction
     || nextProps.messages !== this.props.messages)
    return true;

    return false; // render() is not called for false
  }

    const {nextAction,messages,handler} = this.props;

    let icon = null;
    switch(nextAction){
         case 'load files first!':
           icon = 
             <Tooltip title={messages.alert}>
             <span><IconButton
             onClick={() => handler({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon color='disabled'/>
             </IconButton></span></Tooltip>;
         break;
   // other cases are omitted

       return(<span>{icon}</span>);
```

## jslibs/TrackGainSliderList.js ##

```
// no state defined. This.nSliders is the number of sliders
 constructor(props){
    super();
    this.nSliders = props.inputAudio.length;
  }

// Update only if the number of audio tracks changed
  shouldComponentUpdate(nextProps, nextState){
    if (nextProps.inputAudio.length !== this.nSliders) {
      this.nSliders = nextProps.inputAudio.length;
      return true;
    }
    return false;
  }

 render(){
    const {inputAudio, handler} = this.props;

    // Creates track gain sliders
    // and passes name, initialGain and handler to all sliders
    const sliders = inputAudio.map(
       (e,i) => {
       return(
        <TrackGainSlider key={i} id={i} trackName={e.name} 
          initialGain={e.gain} handler={handler} />
       );
      }
    );
    return (<div><center>{sliders}</center></div>);

  } // end render

```

## jslibs/TrackGainSlider.js ##

```
  constructor(props){
    super();
    this.state = { gain: props.initialGain, }; 
     // get initial gain from props and keep current gain locally
    this.handler = this.handler.bind(this);
  } 

 // update local state and notiry gain change to the handler in App.js
  handler(e){ 
    this.setState({gain: parseFloat(e.target.value)});
    this.props.handler(e); // notify gain change to App.js
  }
--> local state is used to update slider position

 render(){
    const {trackName, id} = this.props;
    const {gain} = this.state;

    return (<div className='slider'>
     {trackName} ({('000' + gain).slice(-3)})<br />
      0 <input type='range' id={id} name='gainSlider'
      min='0' max='100' value={gain}
      onChange={this.handler} /> 100
      </div>);
    } // end render

```
