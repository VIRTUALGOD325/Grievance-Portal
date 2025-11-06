import { WhisperModel } from '../models/whisper_model';

export class WhisperAPI {
    private model: WhisperModel;

    constructor() {
        this.model = new WhisperModel();
    }

    async loadModel(modelPath: string): Promise<void> {
        await this.model.load(modelPath);
    }

    async transcribeAudio(audioFilePath: string): Promise<string> {
        return await this.model.transcribe(audioFilePath);
    }
}