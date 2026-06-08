import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Check your email for the reset link.");
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-md px-4 py-16 animate-fade-up">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl text-foreground">Forgot Password</h1>
          <p className="text-muted-foreground">Enter your email and we’ll send you a reset link.</p>
        </div>

        {sent ? (
          <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
            <p className="text-foreground font-medium">Reset link sent!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check your inbox and follow the link to set a new password.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign In</Link>
        </p>
      </div>
    </PageLayout>
  );
}
