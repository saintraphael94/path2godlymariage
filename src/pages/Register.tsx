import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    church: "",
    residential_location: "",
    attendance_mode: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "registration_open")
        .maybeSingle();
      setRegistrationOpen(data?.value === true || data?.value === "true");
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registrationOpen === false) {
      toast.error("Registration is currently closed.");
      return;
    }
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.phone ||
      !form.gender ||
      !form.church ||
      !form.residential_location ||
      !form.attendance_mode
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          phone: form.phone,
          gender: form.gender,
          church: form.church,
          residential_location: form.residential_location,
          attendance_mode: form.attendance_mode,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registration successful! Please check your email to confirm your account.");
      navigate("/login");
    }
  };

  if (registrationOpen === false) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center animate-fade-up">
          <h1 className="mb-3 text-3xl text-foreground">Registration Closed</h1>
          <p className="text-muted-foreground">
            Registration for the P2GM program is currently closed. Please check back later
            or contact the administrators for more information.
          </p>
          <Link to="/" className="mt-6 inline-block font-medium text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-md px-4 py-16 animate-fade-up">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl text-foreground">Join the Program</h1>
          <p className="text-muted-foreground">Create your P2GM account to begin the journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <Label>Gender *</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })} required>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="church">Church *</Label>
            <Input id="church" value={form.church} onChange={(e) => setForm({ ...form, church: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="residential_location">Residential Location *</Label>
            <Input
              id="residential_location"
              value={form.residential_location}
              onChange={(e) => setForm({ ...form, residential_location: e.target.value })}
              placeholder="City, State / Country"
              required
            />
          </div>
          <div>
            <Label>Will you be joining online or onsite? *</Label>
            <Select value={form.attendance_mode} onValueChange={(v) => setForm({ ...form, attendance_mode: v })} required>
              <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="onsite">Onsite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </PageLayout>
  );
}
