"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import ApiKeyModal from "./ApiKeyModal";
import { Menu, Settings, X } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#FFF9F5]">
            <Sidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {/* Mobile Header */}
            <div className="md:hidden h-16 bg-white/80 backdrop-blur-md border-b border-orange-100 flex items-center justify-between px-4 sticky top-0 z-40">
                <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                    <Menu size={20} />
                </button>
                <span className="font-bold text-sm bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] bg-clip-text text-transparent">講義動画サマリー</span>
                <button
                    onClick={() => setIsApiModalOpen(true)}
                    className="p-2 text-gray-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                    <Settings size={18} />
                </button>
            </div>

            {/* Main Content */}
            <div className="md:pl-64 transition-all duration-300">
                {/* Desktop Header */}
                <header className="hidden md:flex h-20 sticky top-0 z-30 px-8 items-center justify-between">
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-xl border-b border-white/50 shadow-sm" />

                    <div className="relative flex items-center gap-2 text-sm text-gray-500">
                        <span className="bg-white/80 px-3 py-1 rounded-full shadow-sm border border-orange-50 font-medium text-gray-400 text-xs">APP</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-800 font-semibold tracking-wide text-xs sm:text-sm">講義動画サマリー作成ツール</span>
                    </div>

                    <div className="relative flex items-center gap-3">
                        <button
                            onClick={() => setIsApiModalOpen(true)}
                            className="group flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#FF4081] bg-white hover:bg-white px-4 py-2 rounded-full border border-gray-100 hover:border-orange-200 shadow-sm transition-all duration-300"
                        >
                            <Settings size={14} className="group-hover:rotate-45 transition-transform duration-500" />
                            <span>API設定</span>
                        </button>
                    </div>
                </header>

                <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </main>
            </div>

            {/* API Key Modal */}
            <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
        </div>
    );
}
