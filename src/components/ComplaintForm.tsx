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
import { transcribeAudioLocal, checkLocalWhisperHealth } from "@/services/whisper-local";
import { categorizeGrievanceLocal, checkLocalGrievanceHealth } from "@/services/grievance-local";

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
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  location: z.string().trim().min(3, "Location must be at least 3 characters").max(150),
  severity: z.enum(["low", "medium", "high", "critical"]),
  department_id: z.string().uuid("Please select a department"),
});

const ComplaintForm = ({ open, onClose, onSuccess }: ComplaintFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    description: "",
    location: "",
    severity: "medium",
    department_id: "",
  });
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [useAIAutofill, setUseAIAutofill] = useState(true);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
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

      // Generate summary from description (first 100 chars)
      const summary = validated.description.substring(0, 100) + (validated.description.length > 100 ? "..." : "");

      const { error } = await supabase.from("complaints").insert({
        citizen_id: user.id,
        description: validated.description,
        location: validated.location,
        severity: validated.severity,
        department_id: validated.department_id,
        summary,
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
      
      // Set description first
      setFormData(prev => ({ ...prev, description: transcribedText }));
      
      toast({
        title: 'Transcription complete',
        description: 'Audio transcribed using local Hindi2Hinglish model',
      });
      
      // If AI autofill is enabled, process with LLM
      if (useAIAutofill) {
        await processWithAI(transcribedText);
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
        description: 'Analyzing grievance to auto-fill form fields...',
      });

      // Check if local grievance server is available
      const isLocalAvailable = await checkLocalGrievanceHealth();
      
      if (!isLocalAvailable) {
        toast({
          title: 'Local Grievance Server Required',
          description: 'Please start the local grievance server. Run: cd grievance-local-server && ./start.sh (or start.bat on Windows). Server runs on port 5002.',
          variant: 'destructive',
        });
        return;
      }

      // Use local fine-tuned grievance model to categorize (using Mistral)
      const aiResponse = await categorizeGrievanceLocal(grievanceText, 'mistral');
      
      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI processing failed');
      }
      
      const analysis = aiResponse.generated_text;
      
      console.log('AI Analysis:', analysis);
      
      // Parse AI response to extract information
      const parsedData = parseAIResponse(analysis);
      
      // Auto-fill form fields
      setFormData(prev => ({
        ...prev,
        description: grievanceText,
        severity: parsedData.severity || prev.severity,
        location: parsedData.location || prev.location,
        department_id: parsedData.department_id || prev.department_id,
      }));
      
      toast({
        title: 'AI Auto-fill Complete',
        description: 'Form fields have been automatically filled based on your grievance',
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
    const locationMatch = aiText.match(/location[:\s]+([^\n,]+)/i);
    if (locationMatch) {
      parsed.location = locationMatch[1].trim();
    }
    
    // Map department based on keywords
    if (lowerText.includes('water') || lowerText.includes('paani')) {
      const waterDept = departments.find(d => d.name.toLowerCase().includes('water'));
      if (waterDept) parsed.department_id = waterDept.id;
    } else if (lowerText.includes('road') || lowerText.includes('sadak') || lowerText.includes('street')) {
      const roadDept = departments.find(d => d.name.toLowerCase().includes('road') || d.name.toLowerCase().includes('public_works'));
      if (roadDept) parsed.department_id = roadDept.id;
    } else if (lowerText.includes('electricity') || lowerText.includes('bijli') || lowerText.includes('power')) {
      const powerDept = departments.find(d => d.name.toLowerCase().includes('electricity') || d.name.toLowerCase().includes('power'));
      if (powerDept) parsed.department_id = powerDept.id;
    } else if (lowerText.includes('garbage') || lowerText.includes('kachra') || lowerText.includes('waste')) {
      const sanitationDept = departments.find(d => d.name.toLowerCase().includes('sanitation') || d.name.toLowerCase().includes('waste'));
      if (sanitationDept) parsed.department_id = sanitationDept.id;
    } else if (lowerText.includes('health') || lowerText.includes('hospital') || lowerText.includes('medical')) {
      const healthDept = departments.find(d => d.name.toLowerCase().includes('health'));
      if (healthDept) parsed.department_id = healthDept.id;
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
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Street name, landmark, area"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
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
            
            {/* AI Auto-fill Toggle */}
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
              
              {isTranscribing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing...
                </div>
              )}
              
              {isProcessingAI && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  AI Processing...
                </div>
              )}
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
