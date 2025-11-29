# AssemblyAI Setup

To enable real-time captions:

1.  **Get an API Key**:
    *   Sign up at [AssemblyAI](https://www.assemblyai.com/).
    *   Copy your API Key from the dashboard.

2.  **Update `.env.local`**:
    *   Add your key:
        ```dotenv
        ASSEMBLYAI_API_KEY=your_actual_api_key_here
        ```

3.  **Restart Server**:
    *   Stop the server (Ctrl+C) and run `npm run dev` again.

## How it works
1.  The app requests a temporary token from `/api/assemblyai/token`.
2.  The frontend connects to AssemblyAI's Real-time WebSocket API.
3.  Your local audio is sent to AssemblyAI.
4.  Transcripts are received back.
5.  Transcripts are broadcast to other participants in the room using LiveKit DataChannels.
6.  Everyone sees the captions at the bottom of the screen.
