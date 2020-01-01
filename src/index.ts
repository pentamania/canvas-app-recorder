import { BlobOption, CanvasElement, RecordedData } from "./interfaces";

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
  private _dummySrc: AudioBufferSourceNode|null

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

  constructor (
    canvas: CanvasElement, 
    audioContext?: AudioContext, 
    ...gainNodes: GainNode[]
  ) {
    this.mimeType = DEFAULT_MIME_TYPE;
    const streams = [canvas.captureStream()];

    /**
     * Add audio if exists
     */
    if (audioContext) {
      const destination = audioContext.createMediaStreamDestination();
      gainNodes.forEach( node => {
        node.connect(destination);
      })

      /**
       * Add silence to stable sound
       */
      const oscillator = audioContext.createOscillator();
      oscillator.connect(destination);

      /** 
       * HACK: Chrome needs at least one source started to trigger MediaRecorder's dataavailable event, so we will play dummy silent source at the first recording.
       * Firefox doesn't need this.
       */
      {
        const dummySrc = this._dummySrc = audioContext.createBufferSource();
        dummySrc.buffer = audioContext.createBuffer(1, 1, 22050);
        dummySrc.connect(destination);
      }

      streams.push(destination.stream);
    }

    /**
     * Mix tracks and create recorder
     */
    {
      const mediaStream = new MediaStream();
      streams.forEach( stream => {
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
  }

  private _downloadResult (blob): void {
    const src = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = src;
    a.download = this.downloadFileName + "." + this._mimeType;
    a.click();
    window.URL.revokeObjectURL(src);
  }

  private _onstop (): Blob {
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
  onstop (data: RecordedData) {}

  clear(): void {
    this._chunks = [];
  }

  start (): void {
    this.clear();
    this._mediaRecorder.start(this.timeSlice);
    if (this._dummySrc) {
      this._dummySrc.start(0);
      this._dummySrc = null;
    }
  }

  stop (): Blob {
    this._mediaRecorder.stop();
    return this._onstop();
  }

  pause (): void {
    this._mediaRecorder.pause();
  }

  resume (): void {
    this._mediaRecorder.resume();
  }

  toggle (): void {
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