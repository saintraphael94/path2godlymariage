import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, CheckCircle, XCircle } from "lucide-react";

interface VerifyResult {
  name: string;
  status: string;
  batch_year: number;
}

export default function Verify() {
  const [regId, setRegId] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regId.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);

    const { data, error } = await supabase.functions.invoke("verify-registration", {
      body: { registration_id: regId.trim().toUpperCase() },
    });

    setLoading(false);
    if (!error && data?.result) {
      setResult(data.result as VerifyResult);
    } else {
      setNotFound(true);
    }
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="mb-8 text-center animate-fade-up">
          <h1 className="mb-2 text-3xl text-foreground">Verify a Participant</h1>
          <p className="text-muted-foreground">
            Enter a Registration ID to verify enrollment in the P2GM program.
          </p>
        </div>

        <form onSubmit={handleVerify} className="mb-6 flex gap-2 animate-fade-up delay-100">
          <Input
            placeholder="P2GM/2627/00001"
            value={regId}
            onChange={(e) => setRegId(e.target.value)}
            className="font-mono"
          />
          <Button type="submit" disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Checking…" : "Verify"}
          </Button>
        </form>

        {result && (
          <Card className="animate-fade-up border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-600" />
              <h2 className="mb-1 text-xl font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {result.name}
              </h2>
              <p className="mb-2 text-sm text-muted-foreground">Batch {result.batch_year}/{String(result.batch_year + 1).slice(-2)}</p>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${result.status === "active" ? "bg-green-100 text-green-800" : "bg-gold-light text-gold"}`}>
                {result.status === "active" ? "Active" : "Completed"}
              </span>
            </CardContent>
          </Card>
        )}

        {notFound && (
          <Card className="animate-fade-up border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <XCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
              <h2 className="text-lg font-semibold text-foreground">Not Found</h2>
              <p className="text-sm text-muted-foreground">No participant found with this Registration ID.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
