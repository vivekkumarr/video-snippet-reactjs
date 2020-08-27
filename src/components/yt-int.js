import React from 'react';
import noUiSlider from 'nouislider';
import 'nouislider/distribute/nouislider.css';
import '../App.css';

class YtIntComponent extends React.Component {
  constructor(props) {
    super(props);
    this.init();
    this.video = 'CSvFpBOe8eY' //video id
    this.fromOld = 0;

    window['onYouTubeIframeAPIReady'] = (e) => {
      this.player = new window['YT'].Player('player', {
        videoId: this.video,
        events: {
          'onStateChange': this.onPlayerStateChange.bind(this),
          'onError': this.onPlayerError.bind(this),
          'onReady': this.onPlayerReady.bind(this)
        }
      });
    };
  }
  render() {
    return (
      <div>
        <div className="max-width-1024">
          <div className="embed-responsive embed-responsive-16by9" id="player">
          </div>

          <div id="range" style={{ width: '640px' }}></div>
          <div id="value-input"></div>
          <div id="value-span"></div>

          <div id="controls">
              <button onClick={() => this.rewindVideo()}>Refresh</button>
              <button onClick={() => this.backwardVideo()}>Backward</button>
              <button onClick={() => this.playPauseVideo()}>Play/Pause</button>
              <button onClick={() => this.forwardVideo()}>Forward</button>
          </div>
        </div>
      </div>
    );
  }
  init() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  onPlayerReady() {
    this.duration = this.player.getDuration();
    this.toOld = this.duration;

    this.playPauseVideo();
    this.setIONrangeSlider();
    this.checkDomainAndStop();
  }

  rewindVideo() {
    this.player.seekTo(this.fromOld, true);
    this.playVideo();
  }

  playPauseVideo() {
    //is playing
    console.log("this.player.getPlayerState()", this.player.getPlayerState());
    if (this.player.getPlayerState() === 1) {
      this.pauseVideo();
    }
    else {
      this.playVideo();
    }
  }

  pauseVideo() {
    this.player.pauseVideo();
  }

  playVideo() {
    this.player.playVideo();
  }

  backwardVideo() {
    var curTime = this.player.getCurrentTime();
    curTime -= 5;
    if (curTime < this.fromOld) {
      this.player.seekTo(this.fromOld, true);
    }
    else {
      this.player.seekTo(curTime, true);
    }
  }

  forwardVideo() {
    var curTime = this.player.getCurrentTime();

    curTime += 5;
    if (curTime > this.toOld) {
      this.player.seekTo(this.toOld, true);
    }
    else {
      this.player.seekTo(curTime, true);
    }
  }

  setIONrangeSlider() {

    this.slider = document.getElementById('range');

    noUiSlider.create(this.slider, {
      start: [0, this.duration], // Handle start position
      step: 1, // Slider moves in increments of '1'
      margin: 3, // Handles must be more than '3' apart
      connect: true, // Display a colored bar between the handles
      behaviour: 'tap-drag', // Move handle on tap, bar is draggable
      range: { // Slider can select '0' to 'duration'
        'min': 0,
        'max': this.duration
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
          this.player.seekTo(this.readValue, true);
          this.player.pauseVideo();
          this.player.playVideo();
        }
      }
    });

    // When the input changes, set the slider value
    document.getElementById('value-input').addEventListener('change', function () {
      this.slider.noUiSlider.set([null, this.value]);
    });
  }

  checkDomainAndStop = () => {
    var curTime = this.player.getCurrentTime();

    if (curTime < this.fromOld) {
      this.player.seekTo(this.fromOld, true);
    }
    if (curTime > this.toOld) {
      this.player.seekTo(this.toOld, true);
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

  onPlayerStateChange(event) {
    console.log(event)
    switch (event.data) {
      case window['YT'].PlayerState.PLAYING:
        if (this.cleanTime() === 0) {
          console.log(`started ${this.cleanTime()}`);
        } else {
          console.log(`playing ${this.cleanTime()}`)
        };
        break;
      case window['YT'].PlayerState.PAUSED:
        if (this.player.getDuration() - this.player.getCurrentTime() !== 0) {
          console.log(`paused @ ${this.cleanTime()}`);
        };
        break;
      case window['YT'].PlayerState.ENDED:
        console.log('ended ');
        break;
      default:
    };
  };
  //utility
  cleanTime() {
    return Math.round(this.player.getCurrentTime())
  };
  onPlayerError(event) {
    switch (event.data) {
      case 2:
        console.log('' + this.video)
        break;
      case 100:
        break;
      case 101 || 150:
        break;
      default:
    };
  };
}

export default YtIntComponent;