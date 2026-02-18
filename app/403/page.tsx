import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
            <div className="text-center space-y-8 max-w-md">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <ShieldX className="h-10 w-10 text-red-500" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-5xl font-black text-white tracking-tighter">403</h1>
                    <p className="text-xl font-bold text-secondary-gray-400">Acesso Negado</p>
                    <p className="text-sm text-secondary-gray-500 leading-relaxed">
                        Você não possui permissão para acessar esta área.
                        Apenas superadmins podem visualizar esta página.
                    </p>
                </div>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-brand-500 text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-500/20"
                >
                    Voltar ao Dashboard
                </Link>
            </div>
        </div>
    );
}
