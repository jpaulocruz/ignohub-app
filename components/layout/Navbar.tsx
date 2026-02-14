"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function Navbar() {
    const pathname = usePathname();
    const pageName = pathname.split("/").pop() || "Dashboard";

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-4 z-40 w-[calc(100%-2rem)] mx-auto"
        >
            <div className="glass-card rounded-premium p-4 flex items-center justify-between shadow-navbar">
                <div className="flex flex-col">
                    <p className="text-secondary-gray-500 text-xs font-medium capitalize">
                        Páginas / {pageName}
                    </p>
                    <h2 className="text-xl font-bold capitalize">{pageName}</h2>
                </div>

                <div className="flex items-center gap-4 bg-navy-900/50 p-2 rounded-full border border-white/5">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-4 w-4 text-secondary-gray-500" />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            className="bg-navy-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 w-48 transition-all"
                        />
                    </div>

                    <button className="p-2 text-secondary-gray-500 hover:text-white transition-colors">
                        <Bell className="h-5 w-5" />
                    </button>

                    <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold cursor-pointer">
                        <User className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}
