import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  month: number;
  title: string;
}

export default function Attendance() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attended, setAttended] = useState<Set<string>>(new Set());
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    supabase
      .from("sessions")
      .select("id, month, title")
      .order("month")
      .then(({ data }) => setSessions((data as Session[]) ?? []));
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from("attendance")
        .select("session_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setAttended(new Set(data?.map((a) => a.session_id) ?? []));
        });
    }
  }, [user]);

  const markAttendance = async (sessionId: string) => {
    if (!user) return;
    setMarking(sessionId);
    const { error } = await supabase.from("attendance").insert({
      user_id: user.id,
      session_id: sessionId,
    });
    setMarking(null);
    if (error) {
      if (error.code === "23505") {
        toast.info("Attendance already marked for this session.");
      } else {
        toast.error("Failed to mark attendance.");
      }
    } else {
      setAttended((prev) => new Set([...prev, sessionId]));
      toast.success("Attendance marked!");
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="mb-2 text-3xl text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Mark your attendance for each monthly session.</p>
        </div>

        <div className="space-y-3">
          {sessions.map((s, i) => {
            const done = attended.has(s.id);
            return (
              <Card
                key={s.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">Month {s.month}</p>
                      <p className="text-sm text-muted-foreground">{s.title}</p>
                    </div>
                  </div>
                  {!done && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={marking === s.id}
                      onClick={() => markAttendance(s.id)}
                    >
                      {marking === s.id ? "Marking…" : "Mark"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
