import Link from "next/link";
import { ShieldX } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ForbiddenPage() {
    const t = await getTranslations("auth");

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
            <div className="text-center space-y-8 max-w-md">
                <div className="mx-auto h-20 w-20 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <ShieldX className="h-10 w-10 text-red-500" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-8xl font-black text-white tracking-tighter leading-none">403</h1>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.4em] bg-red-500/10 px-4 py-1 border border-red-500/20">Protocol Violation</p>
                        <p className="text-sm font-black text-secondary-gray-500 uppercase tracking-widest mt-2">{t('forbidden_title')}</p>
                    </div>
                    <p className="text-xs text-secondary-gray-600 leading-relaxed max-w-[280px] mx-auto font-medium">
                        {t('forbidden_description')}
                    </p>
                </div>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-10 py-5 bg-brand-500 text-white rounded-sm font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/10 active:translate-y-[1px]"
                >
                    {t('go_dashboard')}
                </Link>
            </div>
        </div>
    );
}
