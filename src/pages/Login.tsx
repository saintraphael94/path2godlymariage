import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // If input looks like a registration ID, look up email
    let loginEmail = email;
    if (email.toUpperCase().startsWith("P2GM-")) {
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("registration_id", email.toUpperCase())
        .single();
      if (data) {
        loginEmail = data.email;
      } else {
        toast.error("Registration ID not found.");
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-md px-4 py-16 animate-fade-up">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in with your email or Registration ID.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email or Registration ID</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com or P2GM-2026-0001"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
        </p>
      </div>
    </PageLayout>
  );
}
