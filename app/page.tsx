"use client";

import { Shield, Zap, CreditCard, Settings, ArrowRight, CheckCircle2, Globe, MessageSquare, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";

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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col min-h-screen bg-navy-900 selection:bg-brand-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-brand-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] bg-navy-800/50 blur-[120px] rounded-full" />
      </div>

      {/* Navbar (Landing) */}
      <nav className="fixed top-0 w-full z-50 p-6 flex justify-center">
        <div className="w-full max-w-6xl glass-card px-8 py-4 rounded-[24px] flex items-center justify-between border border-white/5 shadow-navbar">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Shield className="text-white h-5 w-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tighter text-white">IgnoHub</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-xs font-black uppercase tracking-widest text-secondary-gray-500 hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="#solutions" className="text-xs font-black uppercase tracking-widest text-secondary-gray-500 hover:text-white transition-colors">Soluções</Link>
            <Link href="/login" className="text-xs font-black uppercase tracking-widest text-brand-500 hover:text-brand-400 transition-colors">Entrar</Link>
            <Link
              href="/signup"
              className="bg-brand-500 hover:bg-brand-600 text-white font-black py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-brand-500/20 text-[10px] uppercase tracking-widest"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10 pt-32 lg:pt-48">
        {/* Hero Section */}
        <section className="px-6 pb-24 text-center space-y-12 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 max-w-5xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-800 border border-white/5 shadow-inner">
              <Zap className="w-4 h-4 text-brand-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-gray-500">Inteligência Artificial de Ponta</span>
            </div>

            <h1 className="text-[14vw] md:text-[8rem] font-black text-white leading-[0.85] tracking-tighter">
              DADOS QUE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">DOMINAM.</span>
            </h1>

            <p className="text-lg md:text-2xl text-secondary-gray-500 font-medium leading-relaxed max-w-3xl mx-auto">
              A plataforma de monitoramento definitiva para líderes que exigem visão clara e
              decisões baseadas em dados em tempo real.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 text-white font-black py-5 px-12 rounded-[24px] transition-all shadow-2xl shadow-brand-500/40 text-xl group active:scale-95"
              >
                ACESSAR SISTEMA
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto text-secondary-gray-500 hover:text-white font-bold py-5 px-10 transition-all text-xl"
              >
                Experimentar Grátis
              </Link>
            </div>
          </motion.div>

          {/* Social Proof / Trusted by */}
          <div className="pt-20 opacity-40">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary-gray-600 mb-8">Tecnologias Integradas</p>
            <div className="flex flex-wrap justify-center gap-12 font-black text-2xl text-secondary-gray-700">
              <span className="tracking-tighter italic">OPENAI</span>
              <span className="tracking-tighter">STRIPE</span>
              <span className="tracking-tighter underline underline-offset-8">SUPABASE</span>
              <span className="tracking-tighter border-x border-white/5 px-6">AGNO.AI</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="px-6 py-32 bg-navy-900/50">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
              <h2 className="text-xs font-black text-brand-500 uppercase tracking-[0.3em]">Nossa Estrutura</h2>
              <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">Arquitetura de Alta Performance</p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                { icon: Shield, title: 'Segurança Militar', desc: 'Isolamento completo de dados por organização com criptografia de ponta a ponta.' },
                { icon: BarChart3, title: 'Análise de Sentimento', desc: 'Sua comunidade em números. Saiba exatamente como seu público está se sentindo.' },
                { icon: Zap, title: 'Alertas Instantâneos', desc: 'Receba notificações em tempo real quando riscos ou oportunidades forem detectados.' },
                { icon: Users, title: 'Multi-Tenant', desc: 'Gestão granular de acessos e permissões para equipes de qualquer tamanho.' },
                { icon: MessageSquare, title: 'Inbox Unificado', desc: 'Centralize todas as comunicações e insights em um único lugar.' },
                { icon: CreditCard, title: 'Faturamento Ágil', desc: 'Gestão simplificada de assinaturas e faturas integrada ao Stripe.' }
              ].map((feature, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <PremiumCard className="p-10 transition-all hover:-translate-y-2 border border-white/5 group h-full">
                    <div className="w-16 h-16 rounded-3xl bg-navy-900 flex items-center justify-center group-hover:bg-brand-500 transition-all duration-500 shadow-inner mb-8">
                      <feature.icon className="w-8 h-8 text-brand-500 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight mb-4">{feature.title}</h3>
                    <p className="text-lg text-secondary-gray-500 leading-relaxed font-medium">{feature.desc}</p>
                  </PremiumCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="px-6 py-32">
          <div className="max-w-6xl mx-auto bg-brand-500 rounded-[50px] p-12 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-brand-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy-900/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-none">
                TOME O CONTROLE <br /> DA SUA COMUNIDADE.
              </h2>
              <p className="text-white/80 text-xl md:text-2xl font-bold max-w-2xl mx-auto">
                Junte-se a centenas de organizações que utilizam o IgnoHub para escalar inteligência social.
              </p>
              <div className="pt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-3 bg-white text-brand-500 font-black py-6 px-16 rounded-[24px] transition-all hover:scale-105 active:scale-95 text-2xl shadow-xl shadow-brand-900/10"
                >
                  CRIAR CONTA GRÁTIS
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-10 py-20 border-t border-white/5 text-center space-y-10">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 opacity-50">
          <Link href="#" className="text-xs font-black uppercase text-secondary-gray-500 hover:text-white tracking-widest transition-colors">Politica de Privacidade</Link>
          <Link href="#" className="text-xs font-black uppercase text-secondary-gray-500 hover:text-white tracking-widest transition-colors">Termos de Uso</Link>
          <Link href="#" className="text-xs font-black uppercase text-secondary-gray-500 hover:text-white tracking-widest transition-colors">Contato</Link>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white/40" />
          </div>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em]">
            © 2026 IGNO-SYSTEMS OPERATIONAL &bull; BRAZIL
          </p>
        </div>
      </footer>
    </div>
  );
}
