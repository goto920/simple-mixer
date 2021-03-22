import { Component } from 'react';
import '../App.css';

export default class TrackGainSlider extends Component {
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

}; // End class TrackGainSlider
