# List of important files

```
src
├── App.css (slightly customized)
├── App.js  (* main program component)
├── index.css (React default)
├── index.js (Javascript entry point)
├── jslibs
│   ├── checkAudioWorklet.js (check browser capability about AudioWorklet)
│   ├── MyFilter.js (* soundtouchJS Filter for the ScriptProcessor)
│   ├── MyPitchShifter.js (*soundtouchJS ScriptProcessor)
│   ├── MyPitchShifterWorkletNode.js (*soundtouchJS AudioWorkletNode)
│   ├── PlayButton.js (UI component)
│   ├── SpeedPitchControls.js (UI component)
│   ├── TrackGainSlider.js (UI component)
│   └── TrackGainSliderList.js (List of TrackGainSlider)
├── messages.json (English/Japanese messages for Tooltips and other strings)
├── reportWebVitals.js
├── service-worker.js
└── serviceWorkerRegistration.js
public
├── favicon.ico
├── index.html (Entry point)
├── manifest.json
├── robots.txt
└── worklet
    ├── bundle.js (bundle of 3 other JS files for addModule())
    └── src
        ├── MyFilter-modified.js (copy of src/MyFilter.js. import line modified)
        ├── MySoundTouchWorklet.js (*AudioWorkletProcessor)
        └── soundtouch-modified.js 
(copy of node_modules/soundtouchjs/dist/soundtouch.js. 
Last export line modified.)

```
