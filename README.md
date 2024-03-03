# live-streaming

# Requirements
- ffmpeg
- Node.js

# Start
```
pnpm install
pnpm run dev
```

# Architecture
- Upload: Browser ---[WebSocket]---> Server (convert to HLS)
- Download: Browser <---[HTTP]--- Server (HLS)

