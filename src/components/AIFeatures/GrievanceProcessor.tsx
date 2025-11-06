import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, FileText, MessageSquare } from 'lucide-react';
import { 
  processGrievance, 
  categorizeGrievance, 
  generateGrievanceResponse,
  GRIEVANCE_MODELS,
  type GrievanceModel 
} from '@/services/huggingface';
import { useToast } from '@/hooks/use-toast';

export default function GrievanceProcessor() {
  const [grievanceText, setGrievanceText] = useState('');
  const [selectedModel, setSelectedModel] = useState<GrievanceModel>(GRIEVANCE_MODELS.LLAMA);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('process');
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!grievanceText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a grievance text',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setResult('');

    try {
      let response;
      
      switch (activeTab) {
        case 'process':
          response = await processGrievance({
            grievanceText,
            model: selectedModel,
          });
          break;
        case 'categorize':
          response = await categorizeGrievance(grievanceText, selectedModel);
          break;
        case 'respond':
          response = await generateGrievanceResponse(grievanceText, selectedModel);
          break;
        default:
          response = await processGrievance({
            grievanceText,
            model: selectedModel,
          });
      }

      setResult(response.generated_text);
      toast({
        title: 'Success',
        description: 'Grievance processed successfully',
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing failed',
        description: 'Please check your API key and try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getModelDisplayName = (model: string) => {
    if (model.includes('Llama')) return 'Llama 3.1 8B';
    if (model.includes('Mistral')) return 'Mistral 7B';
    if (model.includes('Qwen')) return 'Qwen 2.5 7B';
    return model;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Citizen Grievance AI Processor</CardTitle>
        <CardDescription>
          Process, categorize, and respond to citizen grievances using fine-tuned AI models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-select">Select AI Model</Label>
          <Select
            value={selectedModel}
            onValueChange={(value) => setSelectedModel(value as GrievanceModel)}
          >
            <SelectTrigger id="model-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GRIEVANCE_MODELS.LLAMA}>
                {getModelDisplayName(GRIEVANCE_MODELS.LLAMA)}
              </SelectItem>
              <SelectItem value={GRIEVANCE_MODELS.MISTRAL}>
                {getModelDisplayName(GRIEVANCE_MODELS.MISTRAL)}
              </SelectItem>
              <SelectItem value={GRIEVANCE_MODELS.QWEN}>
                {getModelDisplayName(GRIEVANCE_MODELS.QWEN)}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="process">
              <Send className="mr-2 h-4 w-4" />
              Process
            </TabsTrigger>
            <TabsTrigger value="categorize">
              <FileText className="mr-2 h-4 w-4" />
              Categorize
            </TabsTrigger>
            <TabsTrigger value="respond">
              <MessageSquare className="mr-2 h-4 w-4" />
              Respond
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grievance-input">Grievance Text</Label>
              <Textarea
                id="grievance-input"
                value={grievanceText}
                onChange={(e) => setGrievanceText(e.target.value)}
                placeholder="Enter the citizen's grievance here..."
                className="min-h-[150px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="categorize" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grievance-categorize">Grievance Text</Label>
              <Textarea
                id="grievance-categorize"
                value={grievanceText}
                onChange={(e) => setGrievanceText(e.target.value)}
                placeholder="Enter the grievance to categorize..."
                className="min-h-[150px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="respond" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grievance-respond">Grievance Text</Label>
              <Textarea
                id="grievance-respond"
                value={grievanceText}
                onChange={(e) => setGrievanceText(e.target.value)}
                placeholder="Enter the grievance to generate a response..."
                className="min-h-[150px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleProcess}
          disabled={isProcessing || !grievanceText.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Process Grievance
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-2">
            <Label htmlFor="result">AI Response</Label>
            <Textarea
              id="result"
              value={result}
              readOnly
              className="min-h-[200px] bg-muted"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
