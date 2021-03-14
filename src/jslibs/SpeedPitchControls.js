import { Component } from 'react';

// material-ui Icons
import { IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';

export default class SpeedPitchControls extends Component {
  constructor(props){
    super();

    this.state = {
      playSpeed: props.playSpeed,
      playPitch: props.playPitch,
      m : props.messages,
    };
    this.setSpeed = props.setSpeed;
    this.setPitch = props.setPitch;
  }

componentDidUpdate(prevProps) {
  if (prevProps.speed !== this.props.speed) {
    this.setState({playSpeed: this.props.speed}); 
  }

  if (prevProps.pitch !== this.props.pitch) {
    this.setState({playPitch : this.props.pitch}); 
  }

  if (prevProps.messages !== this.props.messages) {
    this.setState({m: this.props.messages}); 
  }
}

  render(){
    const {m} = this.state;

    return(<span>
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

      </span>); 


  } // end render

};
