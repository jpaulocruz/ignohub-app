"use client";

import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LOCALES = [
    { code: "pt", label: "Português", flag: "🇧🇷" },
    { code: "en", label: "English", flag: "🇺🇸" },
] as const;

export function LocaleSwitcher() {
    const locale = useLocale();

    const switchLocale = (newLocale: string) => {
        document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
        window.location.reload();
    };

    const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Languages className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-32">
                {LOCALES.map((loc) => (
                    <DropdownMenuItem
                        key={loc.code}
                        onClick={() => switchLocale(loc.code)}
                        className={cn(
                            "cursor-pointer gap-2",
                            locale === loc.code && "font-semibold"
                        )}
                    >
                        <span>{loc.flag}</span>
                        <span>{loc.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
