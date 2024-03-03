console.log("load script.js");

const SERVER_DOMAIN = 'localhost:8080'

document.addEventListener('DOMContentLoaded', (event) => {
  const videoUploadElement = document.getElementById('video-upload');
  const videoDownloadElement = document.getElementById('video-download');
  let mediaRecorder;
  let socket = new WebSocket(`ws://${SERVER_DOMAIN}/upload`);
  document.getElementById('btn-start-live').addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true})
      .then(stream => {
        videoUploadElement.srcObject = stream
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function(event) {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };
        mediaRecorder.start(1000);
      })
      .catch(error => {
        console.error("mediaDevices.getUserMedia error:", error);
      });
  })
  document.getElementById('btn-start-view').addEventListener('click', () => {
    const videoSrc = `http://${SERVER_DOMAIN}/download/output.m3u8`;
    const hls = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(videoDownloadElement);
  })
})

