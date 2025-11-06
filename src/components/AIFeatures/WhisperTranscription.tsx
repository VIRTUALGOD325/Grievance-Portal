import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mic, Upload, Loader2, Download, Sparkles } from 'lucide-react';
import { transcribeAudioLocal, transcribeAudioFileLocal, summarizeTextLocal, checkLocalWhisperHealth } from '@/services/whisper-local';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';

export default function WhisperTranscription() {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Check server health on mount
  useEffect(() => {
    checkLocalWhisperHealth().then(setServerAvailable);
  }, []);

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
      // Use local Whisper server for Hindi2Hinglish transcription
      const result = audio instanceof File 
        ? await transcribeAudioFileLocal(audio)
        : await transcribeAudioLocal(audio);
      
      if (result.success && result.text) {
        setTranscription(result.text);
        toast({
          title: 'Transcription complete',
          description: 'Your audio has been transcribed to Hinglish successfully',
        });
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription failed',
        description: 'Please ensure the local Whisper server is running on port 5001',
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

  const handleGenerateSummary = async () => {
    if (!transcription.trim()) {
      toast({
        title: 'No transcription',
        description: 'Please transcribe audio first before generating a summary',
        variant: 'destructive',
      });
      return;
    }

    setIsSummarizing(true);
    try {
      // Use local server for summarization
      const result = await summarizeTextLocal(transcription);
      if (result.success && result.summary_text) {
        setSummary(result.summary_text);
        toast({
          title: 'Summary generated',
          description: 'Your transcription has been summarized successfully',
        });
      } else {
        throw new Error(result.error || 'Summarization failed');
      }
    } catch (error) {
      console.error('Summary error:', error);
      toast({
        title: 'Summary failed',
        description: 'Please ensure the local Whisper server is running on port 5001',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hindi2Hinglish Audio Transcription</CardTitle>
        <CardDescription>
          Record or upload Hindi audio to transcribe to Hinglish using Whisper Hindi2Hinglish model
          {!serverAvailable && (
            <span className="text-destructive block mt-1">
              ⚠️ Local server not detected. Please start the Whisper server on port 5001.
            </span>
          )}
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

        {transcription && isAdmin && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="summary">Summary (Admin Only)</Label>
              <Button
                onClick={handleGenerateSummary}
                variant="outline"
                size="sm"
                disabled={isSummarizing}
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Click 'Generate Summary' to create a summary of the transcription..."
              className="min-h-[100px] bg-muted/50"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
