import './Video.css';
import testVideo from './assets/videos/test1.mp4';



function Video() {
  return (
    <div className="video">
      <video
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        className="video_player"
        controls
        autoPlay
        loop
        muted
      />
    </div>
  );
}

export default Video;
