import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, BookOpen, User, CheckSquare, Shield } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/luke117-logo.jpg.asset.json";

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === to ? "text-primary" : "text-muted-foreground"}`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-warm-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="hidden sm:inline text-lg font-bold text-forest" style={{ fontFamily: "'DM Serif Display', serif" }}>
            P2GM
          </span>
          <img src={logoAsset.url} alt="P2GM" className="h-10 w-auto object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLink("/verify", "Verify")}
          {user ? (
            <>
              {navLink("/dashboard", "Dashboard")}
              {navLink("/learning", "Learning")}
              {navLink("/attendance", "Attendance")}
              {navLink("/admission-letter", "Admission Letter")}
              {isAdmin && navLink("/admin", "Admin")}
              <div className="flex items-center gap-3 border-l pl-4">
                <span className="text-xs text-muted-foreground">{profile?.registration_id}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-1 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Register</Button>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t bg-warm-white px-4 py-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-3">
            {navLink("/verify", "Verify")}
            {user ? (
              <>
                {navLink("/dashboard", "Dashboard")}
                {navLink("/learning", "Learning")}
                {navLink("/attendance", "Attendance")}
              {navLink("/admission-letter", "Admission Letter")}
                {isAdmin && navLink("/admin", "Admin")}
                <Button variant="ghost" size="sm" className="justify-start" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Sign In</Button>
                <Button size="sm" className="justify-start" onClick={() => { navigate("/register"); setMobileOpen(false); }}>Register</Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-warm-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Path to Godly Marriage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
