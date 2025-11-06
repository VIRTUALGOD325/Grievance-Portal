import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, Upload, Loader2, Download } from 'lucide-react';
import { transcribeAudio } from '@/services/huggingface';
import { useToast } from '@/hooks/use-toast';

export default function WhisperTranscription() {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscribe(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording started',
        description: 'Speak into your microphone',
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      handleTranscribe(file);
    }
  };

  const handleTranscribe = async (audio: Blob | File) => {
    setIsTranscribing(true);
    try {
      const result = await transcribeAudio({ data: audio });
      setTranscription(result.text);
      toast({
        title: 'Transcription complete',
        description: 'Your audio has been transcribed successfully',
      });
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription failed',
        description: 'Please check your API key and try again',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const downloadTranscription = () => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Whisper Audio Transcription</CardTitle>
        <CardDescription>
          Record or upload audio to transcribe using OpenAI's Whisper model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? 'destructive' : 'default'}
            disabled={isTranscribing}
          >
            {isRecording ? (
              <>
                <Mic className="mr-2 h-4 w-4 animate-pulse" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={isTranscribing || isRecording}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Audio
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {audioFile && (
          <div className="text-sm text-muted-foreground">
            Selected file: {audioFile.name}
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Transcribing audio...
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="transcription">Transcription</Label>
            {transcription && (
              <Button
                onClick={downloadTranscription}
                variant="ghost"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
          <Textarea
            id="transcription"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder="Transcription will appear here..."
            className="min-h-[200px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
