import { Component } from 'react';

// material-ui Icons, Tooltip
import { IconButton, Tooltip } from '@material-ui/core';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import PauseCircleOutlineOutlinedIcon
        from '@material-ui/icons/PauseCircleOutlineOutlined';

export default class PlayButton extends Component {
  constructor(props){
    super();
    this.state = {
      nextAction: props.nextAction,
      m : props.messages,
    };
    this.handler = props.handler;
  }

componentDidUpdate(prevProps) {
  if (prevProps.nextAction !== this.props.nextAction) {
    this.setState({nextAction: this.props.nextAction}); 
  }
  if (prevProps.messages !== this.props.messages) {
    this.setState({m: this.props.messages}); 
  }
}

// PlayButton 
  render(){
    const {nextAction,m} = this.state;

    let icon = null;
    switch(nextAction){
         case 'load files first!':
           icon = 
             <Tooltip title={m.alert}>
             <span><IconButton
             onClick={() => this.handler({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon color='disabled'/>
             </IconButton></span></Tooltip>;
         break;
         case 'Play': 
           icon = <Tooltip title={m.playButton}><IconButton  
             onClick={() => this.handler({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon color='primary' />
             </IconButton></Tooltip>;
         break;
         case 'Resume':
           icon = <IconButton  
             onClick={() => this.handler({target: {name: 'startPause'}})} >
             <PlayCircleOutlineIcon style={{color: '#00aa00' }} />
             </IconButton>;
         break;
         case 'Pause': 
           icon = <IconButton  
             onClick={() => this.handler({target: {name: 'startPause'}})} >
             <PauseCircleOutlineOutlinedIcon color='primary' />
             </IconButton>;
         break;
         default:
           icon = 'undefined';
       }
       return(<span>{icon}</span>);

     } // end render

};
