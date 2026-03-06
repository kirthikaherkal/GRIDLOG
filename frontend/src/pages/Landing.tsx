import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck } from "lucide-react";
import KlsGridLogo from "@/components/KlsGridLogo";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 animate-bgSlowZoom"
        style={{ backgroundImage: "url('/lab.jpg')" }}
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60 backdrop-blur-[2px]" />

      {/* content */}
      <div className="relative z-10 text-center px-6 max-w-2xl animate-fadeUp">

        {/* Logo */}
        <div className="flex justify-center mb-6 hover:scale-105 transition-transform duration-300">
          <KlsGridLogo height={56} />
        </div>

        {/* Heading */}
      <h1 className="text-5xl md:text-6xl font-black font-[Poppins] tracking-wide 
text-transparent bg-clip-text bg-gradient-to-r from-white to-white
drop-shadow-xl">
          <br />
        
         <b> GRIDLOG</b>
        </h1>

        {/* subtitle */}
        <p className="mt-6 mb-10 text-lg md:text-xl text-gray-200 font-semibold hover:text-white transition-colors duration-300">
          Student Attendence Logs
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">

          <Button
            size="lg"
            onClick={() => navigate("/student")}
            className="gap-2 text-lg font-bold px-8 py-6 bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
          >
            <GraduationCap className="h-5 w-5" />
            Student Login
          </Button>

          <Button
  size="lg"
  variant="outline"
  onClick={() => navigate("/admin")}
  className="gap-2 text-lg font-bold px-8 py-6 border-2 border-orange-500 text-white
  bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-orange-500/40 
  shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105"
>
  <ShieldCheck className="h-5 w-5" />
  Admin Login
</Button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-sm text-gray-300 opacity-80 hover:opacity-100 transition-opacity">
          KLS GRID • Technical Team
        </div>

      </div>

    </main>
  );
};

export default Landing;