# simple-mixer (experimental since 2021-02-26)

This program mixes stem track files.
Typically separated with a audio source separation software such as Spleeter.
Written with React and Web Audio API.

## input audio files (wav, mp3, or whatever the browser supports)

Select multiple flles (5stem example)

bass.wav

drums.wav

other.wav

piano.wav

vocals.wav

stored in a folder (directory).

## Demo
https://goto920.github.io/demos/simple-mixer/

## Plan
### Export mix to local file (as wav) ==> DONE
### Adding pitch/speed control ==> DONE
Realtime playback -- slow down only (--100%)
Export with slow/fast  (50 -- 200%

## soundtouchJS
MyPitchShifter.js (alternative to PitchShifter.js)
MyFilter.js (extends Simple-Filter.js)
works as intermediate ScriptProcessorNode either with AudioContext and OfflineAudioContext

## images
![test image](images/simple-mixer.png) 
![test image2](images/simple-mixer-config.png)

