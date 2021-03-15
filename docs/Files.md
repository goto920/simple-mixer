# List of important files

```
src
├── App.css
├── App.js  (* main program component)
├── index.css
├── index.js
├── jslibs
│   ├── MyFilter.js (* soundtouchJS Filter for the ScriptProcessor)
│   ├── MyPitchShifter.js (*soundtouchJS ScriptProcessor)
│   ├── MyPitchShifterWorkletNode.js (*soundtouchJS AudioWorkletNode)
│   ├── PlayButton.js (UI component)
│   ├── SpeedPitchControls.js (UI component)
│   ├── TrackGainSlider.js (UI component)
│   └── TrackGainSliderList.js (List of TrackGainSlider)
├── messages.json
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
