export default class DummySource {

  constructor(context, bufferSize){ 
    console.log('new DummySource instance');
    this.context = context;
    this.bufferSize = bufferSize;
    this._node = context.createScriptProcessor(bufferSize,2,2);

    // silence
    this.left = (new Float32Array(bufferSize)).fill(0);
    this.right = (new Float32Array(bufferSize)).fill(0);

    this._node.onaudioprocess = this.onaudioprocess.bind(this);

  }

  get node(){ return this._node; }

  stop(){
    this._node.disconnect(); 
  }

  onaudioprocess(e){
    // console.log('onaudioprocess()');

    const left = e.outputBuffer.getChannelData(0);
    const right = e.outputBuffer.getChannelData(1);
    left.set(this.left);
    right.set(this.right);

  }

};
