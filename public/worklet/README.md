# Files for AudioWorklet

## MySoundTouchWorklet.js

AudioWorklet (process() and message handling)

```
import MyFilter from './MyFilter-modified';
import { SoundTouch } from './soundtouch-modified';
class MySoundTouchProcessor extends AudioWorkletProcessor {
```
Two impored files are in the same directory.

## MyFilter-modified.js

Almost the same: src/MyFilter.js

Only the import line below is modified

```
// import { SimpleFilter } from 'soundtouchjs';
import { SimpleFilter } from './soundtouch-modified';
```

## soundtouch-modified.js

Original soundtouch.js is 
 node_modules/soundtouchjs/dist/soundtouch.js


The file is copied and the last "export" line modified 

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

Output file name is arbitorary and used in addModule().

```
  browserify MySoundTouchWorklet.js -p esmify > bundle.js
```
