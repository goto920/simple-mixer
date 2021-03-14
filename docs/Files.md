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
    ├── MyFilter-modified.js (* copy of MyFilter.js. import line modified)
    ├── MySoundTouchWorklet.js (* AudioWorkletProcessor)
    ├── README.md (* How to bundle)
    ├── bundle.js (bundle of 3 other JS files for addModule())
    └── soundtouch-modified.js (copy of dist/soundtouch.js. export line modified)
```
