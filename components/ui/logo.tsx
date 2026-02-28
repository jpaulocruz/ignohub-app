import { cn } from "@/lib/utils";

export function IgnoHubLogo({ className, showText = false }: { className?: string, showText?: boolean }) {
    return (
        <div className={cn("relative flex items-center shrink-0", className)}>
            <img
                src="/logo.png"
                alt="IgnoHub"
                className="h-full w-auto object-contain"
            />
        </div>
    );
}
