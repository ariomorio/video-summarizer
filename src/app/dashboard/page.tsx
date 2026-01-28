"use client";

import { useState, useEffect } from "react";
import VideoArea from "@/components/VideoArea";
import BatchVideoArea from "@/components/BatchVideoArea";
import YouTubeArea from "@/components/YouTubeArea";
import SummaryDisplay from "@/components/SummaryDisplay";
import TranscriptionDisplay from "@/components/TranscriptionDisplay";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardPage() {
    const [apiKey, setApiKey] = useState("");
    const [whisperApiKey, setWhisperApiKey] = useState("");
    const [summary, setSummary] = useState("");
    const [transcript, setTranscript] = useState("");
    const [uploadMode, setUploadMode] = useState<"single" | "batch" | "youtube">("single");
    const [isViewingHistory, setIsViewingHistory] = useState(false);
    const [currentFilename, setCurrentFilename] = useState("");

    // Listen for history summary events from Sidebar and API key changes
    useEffect(() => {
        // Initial load of API keys
        const storedKey = localStorage.getItem("gemini_api_key");
        if (storedKey) setApiKey(storedKey);

        const storedWhisperKey = localStorage.getItem("openai_api_key");
        if (storedWhisperKey) setWhisperApiKey(storedWhisperKey);

        const handleShowHistory = (event: CustomEvent) => {
            setSummary(event.detail.summary);
            setCurrentFilename(event.detail.filename || "summary");
            setUploadMode("single");
            setIsViewingHistory(true);
            setTranscript(""); // Clear transcript when viewing history
        };

        const handleResetDashboard = () => {
            setIsViewingHistory(false);
            setSummary("");
            setTranscript("");
            setCurrentFilename("");
        };

        const handleStorageChange = () => {
            const newKey = localStorage.getItem("gemini_api_key");
            if (newKey) setApiKey(newKey);

            const newWhisperKey = localStorage.getItem("openai_api_key");
            if (newWhisperKey) setWhisperApiKey(newWhisperKey);
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
                                <span className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-orange-50 text-xl md:text-2xl">
                                    {uploadMode === "youtube" ? "🎬" : "📹"}
                                </span>
                                {uploadMode === "youtube" ? "YouTube URL" : "動画アップロード"}
                            </h2>
                            {/* Mode Toggle */}
                            <div className="flex bg-gray-50/80 p-1.5 rounded-xl border border-gray-100 w-full sm:w-auto">
                                <button
                                    onClick={() => setUploadMode("single")}
                                    className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${uploadMode === "single"
                                        ? "bg-white text-[#FF4081] shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    単一
                                </button>
                                <button
                                    onClick={() => setUploadMode("batch")}
                                    className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${uploadMode === "batch"
                                        ? "bg-white text-[#FF4081] shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    一括
                                </button>
                                <button
                                    onClick={() => setUploadMode("youtube")}
                                    className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1 ${uploadMode === "youtube"
                                        ? "bg-white text-red-500 shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                    </svg>
                                    YouTube
                                </button>
                            </div>
                        </div>

                        {uploadMode === "single" ? (
                            <VideoArea
                                apiKey={apiKey}
                                onSummaryGenerated={(s) => {
                                    setSummary(s);
                                    setIsViewingHistory(false);
                                }}
                            />
                        ) : uploadMode === "batch" ? (
                            <BatchVideoArea apiKey={apiKey} />
                        ) : (
                            <YouTubeArea
                                apiKey={apiKey}
                                whisperApiKey={whisperApiKey}
                                onSummaryGenerated={(s) => {
                                    setSummary(s);
                                    setIsViewingHistory(false);
                                }}
                                onTranscriptGenerated={(t) => setTranscript(t)}
                            />
                        )}
                    </div>
                )}

                {/* Transcription Display (for YouTube with Whisper) */}
                {transcript && (
                    <TranscriptionDisplay transcript={transcript} />
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
                                        setTranscript("");
                                    }}
                                    className="text-xs font-medium text-gray-500 hover:text-[#FF4081] transition-colors text-left sm:text-right"
                                >
                                    ← 新しい動画をアップロード
                                </button>
                            </div>
                        )}
                        <SummaryDisplay markdown={summary} filename={currentFilename} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
