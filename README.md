Canvas-app-recorder
===

Module to record HTML Canvas and WebAudio based App.  
Make sure this module is experimental, and could be drastically changed.

Browser should support [captureStream/MediaStream](https://caniuse.com/#feat=mediacapture-fromelement) and [MediaRecorder API](https://caniuse.com/#feat=mediarecorder).

## Install and Usage

### in-browser

```html
<script src='path/to/canvas-app-recorder.js'></script>
```

```js
// Instance of your app
const app = new YourCoolApp();

const canvasRecorder = new CanvasAppRecorder(
  app.getCanvasElement(), // the canvas element used in your app
  app.getAudioContext(), // the webAudio context used in your app
  app.getMasterGain() // the webAudio gainNode
  // ,anotherGain // you can add more than one gain node
);

// open dialog after recording to save the result video
canvasRecorder.downloadAfterStop = true;

// callback function after stopping
canvasRecorder.onstop = (data)=> {
  const videoElement = document.createElement('video');
  document.body.appendChild(videoElement);
  videoElement.loop = true;
  videoElement.src = window.URL.createObjectURL(data.blob);
  videoElement.play();
}

// start recording
app.start();
canvasRecorder.start();

// stop recording in some timing
setTimeout(()=> {
  canvasRecorder.stop();
}, 5000);
```

### ES Modules

```bash
npm install canvas-app-recorder
```

```js
import CanvasAppRecorder from "canvas-app-recorder";

/* ... same as example above */

```

## License
MIT