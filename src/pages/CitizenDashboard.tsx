import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FileText, LogOut, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import ComplaintForm from "@/components/ComplaintForm";

interface Complaint {
  id: string;
  description: string;
  summary: string;
  severity: string;
  status: string;
  location: string;
  transcription_text: string | null;
  created_at: string;
  departments: { name: string } | null;
}

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Check authentication and fetch data
    const initializeData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchComplaints(session.user.id);
    };

    initializeData();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchComplaints = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          id,
          description,
          summary,
          severity,
          status,
          location,
          transcription_text,
          created_at,
          departments (name)
        `)
        .eq("citizen_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "secondary";
      case "in_progress": return "default";
      case "assigned": return "default";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Citizen Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Action Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-primary to-primary-glow text-white border-0 shadow-elevated">
            <CardHeader>
              <CardTitle className="text-2xl">File a New Complaint</CardTitle>
              <CardDescription className="text-white/80">
                Report civic issues and track them until resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => setShowForm(true)}
                className="bg-white text-primary hover:bg-white/90"
              >
                <Plus className="mr-2 h-5 w-5" />
                File Complaint
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Complaints List */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">My Complaints</h2>
          </div>

          {complaints.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No complaints filed yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {complaint.summary || "Complaint"}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant={getSeverityColor(complaint.severity)}>
                            {complaint.severity}
                          </Badge>
                          <Badge variant={getStatusColor(complaint.status)}>
                            {complaint.status.replace("_", " ")}
                          </Badge>
                          {complaint.departments && (
                            <Badge variant="outline">
                              {complaint.departments.name.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mt-3">
                      {complaint.description}
                    </p>
                    {complaint.transcription_text && (
                      <div className="mt-3 p-2 bg-muted/50 rounded-md border border-muted">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          🎤 Original Transcription:
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          "{complaint.transcription_text}"
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {complaint.location || "Location not specified"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      📅 {new Date(complaint.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Complaint Form Dialog */}
      {showForm && (
        <ComplaintForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            if (user) fetchComplaints(user.id);
          }}
        />
      )}
    </div>
  );
};

export default CitizenDashboard;
