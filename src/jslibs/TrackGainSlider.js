import { Component} from 'react';
import '../App.css';

export default class TrackGainSlider extends Component {
  constructor(props){
   super();
   this.state = {
     gain: props.gain,
   }
   this.id = props.id;
   this.trackName = props.trackName;
   this.handler = props.handler;
  } 

 componentDidUpdate(prevProps) {
   if (prevProps.gain !== this.props.gain) {
     this.setState({gain: this.props.gain});
   }
 }

  render(){
   if (this.state.gain === undefined || !this.trackName === undefined) return null;

   return (<div className='slider'>
    {this.trackName} ({this.state.gain})<br />
     0 <input type='range' id={this.id} name='gainSlider'
        min='0' max='100' value={this.state.gain}
        onChange={this.handler} /> 100
   </div>);
  } // end render

}; // End class TrackGainSlider
