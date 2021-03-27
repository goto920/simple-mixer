import { Component } from 'react';

// material-ui Icons
import { IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';

export default class SpeedPitchControls extends Component {
  constructor(props){
    super();
  }

  shouldComponentUpdate(nextProps, nextState){
    if (nextProps.playSpeed !== this.props.playSpeed
     || nextProps.playPitch !== this.props.playPitch
     || nextProps.messages !== this.props.messages) return true;

    return false;
  }

  render(){ // no state change

    const {playSpeed, playPitch, messages, setSpeed, setPitch} = this.props;

    const digits = Math.abs(playPitch);
    let sign = ' ';
    if (playPitch > 0) sign = '+'; 
    else if (playPitch < 0) sign = '-';
    else sign = '*';
    const pitchStr = sign + ('0000' + digits.toFixed(1)).slice(-4);

    return(<span>
    <span>
     <div className='text-divider'>{messages.speedTitle1}&nbsp; 
       (<font color= 'green'>
       {('000' + (100*playSpeed).toFixed(0)).slice(-3)}%)</font>
       &nbsp; {messages.speedTitle2}
    </div>

      <center>
     &plusmn; 10% <IconButton 
         onClick={() => setSpeed({target: {name: 'sub10'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
         onClick={() => setSpeed({target: {name: 'add10'}})} > 
     <AddIcon color='primary'/> </IconButton>
     &nbsp;&nbsp;&nbsp;
     &plusmn; 1% <IconButton
        onClick={() => setSpeed({target: {name: 'sub1'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
        onClick={() => setSpeed({target: {name: 'add1'}})} > 
     <AddIcon color='primary'/> </IconButton>
</center>

     <div className='text-divider'>{messages.pitchTitle}&nbsp; 
 (<font color='green'>{pitchStr}</font>) (-12 -- +12)</div>
<center>
     b/# <IconButton
        onClick={() => setPitch({target: {name: 'sub1'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
        onClick={() => setPitch({target: {name: 'add1'}})} > 
     <AddIcon color='primary'/> </IconButton>
     &nbsp;&nbsp;&nbsp;
     &plusmn; 10 cents <IconButton
        onClick={() => setPitch({target: {name: 'sub10c'}})} > 
     <RemoveIcon color='primary'/> </IconButton>
     <IconButton
        onClick={() => setPitch({target: {name: 'add10c'}})} > 
     <AddIcon color='primary'/> </IconButton>
      </center></span>

      </span>); 

  } // end render

};
