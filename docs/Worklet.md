# Files for AudioWorklet (public/worklet/src/)

- public/ is the document root for Node.js (React) App
- Note that a program using worklet should be served by an HTTPS server.
- Only local host can load worklets with "npm start"

## MySoundTouchWorklet.js

AudioWorkletProcessor (process() and handles messages between AudioWorkletNode)

```
import MyFilter from './MyFilter-modified';
import { SoundTouch } from './soundtouch-modified';
class MySoundTouchProcessor extends AudioWorkletProcessor {
```
Two impored files are in the same directory.

## MyFilter-modified.js

Almost the same: src/MyFilter.js

Only the import line below is modified.

```
// import { SimpleFilter } from 'soundtouchjs';
import { SimpleFilter } from './soundtouch-modified';
```

## soundtouch-modified.js

Original soundtouch.js is 
 node_modules/soundtouchjs/dist/soundtouch.js


The file is copied and the last "export" line modified. 

```
// export { AbstractFifoSamplePipe, 
module.exports = { AbstractFifoSamplePipe, 
```

## bundle.js

Three JS files are converted to one to be context.audioWorklet.addModule() 
in the main program.

### required node modules
```
  npm install -g browserify
  npm install esmify --save-dev
  npm install browser-resolve --save-dev
```

Output file name is arbitorary. In App.js addModule(worklet/bundle.js).

```
  in public/worklet/src/
  browserify MySoundTouchWorklet.js -p esmify > ../bundle.js
```
