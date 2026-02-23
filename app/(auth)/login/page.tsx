"use client";

import { useState, useEffect } from "react";
import { loginAction } from "../actions";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const t = useTranslations("auth");

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) router.replace("/dashboard");
        });
    }, [supabase, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await loginAction(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">{t('login_title')}</h1>
                <p className="text-sm text-muted-foreground">{t('login_subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder={t('email_placeholder')}
                        autoComplete="email"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('password')}</Label>
                        <Link href="#" className="text-xs text-primary hover:underline">
                            {t('forgot_password')}
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder={t('password_placeholder')}
                            autoComplete="current-password"
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {loading ? t('signing_in') : t('sign_in')}
                </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                {t('no_account')}{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                    {t('create_account')}
                </Link>
            </p>
        </div>
    );
}
