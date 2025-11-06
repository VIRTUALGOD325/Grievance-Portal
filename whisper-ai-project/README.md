# Whisper AI Project

This project integrates the Whisper model from Hugging Face for audio transcription. It provides a set of APIs to interact with the model and process audio files.

## Project Structure

```
whisper-ai-project
├── src
│   ├── api
│   │   ├── huggingface.ts
│   │   └── whisper.ts
│   ├── models
│   │   └── whisper_model.ts
│   ├── services
│   │   └── transcription_service.ts
│   ├── utils
│   │   └── audio_processor.ts
│   └── app.ts
├── tests
│   └── transcription.test.ts
├── configs
│   └── model_config.json
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd whisper-ai-project
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables in the `.env` file.

4. Run the application:
   ```
   npm start
   ```

## Usage

- The API can be accessed at `http://localhost:3000/api`.
- Use the endpoints defined in `src/api/huggingface.ts` and `src/api/whisper.ts` for interacting with the Whisper model.

## Testing

Run the tests using:
```
npm test
```

## License

This project is licensed under the MIT License.