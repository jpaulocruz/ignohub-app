"use client";

import { useLocale } from "next-intl";
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
    { code: "pt", name: "Português", flag: "🇧🇷" },
    { code: "en", name: "English", flag: "🇺🇸" },
] as const;

export function LocaleSwitcher() {
    const locale = useLocale();

    const handleSwitch = (lang: string) => {
        document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
        window.location.reload();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Languages className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LOCALES.map((loc) => (
                    <DropdownMenuItem
                        key={loc.code}
                        onClick={() => handleSwitch(loc.code)}
                        className={cn(
                            "flex items-center gap-2 cursor-pointer",
                            locale === loc.code && "bg-accent"
                        )}
                    >
                        <span className="text-base">{loc.flag}</span>
                        <span>{loc.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
