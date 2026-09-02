import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Users, BookOpen, CheckSquare, Download, Upload, FileText, Trash2, Loader2, Link as LinkIcon, Plus } from "lucide-react";
import { fileNameFromMaterial, getMaterialSignedUrl, toMaterialsPath } from "@/lib/materials";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  registration_id: string;
  status: string;
  batch_year: number;
}

interface SessionData {
  id: string;
  month: number;
  title: string;
  bible_study_content: string | null;
  breakout_notes: string | null;
  file_urls: string[] | null;
  is_locked: boolean;
}

interface AttendanceRow {
  id: string;
  marked_at: string;
  user_id: string;
  session_id: string;
  profiles: { name: string; registration_id: string } | null;
  sessions: { month: number; title: string } | null;
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

export default function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [editSession, setEditSession] = useState<SessionData | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(true);
  const [savingRegToggle, setSavingRegToggle] = useState(false);
  const [loginOpen, setLoginOpen] = useState<boolean>(true);
  const [savingLoginToggle, setSavingLoginToggle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matType, setMatType] = useState<MaterialType>("pdf");
  const [matMonth, setMatMonth] = useState<string>("1");
  const [matDesc, setMatDesc] = useState("");
  const [addingMat, setAddingMat] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchSessions();
      fetchAttendance();
      fetchRegistrationSetting();
      fetchLoginSetting();
      fetchMaterials();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as Profile[]) ?? []);
  };

  const fetchSessions = async () => {
    const { data } = await supabase.from("sessions").select("*").order("month");
    setSessions((data as SessionData[]) ?? []);
  };

  const fetchAttendance = async () => {
    const { data: attRows, error } = await supabase
      .from("attendance")
      .select("*")
      .order("marked_at", { ascending: false });
    if (error || !attRows) {
      setAttendance([]);
      return;
    }
    const userIds = Array.from(new Set(attRows.map((a: any) => a.user_id)));
    const sessionIds = Array.from(new Set(attRows.map((a: any) => a.session_id)));
    const [{ data: profs }, { data: sess }] = await Promise.all([
      supabase.from("profiles").select("user_id, name, registration_id").in("user_id", userIds),
      supabase.from("sessions").select("id, month, title").in("id", sessionIds),
    ]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    const sessMap = new Map((sess ?? []).map((s: any) => [s.id, s]));
    const merged = attRows.map((a: any) => ({
      ...a,
      profiles: profMap.get(a.user_id)
        ? { name: (profMap.get(a.user_id) as any).name, registration_id: (profMap.get(a.user_id) as any).registration_id }
        : null,
      sessions: sessMap.get(a.session_id)
        ? { month: (sessMap.get(a.session_id) as any).month, title: (sessMap.get(a.session_id) as any).title }
        : null,
    }));
    setAttendance(merged as AttendanceRow[]);
  };

  const fetchRegistrationSetting = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "registration_open")
      .maybeSingle();
    setRegistrationOpen(data?.value === true || data?.value === "true");
  };

  const fetchLoginSetting = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "login_open")
      .maybeSingle();
    setLoginOpen(data?.value === undefined ? true : data?.value === true || data?.value === "true");
  };

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("*").order("session_month").order("created_at", { ascending: false });
    setMaterials((data as Material[]) ?? []);
  };

  const addMaterial = async () => {
    if (!matTitle.trim() || !matUrl.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    const month = parseInt(matMonth);
    if (isNaN(month) || month < 1 || month > 12) {
      toast.error("Session number must be between 1 and 12");
      return;
    }
    setAddingMat(true);
    const { error } = await supabase.from("materials").insert({
      title: matTitle.trim(),
      url: matUrl.trim(),
      type: matType,
      session_month: month,
      description: matDesc.trim() || null,
      created_by: user?.id ?? null,
    });
    setAddingMat(false);
    if (error) {
      toast.error("Failed to add material: " + error.message);
      return;
    }
    toast.success("Material added");
    setMatTitle(""); setMatUrl(""); setMatDesc("");
    fetchMaterials();
  };

  const deleteMaterial = async (id: string) => {
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Material removed");
      fetchMaterials();
    }
  };

  const toggleRegistration = async (open: boolean) => {
    setSavingRegToggle(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "registration_open", value: open as unknown as any }, { onConflict: "key" });
    setSavingRegToggle(false);
    if (error) {
      toast.error("Failed to update registration status");
    } else {
      setRegistrationOpen(open);
      toast.success(open ? "Registration is now open" : "Registration is now closed");
    }
  };

  const updateUserStatus = async (userId: string, status: "active" | "completed") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
    if (error) toast.error("Failed to update status");
    else {
      toast.success("Status updated");
      fetchUsers();
    }
  };

  const uploadFile = async (file: File) => {
    if (!editSession) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploading(true);
    const filePath = `month-${editSession.month}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("materials").upload(filePath, file);
    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }
    // Store the storage path; we generate short-lived signed URLs on demand
    const newUrls = [...(editSession.file_urls ?? []), filePath];
    // Auto-save file_urls to database immediately
    const { error: saveError } = await supabase.from("sessions").update({ file_urls: newUrls }).eq("id", editSession.id);
    if (saveError) {
      toast.error("Failed to save file URL");
    } else {
      setEditSession({ ...editSession, file_urls: newUrls });
      fetchSessions();
      toast.success("File uploaded and saved");
    }
    setUploading(false);
  };

  const removeFile = async (index: number) => {
    if (!editSession?.file_urls) return;
    const path = toMaterialsPath(editSession.file_urls[index]);
    if (path) {
      await supabase.storage.from("materials").remove([path]);
    }
    const newUrls = editSession.file_urls.filter((_, i) => i !== index);
    // Auto-save file_urls to database immediately
    const { error: saveError } = await supabase.from("sessions").update({ file_urls: newUrls }).eq("id", editSession.id);
    if (saveError) {
      toast.error("Failed to update files");
    } else {
      setEditSession({ ...editSession, file_urls: newUrls });
      fetchSessions();
      toast.success("File removed");
    }
  };

  const saveSession = async () => {
    if (!editSession) return;
    const { error } = await supabase.from("sessions").update({
      bible_study_content: editSession.bible_study_content,
      breakout_notes: editSession.breakout_notes,
      is_locked: editSession.is_locked,
      file_urls: editSession.file_urls,
    }).eq("id", editSession.id);
    if (error) toast.error("Failed to save");
    else {
      toast.success("Session updated");
      setEditSession(null);
      fetchSessions();
    }
  };

  const exportCSV = () => {
    const filtered = filterMonth === "all" ? attendance : attendance.filter(a => a.sessions?.month === parseInt(filterMonth));
    const csv = [
      "Name,Registration ID,Month,Session,Date",
      ...filtered.map(a =>
        `"${a.profiles?.name ?? ""}","${a.profiles?.registration_id ?? ""}",${a.sessions?.month ?? ""},"${a.sessions?.title ?? ""}","${new Date(a.marked_at).toLocaleDateString()}"`
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance_report.csv";
    link.click();
  };

  if (loading) return <PageLayout><div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></PageLayout>;

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="mb-2 text-3xl text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage students, content, and attendance records.</p>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Students</TabsTrigger>
            <TabsTrigger value="content"><BookOpen className="mr-2 h-4 w-4" /> Content</TabsTrigger>
            <TabsTrigger value="attendance"><CheckSquare className="mr-2 h-4 w-4" /> Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="animate-fade-up">
            <Card className="mb-4">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-semibold text-foreground">Registration {registrationOpen ? "Open" : "Closed"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {registrationOpen
                      ? "New students can currently sign up for the program."
                      : "New sign-ups are blocked. Existing students are unaffected."}
                  </p>
                </div>
                <Switch
                  checked={registrationOpen}
                  disabled={savingRegToggle}
                  onCheckedChange={toggleRegistration}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>All Students ({users.length})</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Reg. ID</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="font-mono text-xs">{u.registration_id}</TableCell>
                        <TableCell>{u.batch_year}/{String(u.batch_year + 1).slice(-2)}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "active" ? "bg-green-100 text-green-800" : "bg-gold-light text-gold"}`}>
                            {u.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select value={u.status} onValueChange={v => updateUserStatus(u.user_id, v as "active" | "completed")}>
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="animate-fade-up">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Add External Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
                    <Input value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="e.g. Culture of Shame" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">URL</label>
                    <Input value={matUrl} onChange={e => setMatUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
                    <Select value={matType} onValueChange={v => setMatType(v as MaterialType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Session Number (1–12)</label>
                    <Select value={matMonth} onValueChange={setMatMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>Session {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Description (optional)</label>
                  <Input value={matDesc} onChange={e => setMatDesc(e.target.value)} placeholder="Short description" />
                </div>
                <Button onClick={addMaterial} disabled={addingMat}>
                  {addingMat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Material
                </Button>
                {materials.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {materials.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-foreground">{m.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {m.type.toUpperCase()} · Session {m.session_month} · {m.url}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMaterial(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {editSession ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Month {editSession.month}: {editSession.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Bible Study Content</label>
                    <Textarea
                      rows={8}
                      value={editSession.bible_study_content ?? ""}
                      onChange={e => setEditSession({ ...editSession, bible_study_content: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Breakout Session Notes</label>
                    <Textarea
                      rows={6}
                      value={editSession.breakout_notes ?? ""}
                      onChange={e => setEditSession({ ...editSession, breakout_notes: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">PDF Materials</label>
                    <div className="space-y-2">
                      {editSession.file_urls?.map((url, i) => {
                        const fileName = fileNameFromMaterial(url);
                        return (
                          <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <button
                              type="button"
                              onClick={async () => {
                                const signed = await getMaterialSignedUrl(url);
                                if (signed) window.open(signed, "_blank", "noopener,noreferrer");
                                else toast.error("Could not open file");
                              }}
                              className="flex-1 truncate text-left text-sm text-primary hover:underline"
                            >
                              {fileName}
                            </button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFile(i)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) uploadFile(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {uploading ? "Uploading…" : "Upload PDF"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="locked"
                      checked={editSession.is_locked}
                      onChange={e => setEditSession({ ...editSession, is_locked: e.target.checked })}
                    />
                    <label htmlFor="locked" className="text-sm">Lock this month</label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveSession}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setEditSession(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map(s => (
                  <Card key={s.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setEditSession(s)}>
                    <CardContent className="p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-light text-xs font-bold text-gold">{s.month}</span>
                        {s.is_locked && <span className="text-xs text-muted-foreground">🔒</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.bible_study_content ? "Has content" : "No content yet"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attendance" className="animate-fade-up">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle>Attendance Records</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue placeholder="Filter month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>Month {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={exportCSV}>
                      <Download className="mr-1 h-4 w-4" /> Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Reg. ID</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filterMonth === "all" ? attendance : attendance.filter(a => a.sessions?.month === parseInt(filterMonth))).map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.profiles?.name}</TableCell>
                        <TableCell className="font-mono text-xs">{a.profiles?.registration_id}</TableCell>
                        <TableCell>{a.sessions?.month}</TableCell>
                        <TableCell className="text-sm">{a.sessions?.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(a.marked_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                    {attendance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No attendance records yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
