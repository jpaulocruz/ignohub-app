"use client";

import { Shield, Zap, CreditCard, ArrowRight, MessageSquare, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { IgnoHubLogo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-brand-500/10 transition-colors duration-500">
      {/* Background Blueprint */}
      <div className="fixed inset-0 data-blueprint opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-slate-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Navbar (Landing) */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-start">
        <div className="w-full max-w-7xl px-8 py-4 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <IgnoHubLogo className="scale-110 mr-1" />
            <span className="font-bold text-2xl tracking-tight text-foreground lowercase">ignohub</span>
          </div>
          <div className="hidden md:flex items-center gap-12">
            <Link href="#features" className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-foreground transition-all">Sistemas</Link>
            <Link href="#solutions" className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 hover:text-foreground transition-all">Soberania</Link>
            <Link href="/login" className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground border-l border-border pl-12 h-4 items-center flex">Entrar</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10 pt-32 lg:pt-56 pb-48">
        {/* Massive Asymmetric Hero */}
        <section className="px-12 space-y-32 max-w-[1440px] mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col lg:flex-row gap-32 items-start"
          >
            <div className="flex-1 space-y-16">
              <div className="inline-flex items-center gap-4 px-5 py-2 border border-brand-500/20 bg-brand-500/5 rounded-none">
                <Zap className="w-4 h-4 text-brand-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-500">Neural Core v4.9 OPERATIONAL</span>
              </div>

              <h1 className="text-[14vw] md:text-[11rem] font-black text-white leading-[0.8] tracking-[-0.06em] uppercase">
                Sovereign<br />
                <span className="text-transparent stroke-text" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.1)' }}>Intelligence</span>
              </h1>

              <div className="flex flex-col md:flex-row gap-16 items-start">
                <p className="text-xl text-secondary-gray-500 font-medium leading-relaxed max-w-lg border-l-2 border-brand-500/40 pl-10 italic">
                  Advanced psychometric mapping and real-time behavioral ingestion. IgnoHub delivers the infrastructure for absolute digital sovereignty.
                </p>

                <div className="flex flex-col gap-8 pt-4">
                  <Link
                    href="/login"
                    className="group flex items-center justify-between gap-12 bg-white text-navy-950 font-black py-6 px-12 rounded-none transition-all hover:bg-brand-500 hover:text-white active:scale-95 text-[11px] uppercase tracking-[0.4em] w-fit shadow-2xl shadow-white/5"
                  >
                    Authenticate Unit
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <Link href="/signup" className="text-[10px] font-black text-secondary-gray-600 hover:text-white transition-colors uppercase tracking-[0.3em] underline underline-offset-[12px] decoration-white/10 hover:decoration-white/30">
                    Request Access Protocols
                  </Link>
                </div>
              </div>
            </div>

            {/* Blueprint Technical Sidebox */}
            <div className="hidden xl:flex w-96 h-[800px] border border-white/5 relative overflow-hidden bg-navy-950/20 flex-col items-center justify-between py-16 data-blueprint opacity-60 shrink-0">
              <div className="absolute top-0 w-full h-1 bg-brand-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              <div className="text-[10px] font-black uppercase tracking-[0.8em] text-secondary-gray-700 [writing-mode:vertical-rl] rotate-180 opacity-40">SYSTEM_MANIFEST_V4.9</div>
              <Users className="w-12 h-12 text-brand-500/40" />
              <div className="space-y-4 text-center px-12">
                <div className="h-0.5 w-12 bg-white/10 mx-auto" />
                <p className="text-[10px] font-black text-secondary-gray-600 uppercase tracking-widest leading-loose">
                  CRYPTOGRAPHIC ISOLATION<br />
                  BEHAVIORAL MAPPING<br />
                  SOVEREIGN DELIVERY
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Technical Blueprint Feature Matrix */}
        <section id="features" className="px-12 py-72 border-y border-white/5 relative overflow-hidden bg-navy-950/10">
          <div className="absolute inset-0 data-blueprint opacity-[0.03] pointer-events-none" />
          <div className="max-w-[1440px] mx-auto space-y-48 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-end">
              <div className="space-y-12">
                <h2 className="text-[11px] font-black text-brand-500 uppercase tracking-[0.8em] flex items-center gap-4">
                  <div className="h-0.5 w-8 bg-brand-500" /> Operational Matrix
                </h2>
                <p className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-[0.85] uppercase">
                  Protocol <br />
                  Hierarchy.
                </p>
              </div>
              <p className="text-lg text-secondary-gray-500 font-medium max-w-md pb-4 uppercase tracking-[0.1em] leading-relaxed">
                Modular ingestion cores and neural processing units designed for high-tension data operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0.5 bg-white/5 border border-white/5">
              {[
                { icon: Shield, title: 'Inherent Isolation', desc: 'Hardware-grade tenant isolation with cryptographic cross-unit verification.' },
                { icon: BarChart3, title: 'Neural Psychometrics', desc: 'Predictive behavioral mapping extracted from multi-channel ingestion streams.' },
                { icon: Zap, title: 'Impulse Response', desc: 'Zero-latency alert propagation via sovereign delivery nodes.' },
                { icon: Users, title: 'Unit Hierarchy', desc: 'Recursive organization management with granular scope authorization.' },
                { icon: MessageSquare, title: 'Unified Command', desc: 'Synchronized operational nexus for all behavioral telemetry.' },
                { icon: CreditCard, title: 'Resource Minting', desc: 'Algorithmic resource allocation and simplified emission reconciliation.' }
              ].map((feature, idx) => (
                <PremiumCard key={feature.title} className={cn(
                  "p-20 border-none bg-navy-950/40 hover:bg-white/5 transition-all group",
                  idx === 1 ? "md:translate-y-12" : "",
                  idx === 4 ? "md:-translate-y-12" : ""
                )}>
                  <div className="w-14 h-14 rounded-none bg-brand-500/10 flex items-center justify-center mb-12 border border-brand-500/20">
                    <feature.icon className="w-6 h-6 text-brand-500" />
                  </div>
                  <h3 className="text-[13px] font-black text-white uppercase tracking-[0.2em] mb-6">{feature.title}</h3>
                  <p className="text-[11px] text-secondary-gray-500 leading-loose uppercase font-bold tracking-widest">{feature.desc}</p>
                </PremiumCard>
              ))}
            </div>
          </div>
        </section>

        {/* Global Deployment CTA */}
        <section className="px-12 py-72">
          <div className="max-w-[1440px] mx-auto bg-white p-24 md:p-48 relative overflow-hidden rounded-none">
            <div className="absolute inset-0 data-blueprint opacity-[0.08] pointer-events-none" />

            <div className="relative z-10 space-y-16">
              <h2 className="text-[10vw] font-black text-navy-950 tracking-[-0.05em] leading-[0.8] uppercase">
                Initialize <br />
                <span className="text-brand-600">Sovereignty.</span>
              </h2>
              <div className="flex flex-col md:flex-row gap-20 items-end justify-between">
                <p className="text-navy-900/60 text-2xl font-medium max-w-xl border-l-4 border-brand-600 pl-12 lowercase first-letter:uppercase italic">
                  Integrate your organization into the next generation of social intelligence. Absolute control starts here.
                </p>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-12 bg-navy-950 text-white font-black py-8 px-20 rounded-none transition-all hover:bg-brand-600 active:scale-95 text-[12px] uppercase tracking-[0.5em] shadow-2xl"
                >
                  Deploy Node
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-4 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-12 py-32 border-t border-border bg-slate-50/30 dark:bg-slate-900/30 text-center space-y-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 opacity-70">
          <Link href="#" className="text-[9px] font-black uppercase text-slate-500 hover:text-foreground tracking-[0.3em] transition-all">Politica de Privacidade</Link>
          <Link href="#" className="text-[9px] font-black uppercase text-slate-500 hover:text-foreground tracking-[0.3em] transition-all">Termos de Uso</Link>
          <Link href="#" className="text-[9px] font-black uppercase text-slate-500 hover:text-foreground tracking-[0.3em] transition-all">Contato</Link>
        </div>
        <div className="flex flex-col items-center gap-8">
          <div className="h-10 w-10 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Shield className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.5em]">
            © 2026 IGNO-SYSTEMS OPERATIONAL &bull; BRAZIL
          </p>
        </div>
      </footer>
    </div>
  );
}
