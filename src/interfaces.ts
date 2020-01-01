export interface CanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?:number): MediaStream;
}

export interface BlobOption {
  type: string
}

export interface RecordedData {
  type: string
  blob: Blob
}