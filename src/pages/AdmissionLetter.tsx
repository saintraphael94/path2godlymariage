import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import logoAsset from "@/assets/luke117-logo.jpg.asset.json";
import signatureAsset from "@/assets/registrar-signature.jpg.asset.json";

export default function AdmissionLetter() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !profile) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </PageLayout>
    );
  }

  const handlePrint = () => window.print();

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div>
            <h1 className="mb-1 text-3xl text-foreground">Admission Letter</h1>
            <p className="text-sm text-muted-foreground">Print or save your official admission letter.</p>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Letter
          </Button>
        </div>

        <div
          id="admission-letter"
          className="mx-auto rounded-lg border bg-white p-10 text-[13.5px] leading-relaxed text-black shadow-sm print:rounded-none print:border-0 print:shadow-none print:p-8"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          <div className="mb-6 flex justify-center">
            <img src={logoAsset.url} alt="Luke One Seventeen Mission" className="h-24 object-contain" />
          </div>

          <div className="mb-6 flex items-start justify-between text-sm">
            <div>
              <p>13/June/2026</p>
              <p>Kaduna, Nigeria.</p>
            </div>
            <div className="text-right">
              <p>
                <span className="font-semibold">Admission No:</span>{" "}
                <span className="font-mono">{profile.registration_id}</span>
              </p>
            </div>
          </div>

          <p className="mb-4">Dear <span className="font-semibold underline">{profile.name}</span>,</p>

          <h2 className="mb-4 text-center text-lg font-bold tracking-wide">ADMISSION LETTER</h2>

          <p className="mb-4">
            Following your application and fulfillment of our enrollment requirements, I am pleased to convey a
            confirmation of admission to you into the <strong>Path to Godly Marriage (P2GM)</strong> Program.
          </p>

          <p className="mb-4">
            This is a 1 year program comprising 12 contacts. One contact per month on a Saturday from 9 AM to 6 PM.
            The designated Saturday will be communicated at the end of each contact.
          </p>

          <p className="mb-4">
            Your attendance and participation are compulsory for all the contacts. The focus of the program is to
            prepare singles for godly marriage. There will be no certificate issued at the end of the program; the
            certification for it is a transformed life.
          </p>

          <h3 className="mb-2 mt-5 font-bold">COMMUNICATION</h3>
          <p className="mb-4">
            Our communication with you will usually be by either email, SMS and/or WhatsApp. Please ensure to keep
            your email and phone number functional and accessible throughout the duration of the entire program. We
            encourage you to make a habit of checking your emails. Note that your email will be the only avenue for
            submitting your assignments and other engagements.
          </p>

          <h3 className="mb-2 mt-5 font-bold">ARRIVAL AND REGISTRATION</h3>
          <p className="mb-3">Information regarding your first contact is as follows:</p>
          <p className="mb-1"><strong>Venue:</strong> The Ten42 Training and Resource Center, No. 7, Sylvester Idakwo Street, Barnawa GRA, Kaduna, Nigeria</p>
          <p className="mb-1"><strong>Date:</strong> 13/June/2026</p>
          <p className="mb-3"><strong>Time:</strong> 9 AM to 6 PM</p>
          <p className="mb-4 italic">
            [Please note you will be required to arrive promptly on the start date of the contact. Registration starts
            at exactly 8 AM and ends at 10 AM. Please note that late coming is not tolerated].
          </p>

          <p className="mb-4">Please come along with your Bible (hard copy), pen and notebook.</p>

          <p className="mb-4">Kindly note that this is a closed meeting for only those who have been admitted.</p>

          <p className="mb-6">Accept our hearty congratulations.</p>

          <div className="mb-8">
            <img src={signatureAsset.url} alt="Signature" className="h-16 object-contain" />
            <p className="mt-1 font-semibold">Precious Mamman</p>
            <p className="text-sm">Registrar</p>
          </div>

          <div className="border-t pt-4 text-center text-xs italic">
            <p className="mb-1">"Making ready a people prepared for the Lord." Luke 1:17</p>
            <p className="not-italic">
              No 1/2, Egypt Road, Agric Quarters, Barnawa, Kaduna-Nigeria | +2347013444447 | lukeone17mission@gmail.com
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #admission-letter, #admission-letter * { visibility: visible; }
          #admission-letter { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </PageLayout>
  );
}