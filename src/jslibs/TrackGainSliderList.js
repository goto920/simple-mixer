import { Component } from 'react';
import TrackGainSlider from './TrackGainSlider';

export default class TrackGainSliderList extends Component {
  constructor(props){
    super();
    this.inputAudio = props.inputAudio;
    this.handler = props.handler;
    this.state = {
     gains: props.gains,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.inputAudio !== this.props.inputAudio){
      this.setState({inputAudio: this.props.inputAudio});
    }

    if (prevProps.gains !== this.props.gains) {
      this.setState({gains: this.props.gains});
    }
  }

  render(){
    if (this.inputAudio.length > 9) return null;
    // max 8 tracks + record

    // ugly but to avoid dynamic rendering
    return (<div><center>
     {this.inputAudio[0] ? <TrackGainSlider id={0} 
        trackName={this.inputAudio[0].name} 
        gain={this.state.gains[0]} handler={this.handler} /> : null}
     {this.inputAudio[1] ? <TrackGainSlider id={1} 
        trackName={this.inputAudio[1].name} 
        gain={this.state.gains[1]} handler={this.handler} /> : null}
     {this.inputAudio[2] ? <TrackGainSlider id={2} 
        trackName={this.inputAudio[2].name} 
        gain={this.state.gains[2]} handler={this.handler} /> : null}
     {this.inputAudio[3] ? <TrackGainSlider id={3} 
        trackName={this.inputAudio[3].name} 
        gain={this.state.gains[3]} handler={this.handler} /> : null}
     {this.inputAudio[4] ? <TrackGainSlider id={4} 
        trackName={this.inputAudio[4].name} 
        gain={this.state.gains[4]} handler={this.handler} /> : null}
     {this.inputAudio[5] ? <TrackGainSlider id={5} 
        trackName={this.inputAudio[5].name} 
        gain={this.state.gains[5]} handler={this.handler} /> : null}
     {this.inputAudio[6] ? <TrackGainSlider id={6} 
        trackName={this.inputAudio[6].name} 
        gain={this.state.gains[6]} handler={this.handler} /> : null}
     {this.inputAudio[7] ? <TrackGainSlider id={7} 
        trackName={this.inputAudio[7].name} 
        gain={this.state.gains[7]} handler={this.handler} /> : null}
     {this.inputAudio[8] ? <TrackGainSlider id={8} 
        trackName={this.inputAudio[8].name} 
        gain={this.state.gains[8]} handler={this.handler} /> : null}
     </center></div>);

  } // end render

}; // End class TrackGainSliders
