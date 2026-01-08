"use client";

import { useState, useEffect } from "react";
import VideoArea from "@/components/VideoArea";
import BatchVideoArea from "@/components/BatchVideoArea";
import SummaryDisplay from "@/components/SummaryDisplay";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardPage() {
    const [apiKey, setApiKey] = useState("");
    const [summary, setSummary] = useState("");
    const [uploadMode, setUploadMode] = useState<"single" | "batch">("single");
    const [isViewingHistory, setIsViewingHistory] = useState(false);

    // Listen for history summary events from Sidebar and API key changes
    useEffect(() => {
        // Initial load of API key
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) setApiKey(storedKey);

        const handleShowHistory = (event: CustomEvent) => {
            setSummary(event.detail.summary);
            setUploadMode("single");
            setIsViewingHistory(true);
        };

        const handleResetDashboard = () => {
            setIsViewingHistory(false);
            setSummary("");
        };

        const handleStorageChange = () => {
            const newKey = localStorage.getItem("gemini_api_key");
            if (newKey) setApiKey(newKey);
        };

        window.addEventListener('showHistorySummary', handleShowHistory as EventListener);
        window.addEventListener('resetDashboard', handleResetDashboard as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('showHistorySummary', handleShowHistory as EventListener);
            window.removeEventListener('resetDashboard', handleResetDashboard as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
                {/* Video Upload Card - Hidden when viewing history */}
                {!isViewingHistory && (
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-orange-100/50 border border-white p-4 md:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
                            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 md:gap-3 text-gray-800">
                                <span className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-orange-50 text-xl md:text-2xl">📹</span>
                                動画アップロード
                            </h2>
                            {/* Mode Toggle */}
                            <div className="flex bg-gray-50/80 p-1.5 rounded-xl border border-gray-100 w-full sm:w-auto">
                                <button
                                    onClick={() => setUploadMode("single")}
                                    className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${uploadMode === "single"
                                        ? "bg-white text-[#FF4081] shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    単一
                                </button>
                                <button
                                    onClick={() => setUploadMode("batch")}
                                    className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${uploadMode === "batch"
                                        ? "bg-white text-[#FF4081] shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    一括
                                </button>
                            </div>
                        </div>

                        {uploadMode === "single" ? (
                            <VideoArea apiKey={apiKey} onSummaryGenerated={(s) => {
                                setSummary(s);
                                setIsViewingHistory(false);
                            }} />
                        ) : (
                            <BatchVideoArea apiKey={apiKey} />
                        )}
                    </div>
                )}

                {/* Summary Display Card */}
                {summary && (
                    <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl shadow-orange-100/50 border border-white overflow-hidden">
                        {isViewingHistory && (
                            <div className="px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-orange-100/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="text-xs md:text-sm font-semibold text-[#FF4081] flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#FF4081]" />
                                    履歴から表示中
                                </p>
                                <button
                                    onClick={() => {
                                        setIsViewingHistory(false);
                                        setSummary("");
                                    }}
                                    className="text-xs font-medium text-gray-500 hover:text-[#FF4081] transition-colors text-left sm:text-right"
                                >
                                    ← 新しい動画をアップロード
                                </button>
                            </div>
                        )}
                        <SummaryDisplay markdown={summary} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
