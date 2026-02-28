"use client";

import { motion } from "framer-motion";
import { IgnoHubLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    BarChart3,
    MessageSquare,
    Users,
    Zap,
    Shield,
    TrendingUp,
    BrainCircuit,
    Microscope,
    Target,
    Activity,
    Check,
    Cpu,
    Network,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SectionHeader = ({ badge, title, subtitle, light = false }: { badge: string, title: string, subtitle?: string, light?: boolean }) => (
    <div className="flex flex-col items-center text-center space-y-4 mb-20">
        <div className={cn(
            "px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest leading-none",
            light
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-primary/10 border-primary/20 text-primary"
        )}>
            {badge}
        </div>
        <h2 className={cn(
            "text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl",
            light ? "text-white" : "text-slate-900"
        )}>
            {title}
        </h2>
        {subtitle && (
            <p className={cn(
                "text-lg md:text-xl max-w-2xl font-semibold leading-relaxed",
                light ? "text-slate-400" : "text-slate-600"
            )}>
                {subtitle}
            </p>
        )}
    </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div
        whileHover={{ y: -8 }}
        className="p-10 rounded-[40px] bg-card border border-border/50 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all group relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Icon className="w-24 h-24" />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6">
            <Icon className="w-7 h-7 text-primary group-hover:text-white" />
        </div>
        <h3 className="text-2xl font-bold mb-4 tracking-tight text-slate-900">{title}</h3>
        <p className="text-slate-600 leading-relaxed font-semibold text-lg">{description}</p>
    </motion.div>
);

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="relative p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
        <div className="text-6xl font-black text-primary/20 absolute -top-4 -left-2 select-none group-hover:text-primary/40 transition-colors">
            {number}
        </div>
        <div className="relative z-10 space-y-3 pt-4">
            <h4 className="text-xl font-bold text-white">{title}</h4>
            <p className="text-slate-400 font-medium leading-relaxed">{description}</p>
        </div>
    </div>
);

const DashboardMockup = () => (
    <div className="relative w-full max-w-6xl mx-auto rounded-[40px] border border-border/50 shadow-2xl overflow-hidden bg-[#020817] group">
        {/* Browser Header */}
        <div className="h-12 border-b border-border/30 bg-[#0a101f] flex items-center justify-between px-6">
            <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Activity className="w-3 h-3 text-primary animate-pulse" />
                Live Analysis System
            </div>
        </div>

        {/* Fake UI Content */}
        <div className="p-8 md:p-14 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Strategic Insight</span>
                    </div>
                    <div className="h-10 w-80 bg-white/10 rounded-2xl" />
                </div>
                <div className="flex gap-4">
                    <div className="h-12 w-40 bg-primary/20 border border-primary/30 rounded-2xl" />
                    <div className="h-12 w-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Community Health", value: "88/100", trend: "+12%" },
                    { label: "Active Nodes", value: "1.2k", trend: "+5.4%" },
                    { label: "Sentiment Index", value: "Highly Positive", trend: "Stable" }
                ].map((stat, i) => (
                    <div key={i} className="rounded-[32px] bg-white/5 border border-white/10 p-8 space-y-6 hover:bg-white/[0.07] transition-colors">
                        <div className="flex justify-between items-center">
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                            <div className="text-[10px] font-black text-green-500 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">{stat.trend}</div>
                        </div>
                        <div className="text-4xl font-black text-white">{stat.value}</div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "70%" }}
                                transition={{ duration: 1, delay: i * 0.2 }}
                                className="h-full bg-primary/60"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="rounded-[32px] bg-white/5 border border-white/10 p-10 flex flex-col justify-between min-h-[300px]">
                    <div className="space-y-3">
                        <div className="text-lg font-bold text-white tracking-tight leading-none">Crescimento Orgânico</div>
                        <div className="text-sm text-slate-500 font-medium pb-4">Detecção de sinais emergentes</div>
                    </div>
                    <div className="flex items-end gap-3 h-40">
                        {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t-xl"
                            />
                        ))}
                    </div>
                </div>
                <div className="rounded-[32px] bg-white/5 border border-white/10 p-10 space-y-8">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center">
                            <BrainCircuit className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-lg font-bold text-white">IA do IgnoHub</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Consultor Estratégico</div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-300 font-medium leading-relaxed italic">
                            "A comunidade está pedindo por Gestão de Tempo. 15% dos membros mencionaram isso organicamente hoje."
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="px-4 py-1.5 rounded-full bg-green-500/10 text-[10px] font-black text-green-500 border border-green-500/20 uppercase tracking-tighter">Signal Detected</div>
                            <div className="px-4 py-1.5 rounded-full bg-primary/10 text-[10px] font-black text-primary border border-primary/20 uppercase tracking-tighter">Conversion Alert</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <div className="h-[400px] w-[400px] rounded-full bg-primary/30 blur-[120px] animate-pulse" />
        </div>
    </div>
);

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFF] text-[#0F172A] selection:bg-primary/10 font-sans">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center group cursor-pointer">
                        <IgnoHubLogo className="h-10 w-auto" />
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {["Funcionalidades", "Análise", "Como Funciona"].map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase().replace(" ", "-")}`}
                                className="text-sm font-bold text-slate-500 hover:text-primary transition-colors tracking-tight"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="font-bold text-sm h-11 px-6 rounded-xl hover:bg-slate-100 transition-colors">Entrar</Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-8 h-11 shadow-xl shadow-primary/30 hover:scale-105 transition-all text-sm uppercase tracking-tighter">
                                Testar Agora
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="pt-48 pb-24 px-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-10" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />

                    <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-10"
                        >
                            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">
                                    Inteligência Estratégica Ativada
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tight leading-[0.9] max-w-5xl text-slate-900">
                                Transforme ruído em <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">inteligência estratégica.</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-semibold leading-relaxed tracking-tight">
                                O IgnoHub é seu consultor de IA 24/7. Não entregamos apenas dados crus, mas a direção clara que sua comunidade precisa para crescer organicamente.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                                <Link href="/signup">
                                    <Button size="lg" className="h-16 px-12 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-[24px] shadow-2xl shadow-primary/40 group hover:scale-105 transition-all outline outline-0 outline-primary/20 hover:outline-[12px]">
                                        Começar agora
                                        <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="#features">
                                    <Button variant="outline" size="lg" className="h-16 px-10 text-lg font-bold border-slate-200 text-slate-600 rounded-[24px] hover:bg-slate-50 transition-colors bg-white">
                                        Explorar Funcionalidades
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Dashboard Visual */}
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="mt-32 w-full perspective-1000"
                        >
                            <div className="transform hover:rotate-x-2 hover:rotate-y-1 transition-transform duration-700 ease-out">
                                <DashboardMockup />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Proof Section */}
                <div className="py-20 border-y border-slate-100 bg-white">
                    <div className="max-w-7xl mx-auto px-6 overflow-hidden">
                        <div className="flex flex-col items-center gap-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Conectado aos maiores ecossistemas</p>
                            <div className="flex flex-wrap justify-center gap-16 md:gap-32 items-center opacity-30 grayscale hover:grayscale-0 transition-all duration-1000">
                                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter"><span>WhatsApp</span></div>
                                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter"><span>Telegram</span></div>
                                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter"><span>Discord</span><span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1">SOON</span></div>
                                <div className="flex items-center gap-3 font-black text-3xl tracking-tighter"><span>Slack</span><span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full ml-1">SOON</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Problem Section */}
                <section id="features" className="py-40 px-6 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto">
                        <SectionHeader
                            badge="O Ponto Cego"
                            title="O que você está ignorando hoje?"
                            subtitle="O ruído das redes esconde as oportunidades que sua marca precisa para prosperar. Diariamente, mais de 1 milhão de interações são perdidas no caos digital."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <FeatureCard
                                icon={Activity}
                                title="Saúde da Comunidade"
                                description="Identifique sinais de desengajamento antes que se tornem problemas críticos. Monitore o pulso orgânico do seu ecossistema em tempo real."
                            />
                            <FeatureCard
                                icon={TrendingUp}
                                title="Crescimento Orgânico"
                                description="Descubra quais tópicos geram conversas reais e recomendações genuínas, eliminando a dependência total de anúncios pagos."
                            />
                            <FeatureCard
                                icon={Sparkles}
                                title="Insight Estratégico"
                                description="Receba orientações diretas: 'Sua comunidade está pedindo por X. Tópico quente entre 15% dos membros hoje'."
                            />
                            <FeatureCard
                                icon={Network}
                                title="Mapeamento de Autoridade"
                                description="Identifique os líderes de opinião naturais dentro do seu grupo. Descubra quem realmente move o ponteiro da influência."
                            />
                            <FeatureCard
                                icon={Target}
                                title="Sinais de Compra"
                                description="Detecção de intenção de compra sutis escondidas em conversas informais. Nunca perca um lead qualificado novamente."
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Soberania de Dados"
                                description="Privacidade total e controle absoluto. Seus dados são processados em silos seguros, garantindo isolamento e conformidade."
                            />
                        </div>
                    </div>
                </section>

                {/* IA Compass Section */}
                <section className="py-40 px-6 bg-[#020817] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-primary/5 -z-10" />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-20" />

                    <div className="max-w-7xl mx-auto lg:flex items-center gap-24">
                        <div className="lg:w-1/2 space-y-10">
                            <SectionHeader
                                badge="A Bússola no Caos"
                                title="IA Consultiva: Seu co-piloto estratégico."
                                subtitle="Nossa Inteligência Consultiva atua como um analista sênior integrado. Ela lê entre as linhas, detecta sentimentos e sugere ações práticas."
                                light
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                {[
                                    { icon: Check, text: "Detecção de sinais de compra sutis" },
                                    { icon: Check, text: "Mapeamento de autoridade interna" },
                                    { icon: Check, text: "Análise preditiva de retenção" },
                                    { icon: Check, text: "Geração de pautas estratégicas" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/40 group-hover:bg-primary group-hover:text-white transition-all">
                                            <item.icon className="h-4 w-4 text-primary group-hover:text-white" />
                                        </div>
                                        <span className="text-slate-200 font-bold tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-10">
                                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-black rounded-[20px] h-16 px-10 shadow-2xl shadow-primary/20 hover:scale-105 transition-all text-lg">
                                    Ativar Consultoria IA
                                </Button>
                            </div>
                        </div>

                        <div className="lg:w-1/2 mt-24 lg:mt-0 relative">
                            <div className="relative aspect-square bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[60px] p-1 overflow-hidden shadow-2xl group">
                                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                                <div className="h-full w-full rounded-[59px] bg-[#020817] flex items-center justify-center relative overflow-hidden">
                                    {/* Brain Graphic */}
                                    <div className="relative scale-125">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                opacity: [0.3, 0.6, 0.3]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className="h-48 w-48 rounded-full border border-primary/40 shadow-[0_0_80px_rgba(37,99,235,0.2)]"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Cpu className="h-24 w-24 text-primary animate-pulse" />
                                        </div>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                            className="absolute -inset-10 border border-dashed border-primary/10 rounded-full"
                                        />
                                        <div className="absolute -top-12 -right-12 p-5 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
                                            <MessageSquare className="h-8 w-8 text-primary" />
                                        </div>
                                        <div className="absolute -bottom-12 -left-12 p-5 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
                                            <Zap className="h-8 w-8 text-primary" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Workflow Section */}
                <section id="como-funciona" className="py-40 px-6 bg-[#020817] relative">
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <div className="max-w-7xl mx-auto relative z-10">
                        <SectionHeader
                            badge="Simplicidade"
                            title="Conecte sua comunidade em 2 minutos."
                            subtitle="Workflow otimizado, sem barreiras técnicas para sua estratégia. Tudo o que você precisa para começar a crescer com dados."
                            light
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10">
                            <StepCard
                                number="01"
                                title="Integração Segura"
                                description="Conecte seu canal de comunicação (WhatsApp ou Telegram) com criptografia de ponta a ponta e um clique."
                            />
                            <StepCard
                                number="02"
                                title="Análise Cultural"
                                description="Nossa IA processa o histórico para entender o tom de voz, a cultura e o contexto único da sua marca."
                            />
                            <StepCard
                                number="03"
                                title="Insights Reais"
                                description="Comece a receber orientações táticas e alertas de oportunidades diretamente no seu dashboard ou e-mail."
                            />
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 px-6">
                    <div className="max-w-5xl mx-auto rounded-[60px] bg-primary p-16 md:p-32 text-center space-y-12 relative overflow-hidden group shadow-[0_40px_100px_-20px_rgba(37,99,235,0.5)]">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="h-full w-full bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:30px_30px]" />
                        </div>
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/20 rounded-full blur-[100px] group-hover:bg-white/30 transition-colors" />

                        <div className="relative z-10 space-y-8">
                            <h2 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tight">
                                Pronto para liderar <br />com clareza?
                            </h2>
                            <p className="text-primary-foreground/80 text-xl font-bold max-w-xl mx-auto">
                                Junte-se aos gestores que não contam com a sorte. Experimente a consultoria IA completa.
                            </p>
                            <div className="flex flex-col items-center gap-6 pt-6">
                                <Link href="/signup">
                                    <Button size="lg" className="h-20 px-16 text-2xl font-black bg-white text-primary hover:bg-slate-100 rounded-[28px] shadow-2xl transition-all hover:scale-110 active:scale-95">
                                        Criar minha conta grátis
                                    </Button>
                                </Link>
                                <p className="text-primary-foreground/60 text-sm font-black uppercase tracking-widest">Não requer cartão de crédito • 14 dias full access</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-24 px-6 border-t border-slate-100 bg-slate-50/30">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 md:gap-8">
                    <div className="space-y-6 max-w-xs text-center md:text-left mx-auto md:mx-0">
                        <div className="flex items-center justify-center md:justify-start">
                            <IgnoHubLogo className="h-10 w-auto" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            A plataforma definitiva para transformar comunidades em ativos estratégicos de alto valor através de Inteligência Consultiva.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-16">
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">Legal</h5>
                            <ul className="space-y-4 text-center md:text-left">
                                {["Privacidade", "Termos"].map((item) => (
                                    <li key={item}><Link href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">Suporte</h5>
                            <ul className="space-y-4 text-center md:text-left">
                                {["Central de Ajuda", "Contato", "Status"].map((item) => (
                                    <li key={item}><Link href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} IgnoHub AI Engine. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
                        Powered by advanced agents
                    </div>
                </div>
            </footer>
        </div>
    );
}
