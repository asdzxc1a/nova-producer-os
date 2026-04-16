import { useEffect, useState, useRef } from "react";
import {
  Zap,
  Film,
  Brain,
  Globe,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Play,
  ChevronRight,
  Star,
} from "lucide-react";

interface Props {
  onEnter: () => void;
}

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
};

export default function LandingPage({ onEnter }: Props) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMouse({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const heroBg = {
    background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, rgba(6,182,212,0.12), transparent 40%), radial-gradient(ellipse at 0% 0%, #0f172a 0%, #020617 50%, #0a0f1d 100%)`,
  };

  const s1 = useReveal();
  const s2 = useReveal();
  const s3 = useReveal();
  const s4 = useReveal();
  const s5 = useReveal();

  return (
    <div className="min-h-full w-full bg-[#020617] text-slate-100 overflow-x-hidden">
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-10 pb-16"
        style={heroBg}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-[10%] top-[20%] h-40 w-40 rounded-full bg-cyan-500/10 blur-[100px]" />
          <div className="absolute right-[15%] top-[30%] h-56 w-56 rounded-full bg-violet-500/10 blur-[120px]" />
          <div className="absolute bottom-[20%] left-[30%] h-48 w-48 rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-sm animate-fadeIn">
            <Sparkles className="h-4 w-4" />
            <span>Powered by Gemini 2.5</span>
          </div>

          <h1 className="animate-fadeIn text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block text-slate-100">The Future of Film</span>
            <span className="gradient-text">Development.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl animate-fadeIn" style={{ animationDelay: "100ms" }}>
            Nova Producer OS is the AI-powered operating system that turns raw
            scripts into investor-ready packages. One decision. One platform.
            Infinite possibility.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fadeIn" style={{ animationDelay: "200ms" }}>
            <button
              onClick={onEnter}
              className="group relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:shadow-cyan-500/30"
            >
              <Play className="h-5 w-5 fill-current" />
              Enter Producer OS
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-sm text-slate-500">No credit card required</span>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Scripts Analyzed", value: "10,000+" },
              { label: "Avg. Time Saved", value: "40 hrs" },
              { label: "Stages Automated", value: "5" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5 text-center backdrop-blur-sm animate-fadeIn"
                style={{ animationDelay: `${300 + i * 80}ms` }}
              >
                <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative px-6 py-20" ref={s1.ref}>
        <div className="mx-auto max-w-6xl">
          <div
            className={`text-center transition-all duration-700 ${
              s1.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the <span className="gradient-text">decision makers.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Whether you are packaging an indie thriller or a studio blockbuster,
              the process is the same: move fast, think deep, and never miss a detail.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Film,
                title: "Indie Producers",
                desc: "Turn a single script into a full pitch deck, budget model, and festival strategy without hiring a 20-person team.",
              },
              {
                icon: TrendingUp,
                title: "Development Execs",
                desc: "Run Slate Analysis on 50 scripts a week. Let AI do the first pass so you only greenlight the winners.",
              },
              {
                icon: Globe,
                title: "Financiers",
                desc: "Get realistic budget oracles, risk assessments, and compliance scans before you write a single check.",
              },
              {
                icon: Brain,
                title: "Showrunners",
                desc: "Package seasons like films. Casting vision, location palettes, and visual thesis — all in one unified run.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`group rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 transition-all hover:border-cyan-500/30 hover:bg-slate-900/60 ${
                  s1.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why it is the best */}
      <section className="relative px-6 py-20" ref={s2.ref}>
        <div className="mx-auto max-w-6xl">
          <div
            className={`rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 sm:p-12 lg:p-16 transition-all duration-700 ${
              s2.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-950/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-300">
                  <Star className="h-3.5 w-3.5" />
                  The Competitive Edge
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Most films die in development. <br />
                  <span className="gradient-text">Yours won&apos;t.</span>
                </h2>
                <p className="mt-4 text-slate-400">
                  The average script spends 7 years in development hell. Not because
                  the idea is bad — but because the process is broken. Too many
                  meetings. Too many spreadsheets. Too many opinions.
                </p>
                <p className="mt-4 text-slate-400">
                  Nova Producer OS compresses months of packaging into minutes. It
                  does not replace your taste. It amplifies it. You make the call.
                  The system does the rest.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  "Slate-grade script analysis in under 60 seconds",
                  "Automated budget modeling with real-world benchmarks",
                  "Compliance scanning before legal ever sees it",
                  "Festival strategy generated by distribution-trained AI",
                  "One workspace. One truth. Zero chaos.",
                ].map((text, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 rounded-xl border border-slate-800/60 bg-slate-950/50 p-4 transition-all duration-500 ${
                      s2.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
                    }`}
                    style={{ transitionDelay: `${200 + i * 100}ms` }}
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-slate-200">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Pipeline */}
      <section className="relative px-6 py-20" ref={s3.ref}>
        <div className="mx-auto max-w-6xl">
          <div
            className={`text-center transition-all duration-700 ${
              s3.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The <span className="gradient-text">Five-Stage Engine</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Each stage deploys a team of specialist AI agents. They work in
              parallel. They synthesize. They deliver.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                step: "01",
                title: "Slate",
                desc: "Script Analyst + Budget Oracle evaluate your material. You get a go/no-go report with next steps.",
                color: "cyan",
              },
              {
                step: "02",
                title: "Package",
                desc: "Pre-Viz Director, Casting Scout, and Location Scout build a pitch deck that sells the vision.",
                color: "violet",
              },
              {
                step: "03",
                title: "Finance",
                desc: "Budget Oracle generates a structured financial model with burn rates, categories, and risk flags.",
                color: "emerald",
              },
              {
                step: "04",
                title: "Comply",
                desc: "Compliance Officer scans for EU AI Act exposure, union issues, and regulatory red flags.",
                color: "amber",
              },
              {
                step: "05",
                title: "Launch",
                desc: "Distribution Analyst maps festivals, platforms, and territories. Your project is market-ready.",
                color: "rose",
              },
              {
                step: "∞",
                title: "Synthesis",
                desc: "After every stage, a Synthesis Agent compiles parallel outputs into a single investor-grade artifact.",
                color: "slate",
              },
            ].map((item, i) => {
              const colorMap: Record<string, string> = {
                cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400",
                violet: "border-violet-500/20 bg-violet-500/5 text-violet-400",
                emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
                amber: "border-amber-500/20 bg-amber-500/5 text-amber-400",
                rose: "border-rose-500/20 bg-rose-500/5 text-rose-400",
                slate: "border-slate-500/20 bg-slate-500/5 text-slate-400",
              };
              return (
                <div
                  key={item.title}
                  className={`relative rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 transition-all hover:border-slate-700 ${
                    s3.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <span
                    className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${colorMap[item.color]}`}
                  >
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-slate-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social proof / Quote */}
      <section className="relative px-6 py-20" ref={s4.ref}>
        <div className="mx-auto max-w-4xl">
          <div
            className={`rounded-3xl border border-slate-800/60 bg-slate-900/40 p-8 text-center backdrop-blur-sm sm:p-12 transition-all duration-700 ${
              s4.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <blockquote className="text-xl font-medium leading-relaxed text-slate-200 sm:text-2xl">
              &ldquo;The gap between a great script and a greenlit project is not talent.
              It is friction. Nova Producer OS removes the friction.&rdquo;
            </blockquote>
            <div className="mt-6 text-sm text-slate-500">
              Built for producers who think in decades, not quarters.
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative px-6 py-20" ref={s5.ref}>
        <div className="mx-auto max-w-5xl">
          <div
            className={`relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-slate-900/80 p-10 text-center sm:p-16 transition-all duration-700 ${
              s5.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[100px]" />

            <h2 className="relative z-10 text-3xl font-bold tracking-tight sm:text-4xl">
              Your next film is waiting. <br />
              <span className="gradient-text">Stop waiting. Start producing.</span>
            </h2>
            <p className="relative z-10 mx-auto mt-4 max-w-xl text-slate-400">
              Every Oscar winner started as a decision. This is where yours gets made.
            </p>
            <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={onEnter}
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-8 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:shadow-cyan-500/30"
              >
                <Zap className="h-5 w-5 fill-current" />
                Launch Producer OS
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <p className="relative z-10 mt-4 text-xs text-slate-500">
              Free to use. Powered by Google Gemini 2.5.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-cyan-400" />
              <span className="font-bold tracking-tight text-slate-100">Nova Producer OS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>© 2026 Nova Producer OS</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Built for the future of film</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
