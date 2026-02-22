"use client";

import { useState } from "react";
import { signUpAction } from "../actions";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await signUpAction(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-sm text-muted-foreground">Enter your details to get started with IgnoHub</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" name="fullName" type="text" required placeholder="John Doe" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required placeholder="••••••••" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization name</Label>
                    <Input id="organizationName" name="organizationName" type="text" required placeholder="Acme Inc." />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {loading ? "Creating account..." : "Create account"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
                </p>
            </form>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
