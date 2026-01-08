"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileVideo, Loader2, X, Download } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { summarizeVideoAudio } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";

interface VideoAreaProps {
    apiKey: string;
    onSummaryGenerated: (summary: string) => void;
}

export default function VideoArea({ apiKey, onSummaryGenerated }: VideoAreaProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current;

        // Check if already loaded to avoid errors
        if (ffmpeg.loaded) return;

        setStatus("FFmpegを読み込み中...");
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    };

    // Warn user before closing browser during processing
    useEffect(() => {
        if (isProcessing) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = '動画処理中です。ページを離れると処理が中断されます。';
                return '動画処理中です。ページを離れると処理が中断されます。';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [isProcessing]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const processVideo = async () => {
        if (!file || !apiKey) return;
        setIsProcessing(true);
        setProgress(10);
        setHasError(false);

        try {
            await load();
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) throw new Error("FFmpeg not initialized");

            setStatus("音声を抽出中...");
            await ffmpeg.writeFile('input.mp4', await fetchFile(file));

            await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', 'output.mp3']);

            setStatus("音声ファイルを読み込み中...");
            const data = await ffmpeg.readFile('output.mp3');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const extractedAudioBlob = new Blob([data as any], { type: 'audio/mp3' });
            const audioFile = new File([extractedAudioBlob], "audio.mp3", { type: "audio/mp3" });
            
            // Save audio blob for download
            setAudioBlob(extractedAudioBlob);

            setProgress(50);
            setStatus("Gemini AIで分析中...");

            const summary = await summarizeVideoAudio(apiKey, audioFile, (s) => setStatus(s));
            onSummaryGenerated(summary);
            setProgress(100);
            setStatus("完了！");

            // Save to history
            if (file) {
                saveToHistory(file.name, summary);
            }
        } catch (error) {
            console.error(error);
            setStatus("エラー: " + (error as Error).message);
            setHasError(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const saveToHistory = (filename: string, summary: string) => {
        const historyItem = {
            id: Math.random().toString(36).substr(2, 9),
            filename,
            summary,
            timestamp: Date.now(),
        };

        const saved = localStorage.getItem("summary_history");
        const history = saved ? JSON.parse(saved) : [];
        history.unshift(historyItem);

        if (history.length > 20) {
            history.pop();
        }

        localStorage.setItem("summary_history", JSON.stringify(history));

        // Dispatch custom event to update sidebar
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage')); // Simple trigger, or could be more specific
        }
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
                        className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3"
                    >
                        <Loader2 size={20} className="text-[#FF4081] animate-spin flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">処理中です</p>
                            <p className="text-xs text-gray-600 mt-1">
                                ブラウザを閉じたり、ページを離れると処理が中断されます。完了までお待ちください。
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!file ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-orange-200 rounded-2xl p-12 text-center hover:bg-orange-50/50 hover:border-[#FF9F1C] transition-all cursor-pointer group"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="text-[#FF9F1C]" size={32} />
                    </div>
                    <p className="text-gray-900 font-bold text-lg mb-2">動画をアップロード</p>
                    <p className="text-sm text-gray-500">
                        クリックまたはドラッグ＆ドロップ<br />
                        <span className="text-xs text-gray-400 mt-2 block">MP4, MOV, AVI (最大 2GB)</span>
                    </p>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <FileVideo className="text-[#FF9F1C]" size={20} />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {audioBlob && (
                                <button
                                    onClick={() => {
                                        const url = URL.createObjectURL(audioBlob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${file.name.replace(/\.[^/.]+$/, '')}_audio.mp3`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="p-2 hover:bg-orange-100 rounded-full text-[#FF9F1C] transition-colors"
                                    title="音声をダウンロード"
                                >
                                    <Download size={20} />
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setFile(null);
                                    onSummaryGenerated("");
                                    setProgress(0);
                                    setStatus("");
                                    setAudioBlob(null);
                                }}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {!isProcessing && !hasError ? (
                        <button
                            onClick={processVideo}
                            disabled={!apiKey}
                            className="w-full bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                        >
                            {apiKey ? "AI要約を開始" : "APIキーを入力してください"}
                        </button>
                    ) : !isProcessing && hasError ? (
                        <div className="space-y-3">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                                {status}
                            </div>
                            <button
                                onClick={processVideo}
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
                                <span className="text-[#FF4081] flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" />
                                    {status}
                                </span>
                                <span className="text-gray-400">{progress}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#FF9F1C] to-[#FF4081]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
