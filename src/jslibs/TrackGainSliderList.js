import { Component } from 'react';
import TrackGainSlider from './TrackGainSlider';

export default class TrackGainSliderList extends Component {
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

}; // End class TrackGainSliderList
