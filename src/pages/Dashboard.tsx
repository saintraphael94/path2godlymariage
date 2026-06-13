import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, User, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [attendanceCount, setAttendanceCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => setAttendanceCount(count ?? 0));
    }
  }, [user]);

  if (loading || !profile) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  const progress = Math.round((attendanceCount / 12) * 100);

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="mb-1 text-3xl text-foreground">Welcome, {profile.name}</h1>
          <p className="text-muted-foreground">Registration ID: <span className="font-mono font-medium text-primary">{profile.registration_id}</span></p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3 animate-fade-up delay-100">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" /> Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${profile.status === "active" ? "bg-green-100 text-green-800" : "bg-gold-light text-gold"}`}>
                {profile.status === "active" ? "Active" : "Completed"}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle className="h-4 w-4" /> Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{attendanceCount}/12</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4" /> Batch Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{profile.batch_year}/{profile.batch_year + 1}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 animate-fade-up delay-200">
          <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate("/learning")}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Learning Materials
                </h3>
                <p className="text-sm text-muted-foreground">Access monthly Bible studies and notes</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate("/attendance")}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  Attendance
                </h3>
                <p className="text-sm text-muted-foreground">Mark your monthly session attendance</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
