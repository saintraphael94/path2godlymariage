import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, BookOpen, FileText, Users, FileText as FileIcon, Headphones, Video, Link as LinkIcon } from "lucide-react";
import { fileNameFromMaterial, getMaterialSignedUrl } from "@/lib/materials";

interface Session {
  id: string;
  month: number;
  title: string;
  bible_study_content: string | null;
  breakout_notes: string | null;
  file_urls: string[] | null;
  is_locked: boolean;
}

type MaterialType = "pdf" | "audio" | "video" | "link";
interface Material {
  id: string;
  title: string;
  url: string;
  type: MaterialType;
  session_month: number;
  description: string | null;
}

export default function Learning() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    supabase
      .from("sessions")
      .select("*")
      .order("month")
      .then(({ data }) => setSessions((data as Session[]) ?? []));
    supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setMaterials((data as Material[]) ?? []));
  }, []);

  const hasContent = (s: Session, type: string) => {
    if (type === "bible") return !!s.bible_study_content;
    if (type === "breakout") return !!s.breakout_notes;
    if (type === "files") return (s.file_urls && s.file_urls.length > 0) || materials.some(m => m.session_month === s.month);
    return false;
  };

  const iconFor = (t: MaterialType) => {
    if (t === "pdf") return <FileIcon className="h-4 w-4" />;
    if (t === "audio") return <Headphones className="h-4 w-4" />;
    if (t === "video") return <Video className="h-4 w-4" />;
    return <LinkIcon className="h-4 w-4" />;
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="mb-2 text-3xl text-foreground">Learning Materials</h1>
          <p className="text-muted-foreground">Access your monthly Bible study outlines, session notes, and downloadable materials.</p>
        </div>

        {!selected ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s, i) => (
              <Card
                key={s.id}
                className="cursor-pointer transition-all hover:shadow-md animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => setSelected(s)}
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-light text-sm font-bold text-gold">
                      {s.month}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-foreground">{s.title}</h3>
                  <div className="mt-2 flex gap-1.5">
                    {hasContent(s, "bible") && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Bible Study</span>
                    )}
                    {hasContent(s, "breakout") && (
                      <span className="rounded bg-accent/50 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">Notes</span>
                    )}
                    {hasContent(s, "files") && (
                      <span className="rounded bg-gold-light px-1.5 py-0.5 text-[10px] font-medium text-gold">Files</span>
                    )}
                  </div>
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
              <CardContent>
                <Tabs defaultValue="bible-study">
                  <TabsList className="mb-4 w-full justify-start">
                    <TabsTrigger value="bible-study" className="gap-1.5">
                      <BookOpen className="h-4 w-4" /> Bible Study
                    </TabsTrigger>
                    <TabsTrigger value="breakout-notes" className="gap-1.5">
                      <Users className="h-4 w-4" /> Session Notes
                    </TabsTrigger>
                    <TabsTrigger value="downloads" className="gap-1.5">
                      <FileText className="h-4 w-4" /> Downloads
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bible-study">
                    {selected.bible_study_content ? (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                          Bible Study Outline
                        </h3>
                        <div className="whitespace-pre-wrap rounded-lg bg-secondary p-4 text-sm leading-relaxed text-foreground">
                          {selected.bible_study_content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground italic">Bible study content coming soon.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="breakout-notes">
                    {selected.breakout_notes ? (
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                          Breakout Session Notes
                        </h3>
                        <div className="whitespace-pre-wrap rounded-lg bg-secondary p-4 text-sm leading-relaxed text-foreground">
                          {selected.breakout_notes}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground italic">Session notes coming soon.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="downloads">
                    {((selected.file_urls && selected.file_urls.length > 0) || materials.some(m => m.session_month === selected.month)) ? (
                      <div className="space-y-4">
                        <h3 className="mb-3 text-lg font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                          Downloadable Materials
                        </h3>
                        <div className="space-y-2">
                          {materials.filter(m => m.session_month === selected.month).map(m => (
                            <a
                              key={m.id}
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-primary hover:bg-secondary transition-colors"
                            >
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                {iconFor(m.type)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold uppercase text-foreground">{m.title}</span>
                                {m.description && (
                                  <span className="block truncate text-xs text-muted-foreground">{m.description}</span>
                                )}
                              </span>
                              <span className="shrink-0 text-xs uppercase text-muted-foreground">{m.type}</span>
                            </a>
                          ))}
                          {(selected.file_urls ?? []).map((url, i) => {
                            const fileName = fileNameFromMaterial(url);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={async () => {
                                  const signed = await getMaterialSignedUrl(url);
                                  if (signed) window.open(signed, "_blank", "noopener,noreferrer");
                                }}
                                className="flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm text-primary hover:bg-secondary transition-colors"
                              >
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </span>
                                <span className="flex-1 truncate font-medium">{fileName}</span>
                                <span className="shrink-0 text-xs text-muted-foreground">⬇ Download</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground italic">No downloadable materials yet.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
