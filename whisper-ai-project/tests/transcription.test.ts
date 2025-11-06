import { TranscriptionService } from '../src/services/transcription_service';

describe('TranscriptionService', () => {
    let transcriptionService: TranscriptionService;

    beforeEach(() => {
        transcriptionService = new TranscriptionService();
    });

    test('should transcribe audio correctly', async () => {
        const audioFilePath = 'path/to/audio/file.wav';
        const expectedTranscription = 'This is a test transcription.';

        const transcription = await transcriptionService.transcribe(audioFilePath);

        expect(transcription).toBe(expectedTranscription);
    });

    test('should handle errors during transcription', async () => {
        const invalidAudioFilePath = 'path/to/invalid/audio/file.wav';

        await expect(transcriptionService.transcribe(invalidAudioFilePath)).rejects.toThrow('Error transcribing audio');
    });
});