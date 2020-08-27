import React from 'react';
import noUiSlider from 'nouislider';
import ReactPlayer from 'react-player'
import workerClient from "ffmpeg-webworker";

class NewSnippetComponent extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state={
      playing: false,
      disableClass: ''
    };
    this.myVideoRef = React.createRef();
    this.listenWorkerClient();
  }

  listenWorkerClient = () => {
      workerClient.on("onReady", () => {console.log("Ready")});
      workerClient.on("onStdout", msg => this.updateStdOutputText(msg));
      workerClient.on("onFileReceived", msg => this.updateStdOutputText(msg));
      workerClient.on("onDone", result => {
        this.updateStdOutputText("Command Completed");
        const videoBlob = this.arrayBufferToBlob(result[0].data);
        var url = URL.createObjectURL(videoBlob);
	      this.download(url);
      });
  }

  arrayBufferToBlob = buffer => new Blob([new Uint8Array(buffer, 0, buffer.byteLength)], {
    type: "video/webm",
    name: "video.webm"
  });

  updateStdOutputText = (text) => {
    console.log("updateStdOutputText <<<--->>> ", text);
  }

  componentDidMount() {
    setTimeout(() => {
      this.fromOld = 0;
      this.toOld = Math.floor(this.myVideoRef.current.getDuration());
      this.isDownloadClick = false;
      this.setRangeSlider();
      this.checkDomainAndStop();
    }, 1000);
  }

  downloadSnippet = async () => {
    this.isDownloadClick = true;
    this.setState({
      disableClass: 'disableActive'
    });
    this.pauseVideo();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:3000/videofile1.mp4', true);
    xhr.responseType = 'blob';
    var self = this;
    xhr.onload = async function() {
      var blob = await this.response;
      self.trimVideo(blob);
    }
   
    xhr.send();
  }

  trimVideo = (blob) => { 
    workerClient.inputFile = blob;
    var start = this.fromOld ? this.fromOld-1 : this.fromOld;
    var length = this.toOld - this.fromOld;
    workerClient.runCommand(
      `-ss ${start} -c copy -t ${length} sliced-output.mp4`
    );
  }
	
  download = (blob_url) => {
    if(this.isDownloadClick) {
      const link = document.createElement("a");
      link.href = blob_url;
      link.download = "video.mp4";
      link.click();
    }
    this.setState({disableClass: ''});
    this.isDownloadClick = false;
  }

  rewindVideo() {
    this.myVideoRef.current.seekTo(this.fromOld, true);
    this.playVideo();
  }

  playPauseVideo() {
    //is playing
    this.setState((prevState)=>({
      playing: !prevState.playing
    }));
  }

  pauseVideo() {
    this.setState((prevState)=>({
      playing: false
    }));
  }

  playVideo() {
    this.setState((prevState)=>({
      playing: true
    }));
  }

  backwardVideo() {
    var curTime = this.myVideoRef.current.getCurrentTime();
    curTime -= 5;
    if (curTime < this.fromOld) {
      this.myVideoRef.current.seekTo(this.fromOld, true);
    }
    else {
      this.myVideoRef.current.seekTo(curTime, true);
    }
  }

  forwardVideo() {
    var curTime = this.myVideoRef.current.getCurrentTime();

    curTime += 5;
    if (curTime > this.toOld) {
      this.myVideoRef.current.seekTo(this.toOld, true);
    }
    else {
      this.myVideoRef.current.seekTo(curTime, true);
    }
  }

  setRangeSlider = () => {
    this.slider = document.getElementById('range');

    if(Math.floor(this.myVideoRef.current.getDuration())) {
      noUiSlider.create(this.slider, {
        start: [0, Math.floor(this.myVideoRef.current.getDuration())], // Handle start position
        step: 1, // Slider moves in increments of '1'
        margin: 3, // Handles must be more than '3' apart
        connect: true, // Display a colored bar between the handles
        behaviour: 'tap-drag', // Move handle on tap, bar is draggable
        range: { // Slider can select '0' to 'duration'
          'min': 0,
          'max': Math.floor(this.myVideoRef.current.getDuration())
        }
      });

      // When the slider value changes, update the input and span
      this.slider.noUiSlider.on('update', (values, handle) => {
        if (handle) {
          this.readValue = values[handle] | 0;
          document.getElementById('value-span').innerHTML = this.toHHMMSS(values[handle]);
          if (this.toOld !== this.readValue) {
            this.toOld = this.readValue;
          }

        } else {
          this.readValue = values[handle] | 0;
          document.getElementById('value-input').innerHTML = this.toHHMMSS(values[handle]);

          if (this.fromOld !== this.readValue) {
            this.fromOld = this.readValue;
            this.myVideoRef.current.seekTo(this.readValue, true);
            this.pauseVideo();
            this.playVideo();
          }
        }
      });

      // When the input changes, set the slider value
      document.getElementById('value-input').addEventListener('change', function () {
        this.slider.noUiSlider.set([null, this.value]);
      });
    }
  }

  checkDomainAndStop = () => {
    var curTime = this.myVideoRef.current.getCurrentTime();

    if (curTime < 0) {
      this.myVideoRef.current.seekTo(0, true);
    }
    if (curTime > this.toOld && this.toOld !== Math.floor(this.myVideoRef.current.getDuration())) {
      this.myVideoRef.current.seekTo(this.toOld, true);
      this.pauseVideo();
    }

    // recursively call it.
    setTimeout(this.checkDomainAndStop, 100);
  }

  toHHMMSS(val) {
    this.sec_num = parseInt(val, 10);
    this.hours = Math.floor(this.sec_num / 3600);
    this.minutes = Math.floor((this.sec_num - (this.hours * 3600)) / 60);
    this.seconds = this.sec_num - (this.hours * 3600) - (this.minutes * 60);

    if (this.hours < 10) { this.hours = "0" + this.hours; }
    if (this.minutes < 10) { this.minutes = "0" + this.minutes; }
    if (this.seconds < 10) { this.seconds = "0" + this.seconds; }

    // only mm:ss
    if (this.hours === "00") {
      this.time = this.minutes + ':' + this.seconds;
    }
    else {
      this.time = this.hours + ':' + this.minutes + ':' + this.seconds;
    }

    return this.time;
  }

  render() {
    return (
      <div>
        <div className={'max-width-1024 ' + this.state.disableClass}>
          <ReactPlayer url='videofile1.mp4' playing={this.state.playing} controls={true} ref={this.myVideoRef} />

          <div id="controls">
              <button onClick={() => this.rewindVideo()}>Refresh</button>
              <button onClick={() => this.backwardVideo()}>Backward</button>
              <button onClick={() => this.playPauseVideo()}>Play/Pause</button>
              <button onClick={() => this.forwardVideo()}>Forward</button>
          </div>

          <div id="range" style={{ marginTop: '30px', width: '640px' }}></div>
          <div id="value-input"></div>
          <div id="value-span"></div>

          <div id="download">
            <button onClick={this.downloadSnippet}>Download Snippet</button>
          </div>
        </div>
      </div>
    );
  }
}

export default NewSnippetComponent;