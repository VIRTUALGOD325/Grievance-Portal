import express from 'express';
import { TranscriptionService } from './services/transcription_service';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const transcriptionService = new TranscriptionService();

app.post('/transcribe', async (req, res) => {
    try {
        const audioFile = req.body.audioFile;
        const transcription = await transcriptionService.transcribe(audioFile);
        res.status(200).json({ transcription });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});