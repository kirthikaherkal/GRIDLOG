import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 animate-fade-in">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <KlsGridLogo height={52} />
        </div>

        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
          College Lab
          <br />
          Record Maintainer
        </h1>
        <p className="mb-10 text-lg text-muted-foreground">
          Track attendance and work logs for your college lab sessions.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gap-2 text-lg shadow-sm"
            onClick={() => navigate("/student")}
          >
            <GraduationCap className="h-5 w-5" />
            Student Login
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg shadow-sm"
            onClick={() => navigate("/admin")}
          >
            <ShieldCheck className="h-5 w-5" />
            Admin Login
          </Button>
        </div>
      </div>

      <footer className="absolute bottom-4 flex items-center gap-2 text-xs text-muted-foreground">
        <KlsGridLogo variant="badge" height={18} />
        <span>· Lab Management System</span>
      </footer>
    </main>
  );
};

export default Landing;
