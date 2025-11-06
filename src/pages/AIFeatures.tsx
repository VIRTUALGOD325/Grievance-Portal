import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Mic, MessageSquare, Info } from 'lucide-react';
import WhisperTranscription from '@/components/AIFeatures/WhisperTranscription';
import GrievanceProcessor from '@/components/AIFeatures/GrievanceProcessor';

export default function AIFeatures() {
  const hasApiKey = !!import.meta.env.VITE_HUGGINGFACE_API_KEY;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8" />
          AI-Powered Features
        </h1>
        <p className="text-muted-foreground">
          Leverage advanced AI models for citizen grievance processing and audio transcription
        </p>
      </div>

      {!hasApiKey && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>API Key Required</AlertTitle>
          <AlertDescription>
            To use these AI features, you need to add your Hugging Face API key to the <code>.env</code> file:
            <br />
            <code className="mt-2 block bg-muted p-2 rounded">
              VITE_HUGGINGFACE_API_KEY=your_api_key_here
            </code>
            <br />
            Get your API key from{' '}
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Hugging Face Settings
            </a>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="grievance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grievance">
            <MessageSquare className="mr-2 h-4 w-4" />
            Grievance Processing
          </TabsTrigger>
          <TabsTrigger value="transcription">
            <Mic className="mr-2 h-4 w-4" />
            Audio Transcription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grievance" className="space-y-4">
          <GrievanceProcessor />
          
          <Card>
            <CardHeader>
              <CardTitle>About Grievance Models</CardTitle>
              <CardDescription>
                Fine-tuned models specifically trained for citizen grievance handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="font-semibold">Llama 3.1 8B</h3>
                  <p className="text-sm text-muted-foreground">
                    Meta's powerful instruction-tuned model, fine-tuned for grievance processing with excellent reasoning capabilities.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Mistral 7B</h3>
                  <p className="text-sm text-muted-foreground">
                    Efficient and fast model with strong performance on classification and response generation tasks.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Qwen 2.5 7B</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced multilingual model with excellent understanding of context and nuanced responses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcription" className="space-y-4">
          <WhisperTranscription />
          
          <Card>
            <CardHeader>
              <CardTitle>About Whisper Hindi2Hinglish</CardTitle>
              <CardDescription>
                Specialized audio transcription for Hindi to Hinglish conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This model is specifically trained to transcribe Hindi audio into Hinglish (Hindi written in Roman script),
                making it perfect for processing citizen grievances in regions where Hindi is commonly spoken but typed in English characters.
                The Swift variant provides faster inference times while maintaining high accuracy.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
