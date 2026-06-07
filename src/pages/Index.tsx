import { PageLayout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Presentation, HeartHandshake, GraduationCap, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const features = [
  {
    icon: BookOpen,
    title: "12 Contacts",
    desc: "Structured monthly sessions and activities aimed at building a godly marriage.",
  },
  {
    icon: Users,
    title: "Practical Life Sessions",
    desc: "Bible Study, Professional and breakout sessions designed for group engagements.",
  },
  {
    icon: CheckCircle,
    title: "Like Minds",
    desc: "People desiring God and a godly marriage that fulfils God's purpose.",
  },
  {
    icon: Search,
    title: "Biblical Discipleship",
    desc: "One-on-One Training and examples of Christian marriages to relate with.",
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-forest px-4 py-24 md:py-32">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-gold animate-fade-up">
            Biblical · Marriage · Discipleship
          </p>
          <h1 className="mb-6 text-4xl leading-tight md:text-6xl md:leading-[1.1] text-primary-foreground animate-fade-up delay-100">
            Path to Godly Marriage
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-sage animate-fade-up delay-200">
            A 12 months program preparing Christian Singles for a godly marriage according to Biblical principles
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-up delay-300">
            <Button
              size="lg"
              className="bg-gold text-foreground hover:bg-gold/90 active:scale-[0.97] transition-all"
              onClick={() => navigate("/register")}
            >
              Register Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="lg"
                className="border-sage/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/verify")}
              >
                Verify a Participant
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center animate-fade-up">
            <h2 className="mb-3 text-3xl text-foreground md:text-4xl">Your 12 Months journey</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              What the program is made up of
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg animate-fade-up"
                style={{ animationDelay: `${150 + i * 80}ms` }}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold-light">
                  <f.icon className="h-5 w-5 text-gold" />
                </div>
                <h3 className="mb-2 text-xl text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary px-4 py-20 animate-fade-up">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl text-foreground">Ready to Start?</h2>
          <p className="mb-8 text-muted-foreground">
            Join thousands of participants who are investing in their future marriages through God's Word.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/register")}
            className="active:scale-[0.97] transition-transform"
          >
            Register Now
          </Button>
        </div>
      </section>
    </PageLayout>
  );
}
