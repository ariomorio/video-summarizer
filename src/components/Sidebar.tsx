"use client";

import { Home, History, Settings, Video, ChevronDown, ChevronRight, FileText, BookOpen, Download } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface HistoryItem {
    id: string;
    filename: string;
    summary: string;
    timestamp: number;
}

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps = {}) {
    const pathname = usePathname();
    const router = useRouter();
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [isViewingHistory, setIsViewingHistory] = useState(false);

    useEffect(() => {
        // Load history from localStorage
        const saved = localStorage.getItem("summary_history");
        if (saved) {
            const items = JSON.parse(saved);
            setHistory(items); // Show all history items
        }
    }, []);

    // Reset history selection when navigating away from dashboard
    useEffect(() => {
        if (pathname !== "/dashboard") {
            setIsViewingHistory(false);
            setSelectedHistoryId(null);
        }
    }, [pathname]);

    const menuItems = [
        { icon: Home, label: "ダッシュボード", href: "/dashboard" },
        { icon: BookOpen, label: "使い方", href: "/help" },
        { icon: Settings, label: "設定", href: "/settings" },
    ];

    const handleHistoryClick = (item: HistoryItem) => {
        setSelectedHistoryId(item.id);
        setIsViewingHistory(true);
        // Navigate to dashboard first
        router.push("/dashboard");
        // Then dispatch event after a short delay to ensure page is loaded
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('showHistorySummary', {
                    detail: { filename: item.filename, summary: item.summary }
                }));
            }
        }, 100);
    };

    const downloadAllHistory = () => {
        if (history.length === 0) return;

        const content = history.map((item, index) => {
            return `## ${index + 1}. ${item.filename}\n\n${item.summary}\n\n---\n\n`;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all_summaries_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed left-0 top-0 h-screen w-64 bg-white/95 backdrop-blur-md border-r border-orange-100/50 flex-col shadow-xl z-50
                transition-transform duration-300 ease-in-out
                md:flex
                ${isMobileOpen ? 'flex translate-x-0' : 'hidden md:flex -translate-x-full md:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="h-20 flex items-center px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF9F1C] to-[#FF4081] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Video size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">講義動画サマリー<br />作成ツール</h1>
                            <p className="text-[10px] text-gray-400 font-medium tracking-wider">by Tanopapa</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {/* Dashboard Menu */}
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${pathname === "/dashboard" && !isViewingHistory
                            ? "bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white shadow-lg shadow-orange-500/25"
                            : "text-gray-500 hover:bg-orange-50 hover:text-[#FF4081]"
                            }`}
                        onClick={() => {
                            setIsViewingHistory(false);
                            setSelectedHistoryId(null);
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('resetDashboard'));
                            }
                        }}
                    >
                        <Home size={20} className={pathname === "/dashboard" && !isViewingHistory ? "stroke-2" : "stroke-[1.5]"} />
                        <span className="font-medium text-sm">ダッシュボード</span>
                    </Link>

                    {/* History Submenu */}
                    <div className="pt-2 pb-2">
                        <button
                            onClick={() => setHistoryExpanded(!historyExpanded)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isViewingHistory
                                ? "bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white shadow-lg shadow-orange-500/25"
                                : "text-gray-500 hover:bg-orange-50 hover:text-[#FF4081]"
                                }`}
                        >
                            <History size={20} className={isViewingHistory ? "stroke-2" : "stroke-[1.5]"} />
                            <span className="font-medium text-sm flex-1 text-left">履歴</span>
                            {historyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {/* History Items */}
                        {historyExpanded && (
                            <div className="mt-2 ml-4 border-l-2 border-orange-100 pl-3">
                                {history.length === 0 ? (
                                    <p className="text-xs text-gray-400 px-4 py-2">履歴がありません</p>
                                ) : (
                                    <>
                                        {/* Download All Button */}
                                        <button
                                            onClick={downloadAllHistory}
                                            className="w-full mb-2 px-3 py-2 bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Download size={12} />
                                            全てダウンロード ({history.length}件)
                                        </button>

                                        {/* Scrollable History List */}
                                        <div className="space-y-1 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                            {history.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleHistoryClick(item)}
                                                    className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg transition-all text-left ${selectedHistoryId === item.id
                                                        ? "bg-orange-50 text-[#FF4081]"
                                                        : "text-gray-400 hover:text-[#FF4081] hover:bg-orange-50/50"
                                                        }`}
                                                >
                                                    <FileText size={14} className="mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">{item.filename}</p>
                                                        <p className="text-[10px] opacity-70">
                                                            {new Date(item.timestamp).toLocaleDateString("ja-JP")}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Other Menu Items */}
                    {menuItems.slice(1).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                                    ? "bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white shadow-lg shadow-orange-500/25"
                                    : "text-gray-500 hover:bg-orange-50 hover:text-[#FF4081]"
                                    }`}
                                onClick={() => {
                                    setIsViewingHistory(false);
                                    setSelectedHistoryId(null);
                                }}
                            >
                                <item.icon size={20} className={isActive ? "stroke-2" : "stroke-[1.5]"} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-6 border-t border-orange-100/50">
                    <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 text-center">
                        <p className="text-[10px] text-gray-400">講義動画サマリー作成ツール</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">by Tanopapa</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
