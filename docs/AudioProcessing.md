# Audio Processing (concept) #

---

## Flow A. With AudioContext ##

- For real-time playback at 50% to 100% 
- For > 100%, output becomes faster than input. 
  - It causes underrun and playback sound becomes choppy.
- Lower or upper limit can be changed but unnecessary in most use cases.
- Currently all of the input audio files are in stereo.
  - In any format as far as it is supported by the browser.

```
     audio files (.wav, .mp3 etc.)

     vocals    bass    drums    others
      (FileReader(), decodeAudioData() -> AudioBuffer
        |        |       |        |
        V        V       V        V
      AudioContext.createBufferSource()
       addModule(worklet_file)
        |        |       |        |
   (add silence) |       |        |
        V        V       V        V
     source 0    1       2        3 
        |        |       |        |
        V        V       V        V
    gainNode0    1       2        3
        |        |       |        |
        V        V       V        V
    ----------------------------------- (automatically mixed -- fan in)
                   |
                   V
      MyPitchShifter (ScriptProcessor)           
      or MyPitchShifterWorkletNode (AudioWorklet)
      (Process input --> output, also record output if necessary)
      (Note: output length = 2*input length for 50% playback speed)
                   |
                   V
             masterGainNode
                   |
                   V
             AudioContext.destination
```

- ScriptProcessor and AudioWorklet use soundtouchJS module in them.
  - PitchShifter.js and SimpleFilter.js are modified (replaced).
- Processing (should) end at earlier occurence of A or B 
  - A) End is detected in MyPitchShifter(WorkletNode)
    - by comparison of 
    - total #inputFrames to play (length of original source)
    - and sum(# outputFrames*playbackSpeed in one output) 
  - B) Input to MyPitchShifter(Workletnode) ends 
    - by souce0.stop() from UI 
    - or souce0 ends. 
      - This is why adding silence is necessary at the end of source 0.
- AudioContext can be reused. Then addModule() is called only once when AudioContext is created.
- AudioBufferSource(s) cannot be reused. Then they are created everytime before playing.

## Flow B. Batch processing with OfflineAudioContext

- Used for recording and exporting Wav file for download.
- Missing AudioWorkletNode is missing on Safari (macOS or iOS)

```
        (Same as in A. omitted)
        |        |       |        |
        V        V       V        V
    OfflineAudioContext.createBufferSource()
     (length > 200% of the original source)
       addModule(worklet_file)
        |        |       |        |
   (add silence) |       |        |
        V        V       V        V
     source 0    1       2        3 
        |        |       |        |
        V        V       V        V
    gainNode0    1       2        3
        |        |       |        |
        V        V       V        V
    ----------------------------------- (automatically mixed -- fan in)
                   |
                   V
      MyPitchShifter (ScriptProcessor)           
      or MyPitchShifterWorkletNode (AudioWorklet)
      (Process input --> output, also record output)
      (Note: output length = 2*input length for 50% playback speed)
                   |
                   V
       OfflineAudioContext.destination
```

- Processing (should) end at the earliest occurence of A, B, or C.
  - A) (prefered) End is detected in MyPitchShifter(WorkletNode)
  - B) Input to MyPitchShifter(Workletnode) ends 
    - End of source (source 0 at 205% of #inputFrame
    - source.stop() from UI (not handled correctly yet.)
  - C) End of OfflineAudioContext (set at 210% of #inputFrame)

- From the spec, OfflineAudioContext should return processed AudioBuffer at "oncomplete", but it does not seem to work correctly.
- Then, MyPitchShifter records processed output in Float32Array
  - Return as AudioBuffer for playback
  - Export as a file for download
- Also AudioWorklet includes recording and return it as 2-dim Float32Array.
  - A big data (about 50MB for 5 minites) is returned as a "message" from the worklet to AudioWorkletNode.
  - Firefox crashs when the big data is transmitted from the worklet.
    - The reason is unknown. My guess is out-of-memory.
- What to do for avoiding crash
  - Recording in AudioWorkletNode (possible?)
  - Return data in multiple small messages (reliable? arrives in order like on TCP?)

## Inside MyPitchShifter (has ScriptProcessor) ##

## Inside MyPitchShifterNode (communicates with AudioWorklet) ##

