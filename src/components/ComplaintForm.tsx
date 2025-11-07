import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Mic, Loader2, Upload, Sparkles } from "lucide-react";
import { transcribeAudio, categorizeGrievance } from "@/services/huggingface";
import { transcribeAudioLocal, checkLocalWhisperHealth, translateToEnglishLocal } from "@/services/whisper-local";
import { categorizeGrievanceLocal, checkLocalGrievanceHealth } from "@/services/grievance-local";
import { callFineTunedLLM, getAvailableModels, type LLMModel } from "@/services/llm-models";

interface ComplaintFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Department {
  id: string;
  name: string;
  description: string;
}

const complaintSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(1000),
  location: z.string().trim().max(150).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  department_id: z.string().uuid("Please select a department"),
  summary: z.string().trim().max(200).optional(),
});

const ComplaintForm = ({ open, onClose, onSuccess }: ComplaintFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    severity: "low",
    department_id: "",
    summary: "",
    llm_model_used: "",
  });
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [useAIAutofill, setUseAIAutofill] = useState(true);
  const [useLLMMode, setUseLLMMode] = useState(false);
  const [selectedLLMModel, setSelectedLLMModel] = useState<LLMModel>('llama');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name, description")
        .eq("is_active", true)
        .order("name");

      if (!error && data) {
        setDepartments(data);
      }
    };

    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validated = complaintSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use provided summary or generate from description (first 100 chars)
      const summary = validated.summary || validated.description.substring(0, 100) + (validated.description.length > 100 ? "..." : "");

      const { error } = await supabase.from("complaints").insert({
        citizen_id: user.id,
        description: validated.description,
        location: validated.location || "",
        severity: validated.severity,
        department_id: validated.department_id,
        summary,
        transcription_text: transcription || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Complaint Filed",
        description: "Your complaint has been submitted successfully. We'll notify you of any updates.",
      });

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit complaint. Please try again.";
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        description: 'Speak your complaint into the microphone',
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
      handleTranscribe(file);
    }
  };

  const handleTranscribe = async (audio: Blob | File) => {
    setIsTranscribing(true);
    try {
      // Check if local Whisper server is available
      const isLocalAvailable = await checkLocalWhisperHealth();
      
      if (!isLocalAvailable) {
        // Show helpful message if local server is not running
        toast({
          title: 'Local Whisper Server Required',
          description: 'Please start the local Whisper server for Hindi2Hinglish transcription. Run: cd whisper-local-server && ./start.sh (or start.bat on Windows). Server runs on port 5001.',
          variant: 'destructive',
        });
        return;
      }
      
      // Use local Whisper server (Hindi2Hinglish)
      console.log('Using local Whisper server');
      const result = await transcribeAudioLocal(audio);
      
      if (!result.success) {
        throw new Error(result.error || 'Local transcription failed');
      }
      
      const transcribedText = result.text;
      
      // Set transcription field with Hinglish text
      setTranscription(transcribedText);
      
      // Translate Hinglish to English
      console.log('Translating Hinglish to English...');
      const translationResult = await translateToEnglishLocal(transcribedText);
      
      let finalText = transcribedText;
      if (translationResult.success && translationResult.translated_text) {
        finalText = translationResult.translated_text;
        console.log('Translation successful:', finalText);
      } else {
        console.warn('Translation failed, using Hinglish text');
      }
      
      // Set description with English translation (fallback if LLM fails)
      setFormData(prev => ({ ...prev, description: finalText }));
      
      toast({
        title: 'Transcription complete',
        description: 'Audio transcribed and translated to English',
      });
      
      // Always process with LLM to get cleaned description
      if (useAIAutofill) {
        await processWithAI(finalText);
      } else {
        // If AI is disabled, still use the translated text as description
        console.log('AI autofill disabled, using translated text as description');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const processWithAI = async (grievanceText: string) => {
    setIsProcessingAI(true);
    try {
      toast({
        title: 'AI Processing',
        description: `Analyzing with ${selectedLLMModel.toUpperCase()} model...`,
      });

      // Use fine-tuned LLM model with instruction.txt
      const llmOutput = await callFineTunedLLM(grievanceText, selectedLLMModel);
      
      console.log(`LLM Output from ${selectedLLMModel.toUpperCase()} model:`, llmOutput);
      
      // Map department name to department ID
      const deptMapping: Record<string, string> = {
        'roads_and_traffic': 'roads',
        'water_supply': 'water',
        'solid_waste_management': 'waste',
      };
      
      const deptKeyword = deptMapping[llmOutput.department] || llmOutput.department;
      const matchedDept = departments.find(d => 
        d.name.toLowerCase().includes(deptKeyword) ||
        d.name.toLowerCase().includes(llmOutput.department.replace(/_/g, ' '))
      );
      
      // Auto-fill form fields with LLM output
      setFormData(prev => ({
        ...prev,
        description: llmOutput.description,
        severity: llmOutput.severity,
        location: llmOutput.location || prev.location,
        department_id: matchedDept?.id || prev.department_id,
        summary: llmOutput.summary,
        llm_model_used: selectedLLMModel,
      }));
      
      toast({
        title: 'AI Auto-fill Complete',
        description: `Processed with ${selectedLLMModel.toUpperCase()} model. Form fields auto-filled.`,
      });
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: 'AI Processing Failed',
        description: 'Could not auto-fill form. Please fill manually.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const parseAIResponse = (aiText: string) => {
    const parsed: {
      severity?: string;
      location?: string;
      department_id?: string;
      summary?: string;
    } = {};
    
    const lowerText = aiText.toLowerCase();
    
    // Extract severity
    if (lowerText.includes('critical') || lowerText.includes('emergency')) {
      parsed.severity = 'critical';
    } else if (lowerText.includes('high') || lowerText.includes('urgent')) {
      parsed.severity = 'high';
    } else if (lowerText.includes('medium') || lowerText.includes('moderate')) {
      parsed.severity = 'medium';
    } else if (lowerText.includes('low') || lowerText.includes('minor')) {
      parsed.severity = 'low';
    }
    
    // Extract location from AI response
    const locationMatch = aiText.match(/location[:\s]+([^\n]+)/i);
    if (locationMatch) {
      const loc = locationMatch[1].trim();
      // Only set location if it's not empty or "not specified"
      if (loc && !loc.toLowerCase().includes('not specified') && !loc.toLowerCase().includes('none')) {
        parsed.location = loc;
      }
    }
    
    // Extract summary from AI response
    const summaryMatch = aiText.match(/summary[:\s]+([^\n]+)/i);
    if (summaryMatch) {
      parsed.summary = summaryMatch[1].trim();
    }
    
    // Map department based on keywords (only road, water, waste)
    if (lowerText.includes('water') || lowerText.includes('paani') || lowerText.includes('jal')) {
      const waterDept = departments.find(d => d.name.toLowerCase().includes('water'));
      if (waterDept) parsed.department_id = waterDept.id;
    } else if (lowerText.includes('waste') || lowerText.includes('garbage') || lowerText.includes('kachra') || lowerText.includes('sanitation') || lowerText.includes('trash')) {
      const wasteDept = departments.find(d => d.name.toLowerCase().includes('waste') || d.name.toLowerCase().includes('sanitation'));
      if (wasteDept) parsed.department_id = wasteDept.id;
    } else if (lowerText.includes('road') || lowerText.includes('sadak') || lowerText.includes('street') || lowerText.includes('pothole')) {
      const roadDept = departments.find(d => d.name.toLowerCase().includes('road'));
      if (roadDept) parsed.department_id = roadDept.id;
    }
    
    return parsed;
  };




  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File a New Complaint</DialogTitle>
          <DialogDescription>
            Provide details about the issue you're facing. We'll route it to the appropriate department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select
              value={formData.department_id}
              onValueChange={(value) => setFormData({ ...formData, department_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name.replace(/_/g, " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level *</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                <SelectItem value="medium">Medium - Affects daily life</SelectItem>
                <SelectItem value="high">High - Urgent attention needed</SelectItem>
                <SelectItem value="critical">Critical - Emergency situation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Street name, landmark, area (leave empty if not applicable)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters. Be specific about the problem.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary (Optional)</Label>
            <Input
              id="summary"
              placeholder="Brief summary of the issue (auto-generated by AI if empty)"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              A concise summary will be auto-generated if left empty.
            </p>
          </div>

          <div className="space-y-2">
            {/* AI Auto-fill Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pt-2 pb-2 px-3 bg-muted/50 rounded-lg">
                <Label htmlFor="ai-autofill" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Auto-fill Form Fields
                  <span className="text-xs text-muted-foreground font-normal">(uses fine-tuned grievance models)</span>
                </Label>
                <Switch
                  id="ai-autofill"
                  checked={useAIAutofill}
                  onCheckedChange={setUseAIAutofill}
                />
              </div>
              
              {/* LLM Model Selection */}
              {useAIAutofill && (
                <div className="space-y-3 pt-2 pb-2 px-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-medium">Fine-tuned LLM Model</Label>
                  </div>
                  <Select value={selectedLLMModel} onValueChange={(value) => setSelectedLLMModel(value as LLMModel)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LLM model" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableModels().map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the AI model for analyzing your grievance
                  </p>
                </div>
              )}
            </div>
            
            {/* Audio Recording Options */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'outline'}
                size="sm"
                disabled={isTranscribing || loading}
              >
                {isRecording ? (
                  <>
                    <Mic className="mr-2 h-4 w-4 animate-pulse" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Record Audio
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                disabled={isTranscribing || isRecording || loading}
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
            
            {/* Manual Transcript Input */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="manual-transcript">Or Type Transcript Manually</Label>
              <div className="flex gap-2">
                <Textarea
                  id="manual-transcript"
                  placeholder="Type or paste your complaint in Hinglish or English..."
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  className="min-h-[80px]"
                  disabled={isProcessingAI || loading}
                />
              </div>
              <Button
                type="button"
                onClick={async () => {
                  if (!transcription.trim()) {
                    toast({
                      title: 'No transcript',
                      description: 'Please type a complaint first',
                      variant: 'destructive',
                    });
                    return;
                  }
                  
                  setIsProcessingAI(true);
                  try {
                    // Translate Hinglish to English if needed
                    const translationResult = await translateToEnglishLocal(transcription);
                    
                    let finalText = transcription;
                    if (translationResult.success && translationResult.translated_text) {
                      finalText = translationResult.translated_text;
                      console.log('Translation successful:', finalText);
                    } else {
                      console.warn('Translation failed, using original text');
                    }
                    
                    // Set description with translated text
                    setFormData(prev => ({ ...prev, description: finalText }));
                    
                    // Process with LLM
                    await processWithAI(finalText);
                  } catch (error) {
                    console.error('Processing error:', error);
                    toast({
                      title: 'Processing failed',
                      description: error instanceof Error ? error.message : 'Please try again',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsProcessingAI(false);
                  }
                }}
                disabled={!transcription.trim() || isProcessingAI || loading}
                className="w-full"
                variant="secondary"
              >
                {isProcessingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Process Transcript with AI
                  </>
                )}
              </Button>
              
              {isProcessingAI && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  AI Processing...
                </div>
              )}
            </div>
            
            {/* Transcription Field */}
            <div className="space-y-2">
              <Label htmlFor="transcription">Transcription</Label>
              <Textarea
                id="transcription"
                placeholder="Transcribed text will appear here..."
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <p className="text-xs text-muted-foreground italic">
              💡 Tip: Use voice recording to describe your complaint in Hindi - it will be automatically transcribed and analyzed by AI
            </p>
          </div>


          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintForm;
