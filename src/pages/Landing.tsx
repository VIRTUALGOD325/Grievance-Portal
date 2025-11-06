import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Shield, Zap, Users } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-8 w-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Municipal Grievance Portal</h1>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate("/auth")}
            >
              Citizen Login
            </Button>
            <Button 
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => navigate("/admin/auth")}
            >
              Admin Login
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Voice,<br />Our Responsibility
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Report civic issues instantly. Track complaints in real-time. 
            Experience transparent governance powered by AI.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              File a Complaint
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8"
              onClick={() => navigate("/admin/auth")}
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-8 bg-white/95 backdrop-blur border-0 shadow-elevated">
            <div className="bg-gradient-to-br from-primary to-primary-glow p-3 rounded-lg w-fit mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Fast & Efficient</h3>
            <p className="text-muted-foreground">
              AI-powered complaint categorization and routing ensures rapid response times
            </p>
          </Card>

          <Card className="p-8 bg-white/95 backdrop-blur border-0 shadow-elevated">
            <div className="bg-gradient-to-br from-secondary to-accent p-3 rounded-lg w-fit mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Transparent</h3>
            <p className="text-muted-foreground">
              Track every step of your complaint with complete transparency and data security
            </p>
          </Card>

          <Card className="p-8 bg-white/95 backdrop-blur border-0 shadow-elevated">
            <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multilingual Support</h3>
            <p className="text-muted-foreground">
              Voice-based complaints in English, Hindi, and Hinglish for inclusive access
            </p>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Available Service</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5+</div>
              <div className="text-white/80">Department Coverage</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Fast</div>
              <div className="text-white/80">AI-Powered Routing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-white/70">
        <p>&copy; 2025 Municipal Grievance Portal. Building better communities together.</p>
      </footer>
    </div>
  );
};

export default Landing;
