import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, BookOpen } from "lucide-react";

interface Session {
  id: string;
  month: number;
  title: string;
  bible_study_content: string | null;
  breakout_notes: string | null;
  file_urls: string[] | null;
  is_locked: boolean;
}

export default function Learning() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    supabase
      .from("sessions")
      .select("*")
      .order("month")
      .then(({ data }) => setSessions((data as Session[]) ?? []));
  }, []);

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="mb-2 text-3xl text-foreground">Learning Materials</h1>
          <p className="text-muted-foreground">Access your monthly Bible study outlines and session notes.</p>
        </div>

        {!selected ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s, i) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-all hover:shadow-md animate-fade-up ${s.is_locked ? "opacity-60" : ""}`}
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => !s.is_locked && setSelected(s)}
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-light text-sm font-bold text-gold">
                      {s.month}
                    </span>
                    {s.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-foreground">{s.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="animate-fade-up">
            <button
              className="mb-6 text-sm font-medium text-primary hover:underline"
              onClick={() => setSelected(null)}
            >
              ← Back to all months
            </button>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold-light text-lg font-bold text-gold">
                    {selected.month}
                  </span>
                  <CardTitle className="text-2xl">{selected.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selected.bible_study_content ? (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                      <BookOpen className="h-5 w-5 text-gold" /> Bible Study Outline
                    </h3>
                    <div className="whitespace-pre-wrap rounded-lg bg-secondary p-4 text-sm leading-relaxed text-foreground">
                      {selected.bible_study_content}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Bible study content coming soon.</p>
                )}
                {selected.breakout_notes && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                      Breakout Session Notes
                    </h3>
                    <div className="whitespace-pre-wrap rounded-lg bg-secondary p-4 text-sm leading-relaxed text-foreground">
                      {selected.breakout_notes}
                    </div>
                  </div>
                )}
                {selected.file_urls && selected.file_urls.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                      📎 Materials & Downloads
                    </h3>
                    <div className="space-y-2">
                      {selected.file_urls.map((url, i) => {
                        const fileName = decodeURIComponent(url.split("/").pop() ?? `File ${i + 1}`).replace(/^\d+-/, "");
                        return (
                          <a
                            key={i}
                            href={`${url}?download=`}
                            download={fileName}
                            className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-primary hover:bg-secondary transition-colors"
                          >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </span>
                            <span className="flex-1 truncate font-medium">{fileName}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">⬇ Download</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
