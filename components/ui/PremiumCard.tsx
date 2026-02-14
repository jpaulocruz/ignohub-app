"use client";

import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "glass" | "transparent";
}

export function PremiumCard({
    children,
    className,
    variant = "default",
    ...props
}: PremiumCardProps) {
    const variants = {
        default: "bg-navy-800 shadow-premium border border-white/5",
        glass: "glass-card shadow-premium",
        transparent: "bg-transparent border-none shadow-none",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn(
                "relative flex flex-col w-full min-w-0 break-words rounded-3xl",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
