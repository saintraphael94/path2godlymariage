import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Session {
  id: string;
  month: number;
  title: string;
  is_locked: boolean;
}

export default function Attendance() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attended, setAttended] = useState<Set<string>>(new Set());
  const [marking, setMarking] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    supabase
      .from("sessions")
      .select("id, month, title, is_locked")
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

  const toggleLock = async (sessionId: string, currentlyLocked: boolean) => {
    setTogglingLock(sessionId);
    const { error } = await supabase
      .from("sessions")
      .update({ is_locked: !currentlyLocked })
      .eq("id", sessionId);
    setTogglingLock(null);
    if (error) {
      toast.error("Failed to update lock status.");
    } else {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, is_locked: !currentlyLocked } : s)),
      );
      toast.success(!currentlyLocked ? "Contact locked." : "Contact unlocked.");
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="mb-2 text-3xl text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Mark your attendance for each contact session as it is opened.</p>
        </div>

        <div className="space-y-3">
          {sessions.map((s, i) => {
            const done = attended.has(s.id);
            const canMark = isAdmin || !s.is_locked;
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
                      <p className="font-medium text-foreground">
                        Contact {s.month}
                        {s.is_locked && (
                          <span className="ml-2 text-xs text-muted-foreground">🔒 Locked</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {s.is_locked ? "Locked" : "Unlocked"}
                        </span>
                        <Switch
                          checked={!s.is_locked}
                          disabled={togglingLock === s.id}
                          onCheckedChange={() => toggleLock(s.id, s.is_locked)}
                          aria-label="Toggle contact lock"
                        />
                      </div>
                    )}
                    {!done && canMark && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={marking === s.id}
                        onClick={() => markAttendance(s.id)}
                      >
                        {marking === s.id ? "Marking…" : "Mark"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
