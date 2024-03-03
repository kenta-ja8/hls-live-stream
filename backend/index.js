const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FILE_NAME = 'output.m3u8';
const HLS_CONTENT_DIR = 'hls-content'
const UPLOAD_PATH = '/upload'
const DOWNLOAD_PATH = '/download'

const startServer = (outputAbsoluteDir) => {
  const app = express();

  app.use(cors({ origin: '*', }))
  app.use(DOWNLOAD_PATH, express.static(path.join(__dirname, HLS_CONTENT_DIR)))

  const wss = new WebSocket.WebSocketServer({ noServer: true });
  wss.on('connection', function connection(ws) {
    console.log('[wss] client connected');

    const ffmpegProcess = spawn('ffmpeg', [
      '-i', '-',
      '-c:a', 'aac',
      '-hls_time', '10',
      '-hls_list_size', '0',
      '-f', 'hls',
      '-hls_flags', 'append_list',
      path.join(outputAbsoluteDir, FILE_NAME)
    ]);

    ws.on('message', function incoming(message) {
      console.log('[ws] received');
      ffmpegProcess.stdin.write(message);
    });

    ws.on('close', function() {
      console.log('[ws] client disconnected');
      ffmpegProcess.stdin.end();
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error(`[ffmpeg] stderr: ${data}`);
    });
  });

  const server = http.createServer(app);
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (pathname === UPLOAD_PATH) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

const main = () => {
  const outputAbsoluteDir = path.join(__dirname, HLS_CONTENT_DIR);
  if (!fs.existsSync(outputAbsoluteDir)) {
    fs.mkdirSync(outputAbsoluteDir, { recursive: true });
  }
  startServer(outputAbsoluteDir)
  console.log('server started');
}

main()

