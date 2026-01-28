"use client";

import { useState, useEffect } from "react";
import { Youtube, Loader2, Link2, X, Clock } from "lucide-react";
import { summarizeAudioFromBase64 } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";

interface YouTubeAreaProps {
    apiKey: string;
    onSummaryGenerated: (summary: string) => void;
    onTranscriptGenerated?: (transcript: string) => void;
    whisperApiKey?: string;
}

export default function YouTubeArea({
    apiKey,
    onSummaryGenerated,
    onTranscriptGenerated,
    whisperApiKey
}: YouTubeAreaProps) {
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [videoInfo, setVideoInfo] = useState<{ title: string; duration: number } | null>(null);

    // Warn user before closing browser during processing
    useEffect(() => {
        if (isProcessing) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = 'YouTube動画を処理中です。ページを離れると処理が中断されます。';
                return 'YouTube動画を処理中です。ページを離れると処理が中断されます。';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [isProcessing]);

    const isValidYouTubeUrl = (url: string) => {
        const patterns = [
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
        ];
        return patterns.some(pattern => pattern.test(url));
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const processYouTube = async () => {
        if (!url || !apiKey) return;
        setIsProcessing(true);
        setProgress(10);
        setHasError(false);

        try {
            setStatus("YouTube動画を取得中...");

            const response = await fetch('/api/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'YouTube処理に失敗しました');
            }

            setVideoInfo({ title: data.title, duration: data.duration });
            setProgress(40);

            // If Whisper API key is provided, do transcription
            if (whisperApiKey && onTranscriptGenerated) {
                setStatus("Whisperで文字起こし中...");
                try {
                    const transcriptResponse = await fetch('/api/whisper', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            audio: data.audio,
                            mimeType: data.mimeType,
                            apiKey: whisperApiKey,
                        }),
                    });
                    const transcriptData = await transcriptResponse.json();
                    if (transcriptData.transcript) {
                        onTranscriptGenerated(transcriptData.transcript);
                    }
                } catch (transcriptError) {
                    console.warn('Transcription failed:', transcriptError);
                }
            }

            setProgress(60);
            setStatus("Gemini AIで分析中...");

            const summary = await summarizeAudioFromBase64(
                apiKey,
                data.audio,
                data.mimeType,
                (s) => setStatus(s)
            );

            onSummaryGenerated(summary);
            setProgress(100);
            setStatus("完了！");

            // Save to history
            saveToHistory(data.title, summary, url);

        } catch (error) {
            console.error(error);
            setStatus("エラー: " + (error as Error).message);
            setHasError(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const saveToHistory = (title: string, summary: string, youtubeUrl: string) => {
        const historyItem = {
            id: Math.random().toString(36).substr(2, 9),
            filename: `[YouTube] ${title}`,
            summary,
            timestamp: Date.now(),
            youtubeUrl,
        };

        const saved = localStorage.getItem("summary_history");
        const history = saved ? JSON.parse(saved) : [];
        history.unshift(historyItem);

        if (history.length > 20) {
            history.pop();
        }

        localStorage.setItem("summary_history", JSON.stringify(history));

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
    };

    const clearInput = () => {
        setUrl("");
        setVideoInfo(null);
        setStatus("");
        setProgress(0);
        setHasError(false);
        onSummaryGenerated("");
    };

    return (
        <div className="space-y-6">
            {/* Processing Warning Banner */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                    >
                        <Loader2 size={20} className="text-red-500 animate-spin flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">YouTube動画を処理中</p>
                            <p className="text-xs text-gray-600 mt-1">
                                動画の長さによって処理時間が変わります。完了までお待ちください。
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* URL Input */}
            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Youtube className="text-red-500" size={20} />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="YouTube URLを貼り付け（例: https://youtube.com/watch?v=...）"
                        disabled={isProcessing}
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    {url && !isProcessing && (
                        <button
                            onClick={clearInput}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* URL Validation Feedback */}
                {url && !isValidYouTubeUrl(url) && (
                    <p className="text-sm text-red-500 flex items-center gap-2">
                        <Link2 size={14} />
                        有効なYouTube URLを入力してください
                    </p>
                )}

                {/* Video Info Display */}
                {videoInfo && (
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <Youtube className="text-red-500" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{videoInfo.title}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock size={14} />
                                {formatDuration(videoInfo.duration)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {!isProcessing && !hasError ? (
                    <button
                        onClick={processYouTube}
                        disabled={!apiKey || !url || !isValidYouTubeUrl(url)}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/40 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <Youtube size={20} />
                        {!apiKey ? "APIキーを入力してください" : "YouTube動画を要約"}
                    </button>
                ) : !isProcessing && hasError ? (
                    <div className="space-y-3">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                            {status}
                        </div>
                        <button
                            onClick={processYouTube}
                            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/40 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                <path d="M16 16h5v5" />
                            </svg>
                            再試行
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-red-500 flex items-center gap-1">
                                <Loader2 size={12} className="animate-spin" />
                                {status}
                            </span>
                            <span className="text-gray-400">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
