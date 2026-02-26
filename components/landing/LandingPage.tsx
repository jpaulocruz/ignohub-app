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
    Target
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SectionHeader = ({ badge, title, subtitle }: { badge: string, title: string, subtitle?: string }) => (
    <div className="flex flex-col items-center text-center space-y-4 mb-16">
        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
            {badge}
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight max-w-2xl">
            {title}
        </h2>
        {subtitle && (
            <p className="text-lg text-muted-foreground max-w-xl font-medium">
                {subtitle}
            </p>
        )}
    </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
    >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="w-6 h-6 text-primary group-hover:text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
        <p className="text-muted-foreground leading-relaxed font-medium">{description}</p>
    </motion.div>
);

const DashboardMockup = () => (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl border border-border shadow-2xl overflow-hidden bg-[#020817]">
        {/* Browser Header */}
        <div className="h-10 border-b border-border bg-[#0a101f] flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
            </div>
        </div>

        {/* Fake UI Content */}
        <div className="p-6 md:p-10 space-y-8">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-primary/20 rounded animate-pulse" />
                    <div className="h-8 w-64 bg-white/10 rounded" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-32 bg-primary/10 border border-primary/20 rounded-xl" />
                    <div className="h-10 w-10 bg-white/5 rounded-xl border border-white/10" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
                        <div className="h-3 w-20 bg-white/10 rounded" />
                        <div className="h-8 w-24 bg-white/5 rounded" />
                        <div className="h-2 w-full bg-white/5 rounded overflow-hidden">
                            <div className="h-full bg-primary/40 w-2/3" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64 rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between">
                    <div className="space-y-2">
                        <div className="h-5 w-40 bg-white/10 rounded" />
                        <div className="h-3 w-56 bg-white/5 rounded" />
                    </div>
                    <div className="flex items-end gap-2 h-32">
                        {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-primary/30 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
                <div className="h-64 rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40" />
                        <div className="space-y-1">
                            <div className="h-4 w-24 bg-white/10 rounded" />
                            <div className="h-3 w-16 bg-white/5 rounded" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-white/5 rounded" />
                        <div className="h-4 w-5/6 bg-white/5 rounded" />
                        <div className="h-4 w-4/6 bg-white/5 rounded" />
                    </div>
                    <div className="pt-4 flex gap-2">
                        <div className="px-3 py-1 rounded-full bg-green-500/10 text-[10px] text-green-500 border border-green-500/20">SENTIMENT: POSITIVE</div>
                        <div className="px-3 py-1 rounded-full bg-primary/10 text-[10px] text-primary border border-primary/20">GROWTH ALERT</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Large Central Pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="h-32 w-32 rounded-full border-2 border-primary/30 animate-ring-pulse" />
            <div className="h-32 w-32 rounded-full border border-primary/20 animate-ring-pulse [animation-delay:1s]" />
        </div>
    </div>
);

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFF] text-[#0F172A] selection:bg-primary/10">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IgnoHubLogo className="scale-90" />
                        <span className="font-bold text-xl tracking-tight">ignohub</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Funcionalidades</Link>
                        <Link href="#ai" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Agentes de IA</Link>
                        <Link href="#pricing" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Preços</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="font-semibold text-sm">Entrar</Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-10 shadow-lg shadow-primary/20">Começar Grátis</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="pt-32 pb-20 px-6">
                    <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-default">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                <span className="text-xs font-bold text-primary uppercase tracking-widest">Growth Consultancy Inside</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] max-w-4xl text-slate-900">
                                Comunidades + IA:<br />
                                <span className="text-primary">Evoluindo Juntos.</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
                                Você sabe que engajamento não é sorte. O IgnoHub transforma dados crus em uma consultoria de crescimento perpétua para gestores de alto nível.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                                <Link href="/signup">
                                    <Button size="lg" className="h-14 px-10 text-lg font-black bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 group">
                                        Testar Agora
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="#features">
                                    <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-bold border-border/50 rounded-2xl">
                                        Ver Funcionalidades
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Dashboard Visual */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="mt-24 w-full"
                        >
                            <DashboardMockup />
                        </motion.div>
                    </div>
                </section>

                {/* Partners/Platforms */}
                <div className="py-12 border-y border-border/50 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-24 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                        <span className="text-xl font-bold italic">WhatsApp</span>
                        <span className="text-xl font-bold italic">Telegram</span>
                        <span className="text-xl font-bold italic">Discord (Soon)</span>
                        <span className="text-xl font-bold italic">Slack (Soon)</span>
                    </div>
                </div>

                {/* Technical Features Section */}
                <section id="features" className="py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <SectionHeader
                            badge="Tecnologia de Ponta"
                            title="A plataforma definitiva para gestores de comunidades"
                            subtitle="Não entregamos apenas dados. Entregamos clareza e caminhos estratégicos para o crescimento real."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={BrainCircuit}
                                title="Orquestração de Agentes"
                                description="Agentes especialistas que agem diretamente nos dados, identificando tendências e sugerindo ações imediatas."
                            />
                            <FeatureCard
                                icon={TrendingUp}
                                title="Fluxo de Sentimento"
                                description="Monitoramento em tempo real da saúde emocional do grupo através de processamento de linguagem natural avançado."
                            />
                            <FeatureCard
                                icon={Microscope}
                                title="Conhecimento Sintetizado"
                                description="Briefings diários e semanais que destilam milhares de mensagens em pontos de ação claros e objetivos."
                            />
                            <FeatureCard
                                icon={Users}
                                title="Psicometria de Membros"
                                description="Identifique seus top colaboradores e entenda os padrões de comportamento que geram engajamento genuíno."
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Privacidade & Segurança"
                                description="Infraestrutura robusta que garante a soberania dos seus dados e o isolamento completo de cada comunidade."
                            />
                            <FeatureCard
                                icon={Target}
                                title="Growth Engine"
                                description="Nossa 'Consultoria-como-Serviço' integrada que sugere caminhos estratégicos baseados em dados reais."
                            />
                        </div>
                    </div>
                </section>

                {/* Consultancy Approach Section */}
                <section id="ai" className="py-32 px-6 bg-[#020817] text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <div className="max-w-7xl mx-auto relative z-10 lg:flex items-center gap-20">
                        <div className="lg:w-1/2 space-y-8">
                            <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[10px] font-bold text-primary uppercase tracking-widest w-fit">
                                IA de Alto Desempenho
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                                Consultores de<br />
                                IA Especialistas.
                            </h2>
                            <div className="space-y-6">
                                <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                    Nossos agentes de IA não são apenas bots. São analistas de dados, mentores comportamentais e facilitadores treinados para identificar as dores dos seus membros.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Análise preditiva de engajamento",
                                        "Identificação de influenciadores internos",
                                        "Detecção precoce de conflitos",
                                        "Sugestões de pautas para conteúdo"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 font-semibold text-slate-200">
                                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                                                <Zap className="h-3 w-3 text-primary" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl h-14 px-10 shadow-lg shadow-primary/20">
                                Conhecer os Agentes
                            </Button>
                        </div>

                        <div className="lg:w-1/2 mt-20 lg:mt-0 relative group">
                            <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity" />
                            <div className="relative aspect-square md:aspect-video lg:aspect-square bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 overflow-hidden">
                                {/* Abstract AI Graphic */}
                                <div className="h-full w-full flex items-center justify-center">
                                    <div className="relative">
                                        <div className="h-40 w-40 rounded-full border-2 border-primary/30 animate-ring-pulse shadow-[0_0_50px_rgba(37,99,235,0.2)]" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BrainCircuit className="h-20 w-20 text-primary animate-signal-glow" />
                                        </div>
                                        <div className="absolute -top-10 -right-10 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
                                            <Users className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="absolute -bottom-10 -left-10 p-4 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
                                            <MessageSquare className="h-6 w-6 text-primary" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing/CTA Section */}
                <section id="pricing" className="py-32 px-6">
                    <div className="max-w-4xl mx-auto rounded-[40px] bg-[#020817] p-12 md:p-24 text-center space-y-10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                                Sua comunidade merece excelência.
                            </h2>
                            <div className="flex flex-col items-center gap-4">
                                <div className="text-4xl md:text-5xl font-black text-primary">Preços Sob Consulta</div>
                                <p className="text-slate-400 font-medium max-w-md mx-auto italic lowercase first-letter:uppercase">
                                    Planos personalizados para comunidades que buscam escala e resultados extraordinários.
                                </p>
                            </div>
                            <div className="pt-8">
                                <Link href="/signup">
                                    <Button size="lg" className="h-16 px-12 text-xl font-black bg-primary hover:bg-primary/90 text-white rounded-3xl shadow-2xl shadow-primary/20">
                                        Entrar em Contato
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-border/50">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="flex items-center gap-2">
                            <IgnoHubLogo className="scale-75" />
                            <span className="font-bold text-lg tracking-tight">ignohub</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium text-center md:text-left">
                            © {new Date().getFullYear()} IgnoHub. Gestão de Comunidades Inteligente.
                        </p>
                    </div>

                    <div className="flex gap-10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Link href="#" className="hover:text-primary transition-colors">Privacidade</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Termos</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Suporte</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
