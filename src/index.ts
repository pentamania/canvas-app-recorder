// interface/types
interface BlobOption {
  type: string
}
interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?:number): MediaStream;
}

// consts
const DEFAULT_MIME_TYPE = 'mp4';
const DEFAULT_TIME_SLICE = 100;
const DEFAULT_OUTPUT_FILE_NAME = "output";

/**
 * @class CanvasAppRecorder
 */
export default class CanvasAppRecorder {
  private _blobOption: BlobOption
  private _mimeType: string
  private _downloadAfterStop: boolean = false
  private _chunks: Blob[] = []
  private _mediaRecorder: MediaRecorder

  downloadFileName: string = DEFAULT_OUTPUT_FILE_NAME
  timeSlice: number = DEFAULT_TIME_SLICE

  get mimeType () { return this._mimeType; }
  set mimeType (v) {
    if (v === "webm") {
      this._mimeType = "webm";
      this._blobOption = { 'type': 'video/webm;' };
    } else if (v === "mp4") {
      this._mimeType = "mp4";
      this._blobOption = { 'type': 'video/mp4; codecs=H.264' };
    } else {
      console.warn(`mimeType: ${v} is not supported`)
    }
  }

  get state () { return this._mediaRecorder.state; }

  get downloadAfterStop () { return this._downloadAfterStop; }
  set downloadAfterStop (v) {
    this._downloadAfterStop = (v === true);
  }

  constructor (canvas:CanvasElement, audioContext:AudioContext, ...gainNodes:GainNode[]) {
    this.mimeType = DEFAULT_MIME_TYPE;

    // add sound
    const destination = audioContext.createMediaStreamDestination();
    // gainNode.connect(destination);
    gainNodes.forEach( node => {
      node.connect(destination);
    })

    // add silence to stable sound
    const oscillator = audioContext.createOscillator();
    oscillator.connect(destination);

    // get stream
    const audioStream = destination.stream;
    const canvasStream = canvas.captureStream();

    // get tracks in the stream and mix them
    const mediaStream = new MediaStream();
    [canvasStream, audioStream].forEach( stream => {
      stream.getTracks().forEach( track => mediaStream.addTrack(track));
    });

    this._mediaRecorder = new MediaRecorder(mediaStream);
    this._mediaRecorder.ondataavailable = (e) => {
      // console.log('send data', e);
      if (e.data && e.data.size > 0) {
        this._chunks.push(e.data);
      }
    };
  }

  private _downloadResult (blob):void {
    const src = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = src;
    a.download = this.downloadFileName + "." + this._mimeType;
    a.click();
    window.URL.revokeObjectURL(src);
  }

  private _onstop ():Blob {
    const blob = new Blob(this._chunks, this._blobOption);
    this.onstop({
      type: this._mimeType,
      blob: blob,
    });
    if (this._downloadAfterStop) this._downloadResult(blob);
    return blob;
  }

  /**
   * @virtual
   */
  onstop (data) {}

  clear():void {
    this._chunks = [];
  }

  start ():void {
    this.clear();
    this._mediaRecorder.start(this.timeSlice);
  }

  stop ():Blob {
    this._mediaRecorder.stop();
    return this._onstop();
  }

  pause ():void {
    this._mediaRecorder.pause();
  }

  resume ():void {
    this._mediaRecorder.resume();
  }

  toggle ():void {
    if (this._mediaRecorder.state === "recording") {
      this.pause();
    } else if (this._mediaRecorder.state === "paused") {
      this.resume();
    }
  }

  static isSupported() {
    return (window.MediaRecorder !== undefined);
  }
  
}