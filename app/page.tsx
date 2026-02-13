import { LucideShieldCheck, LucideZap, LucideCreditCard, LucideSettings } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 animate-pulse">
            <LucideZap className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Next.js 15 + Supabase</span>
          </div>
          <h1 className="text-6xl font-black text-white leading-tight tracking-tighter">
            IgnoHub <span className="text-primary italic">Migration</span>
          </h1>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed">
            Bem-vindo à nova era do IgnoHub. <br />
            Migrado para Next.js 15 (App Router) com arquitetura de alta performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {[
            { icon: LucideShieldCheck, title: 'Segurança Org', desc: 'RLS e validação de tenant nativa.' },
            { icon: LucideCreditCard, title: 'Stripe Billing', desc: 'Checkout e gestão de faturas integrados.' },
            { icon: LucideSettings, title: 'Settings', desc: 'Configurações de perfil e notificações.' },
            { icon: LucideZap, title: 'Auto-Scaling', desc: 'Infraestrutura serverless auto-gerenciada.' }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-all text-left space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-12 border-t border-zinc-900 text-center">
        <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">
          Build with <span className="text-primary">Antigravity</span> &bull; 2026
        </p>
      </footer>
    </div>
  )
}
