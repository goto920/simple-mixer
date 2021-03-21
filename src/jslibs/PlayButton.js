import { Component } from 'react';

// material-ui Icons, Tooltip
import { IconButton, Tooltip } from '@material-ui/core';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import PauseCircleOutlineOutlinedIcon
        from '@material-ui/icons/PauseCircleOutlineOutlined';

export default class PlayButton extends Component {
  constructor(props){
    super();
  }

// No setState() in shouldComponentUpdate
  shouldComponentUpdate(nextProps, nextState){
    if (nextProps.nextAction !== this.props.nextAction
     || nextProps.messages !== this.props.messages)
    return true;

    return false;
  }

  render(){ // no state change

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
         case 'Play': 
           icon = <Tooltip title={messages.playButton}><IconButton  
             onClick={() => handler({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon color='primary' />
             </IconButton></Tooltip>;
         break;
         case 'Resume':
           icon = <IconButton  
             onClick={() => handler({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon style={{color: '#00aa00' }} />
             </IconButton>;
         break;
         case 'Pause': 
           icon = <IconButton  
             onClick={() => handler({target: {name: 'startPause'}})} >
             <PauseCircleOutlineOutlinedIcon color='primary' />
             </IconButton>;
         break;
         default:
           icon = 'undefined';
       }
       return(<span>{icon}</span>);

     } // end render

};
