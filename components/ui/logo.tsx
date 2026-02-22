import { cn } from "@/lib/utils";

export function IgnoHubLogo({ className }: { className?: string }) {
    return (
        <div className={cn("relative flex items-center justify-center w-7 h-7 shrink-0", className)}>
            <div className="w-5 h-5 grid grid-cols-2 gap-[1.5px] rotate-45 transform-gpu">
                <div className="bg-[#6B9EFA] rounded-tl-full" />
                <div className="bg-[#051B4E] rounded-tr-full" />
                <div className="bg-[#2563EB] rounded-bl-full" />
                <div className="bg-[#1E40AF] rounded-br-full" />
            </div>
        </div>
    );
}
