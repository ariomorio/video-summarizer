"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileVideo, Loader2, X, Download, Zap, Server } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { summarizeVideoAudio, summarizeAudioChunks } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";

interface VideoAreaProps {
    apiKey: string;
    onSummaryGenerated: (summary: string) => void;
}

type ProcessingMode = 'auto' | 'server' | 'client';

export default function VideoArea({ apiKey, onSummaryGenerated }: VideoAreaProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [processingMode, setProcessingMode] = useState<ProcessingMode>('auto');
    const [compressionInfo, setCompressionInfo] = useState<string>("");
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadClientFFmpeg = async () => {
        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current;

        if (ffmpeg.loaded) return;

        try {
            setStatus("FFmpegを読み込み中（ブラウザ版）...");
            // Load from local public directory via toBlobURL (same-origin, COEP removed so fetch works)
            const coreURL = await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript');
            const wasmURL = await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm');
            await ffmpeg.load({ coreURL, wasmURL });
        } catch (e) {
            console.error('FFmpeg load error:', e);
            throw new Error(`FFmpeg読み込み失敗: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

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
            setCompressionInfo("");
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setCompressionInfo("");
        }
    };

    // Server-side audio extraction (faster, better compression)
    const extractAudioServer = async (videoFile: File): Promise<{ audio: string; mimeType: string; needsFileAPI: boolean }> => {
        setStatus("サーバーで音声抽出中（高速モード）...");

        const formData = new FormData();
        formData.append('file', videoFile);

        const response = await fetch('/api/extract-audio', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.fallbackToClient) {
                throw new Error('FALLBACK_TO_CLIENT');
            }
            throw new Error(data.error || '音声抽出に失敗しました');
        }

        setCompressionInfo(`圧縮率: ${data.compressionRatio}% (${data.fileSizeMB}MB)`);

        return {
            audio: data.audio,
            mimeType: data.mimeType,
            needsFileAPI: data.needsFileAPI,
        };
    };

    // Client-side audio extraction (fallback) — supports chunk splitting for long videos
    const extractAudioClient = async (videoFile: File): Promise<{
        audio: string;
        mimeType: string;
        needsFileAPI: boolean;
        chunks?: { base64: string; mimeType: string; startTime: number; duration: number }[];
    }> => {
        await loadClientFFmpeg();
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) throw new Error("FFmpeg not initialized");

        setStatus("音声を抽出中（ブラウザ版）...");
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

        // Extract full audio with aggressive compression for speech
        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-vn',
            '-ac', '1',           // mono
            '-ar', '16000',       // 16kHz sample rate
            '-b:a', '64k',        // 64kbps bitrate
            '-f', 'mp3',
            'full_audio.mp3'
        ]);

        // Get duration via ffprobe-like approach: extract to a known format and estimate from size
        // 64kbps = 8KB/s, so duration ≈ fileSize / 8000
        const fullAudioData = await ffmpeg.readFile('full_audio.mp3');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fullAudioBlob = new Blob([fullAudioData as any], { type: 'audio/mp3' });
        const estimatedDuration = fullAudioBlob.size / 8000; // 64kbps = 8KB/s

        const CHUNK_SECONDS = 600; // 10 minutes

        if (estimatedDuration <= CHUNK_SECONDS) {
            // Short video — return as single file (existing flow)
            setAudioBlob(fullAudioBlob);

            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(fullAudioBlob);
            });

            const fileSizeMB = fullAudioBlob.size / (1024 * 1024);
            setCompressionInfo(`圧縮後: ${fileSizeMB.toFixed(2)}MB`);

            return {
                audio: base64,
                mimeType: 'audio/mp3',
                needsFileAPI: fileSizeMB > 15,
            };
        }

        // Long video — split into 10-minute chunks
        const numChunks = Math.ceil(estimatedDuration / CHUNK_SECONDS);
        setStatus(`長時間動画を検出（約${Math.round(estimatedDuration / 60)}分）。${numChunks}チャンクに分割中...`);
        setAudioBlob(fullAudioBlob);

        const chunks: { base64: string; mimeType: string; startTime: number; duration: number }[] = [];

        for (let i = 0; i < numChunks; i++) {
            const startTime = i * CHUNK_SECONDS;
            const chunkDuration = Math.min(CHUNK_SECONDS, estimatedDuration - startTime);
            const chunkFile = `chunk_${i}.mp3`;

            setStatus(`チャンク ${i + 1}/${numChunks} を抽出中（${Math.floor(startTime / 60)}分〜${Math.floor((startTime + chunkDuration) / 60)}分）...`);

            await ffmpeg.exec([
                '-ss', String(startTime),
                '-t', String(CHUNK_SECONDS),
                '-i', 'full_audio.mp3',
                '-c', 'copy',
                chunkFile
            ]);

            const chunkData = await ffmpeg.readFile(chunkFile);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chunkBlob = new Blob([chunkData as any], { type: 'audio/mp3' });

            const chunkBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(chunkBlob);
            });

            chunks.push({
                base64: chunkBase64,
                mimeType: 'audio/mp3',
                startTime,
                duration: chunkDuration,
            });
        }

        const totalMB = fullAudioBlob.size / (1024 * 1024);
        setCompressionInfo(`圧縮後: ${totalMB.toFixed(2)}MB（${numChunks}チャンク）`);

        return {
            audio: '', // not used in chunk mode
            mimeType: 'audio/mp3',
            needsFileAPI: false,
            chunks,
        };
    };

    // Summarize using Gemini (inline data, File API, or chunked)
    const summarizeWithGemini = async (
        audio: string,
        mimeType: string,
        needsFileAPI: boolean,
        chunks?: { base64: string; mimeType: string; startTime: number; duration: number }[]
    ): Promise<string> => {
        // Chunk mode for long videos
        if (chunks && chunks.length > 0) {
            setStatus(`Gemini AIでチャンク分析中（${chunks.length}チャンク）...`);
            return await summarizeAudioChunks(apiKey, chunks, (s) => setStatus(s));
        }

        if (needsFileAPI) {
            // Use Gemini File API for large files
            setStatus("Gemini File APIで分析中（大容量ファイル対応）...");

            // Send the same prompt used client-side
            const customPrompt = localStorage.getItem("custom_prompt") || undefined;

            const response = await fetch('/api/gemini-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio,
                    mimeType,
                    apiKey,
                    prompt: customPrompt,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Gemini処理に失敗しました');
            }

            return data.summary;
        } else {
            // Use inline data for smaller files
            setStatus("Gemini AIで分析中...");

            // Create a File object from base64
            const binaryString = atob(audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const audioFile = new File([bytes], "audio.mp3", { type: mimeType });

            return await summarizeVideoAudio(apiKey, audioFile, (s) => setStatus(s));
        }
    };

    const processVideo = async () => {
        if (!file || !apiKey) return;
        setIsProcessing(true);
        setProgress(5);
        setHasError(false);
        setCompressionInfo("");

        try {
            let audioData: {
                audio: string;
                mimeType: string;
                needsFileAPI: boolean;
                chunks?: { base64: string; mimeType: string; startTime: number; duration: number }[];
            };

            // Force client-side for files > 4MB
            // Vercel serverless has strict body size limits (4.5MB Hobby / 50MB Pro)
            // Trying server with large files wastes time and causes "Failed to fetch"
            const forceClient = file.size > 4 * 1024 * 1024;

            // Try server-side first (faster), fallback to client
            if (!forceClient && (processingMode === 'auto' || processingMode === 'server')) {
                try {
                    setProgress(10);
                    audioData = await extractAudioServer(file);
                    setProgress(50);
                } catch (error) {
                    if ((error as Error).message === 'FALLBACK_TO_CLIENT' || processingMode === 'auto') {
                        console.log('Falling back to client-side processing...');
                        setProgress(10);
                        audioData = await extractAudioClient(file);
                        setProgress(50);

                        // Save audio blob for download (only for non-chunk mode)
                        if (!audioData.chunks && audioData.audio) {
                            const binaryString = atob(audioData.audio);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            setAudioBlob(new Blob([bytes], { type: 'audio/mp3' }));
                        }
                    } else {
                        throw error;
                    }
                }
            } else {
                setProgress(10);
                if (forceClient) {
                    setStatus("大容量ファイル（500MB+）: ブラウザで処理中...");
                }
                audioData = await extractAudioClient(file);
                setProgress(50);
            }

            // Summarize with Gemini
            setProgress(60);
            const summary = await summarizeWithGemini(
                audioData.audio,
                audioData.mimeType,
                audioData.needsFileAPI,
                audioData.chunks
            );

            onSummaryGenerated(summary);
            setProgress(100);
            setStatus("完了！");

            // Save to history
            saveToHistory(file.name, summary);

        } catch (error) {
            console.error('processVideo error:', error);
            const msg = error instanceof Error ? error.message
                : typeof error === 'string' ? error
                : JSON.stringify(error);
            setStatus("エラー: " + (msg || '不明なエラーが発生しました'));
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

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
    };

    return (
        <div className="space-y-6">
            {/* Processing Mode Selector */}
            <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-500">処理モード:</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setProcessingMode('auto')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                            processingMode === 'auto'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="サーバー優先、失敗時はブラウザで処理"
                    >
                        <Zap size={12} className="inline mr-1" />
                        自動
                    </button>
                    <button
                        onClick={() => setProcessingMode('server')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                            processingMode === 'server'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="サーバーで高速処理（FFmpeg必要）"
                    >
                        <Server size={12} className="inline mr-1" />
                        高速
                    </button>
                    <button
                        onClick={() => setProcessingMode('client')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                            processingMode === 'client'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title="ブラウザ内で処理（サーバー不要）"
                    >
                        ブラウザ
                    </button>
                </div>
            </div>

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
                                {compressionInfo && <span className="text-green-600 font-medium">{compressionInfo} • </span>}
                                ブラウザを閉じたり、ページを離れると処理が中断されます。
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
                        <span className="text-xs text-gray-400 mt-2 block">MP4, MOV, AVI (最大 2GB) • 大容量ファイル対応</span>
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
                                <p className="text-xs text-gray-500">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                    {file.size > 100 * 1024 * 1024 && (
                                        <span className="ml-2 text-orange-500 font-medium">
                                            (大容量 - File API使用)
                                        </span>
                                    )}
                                </p>
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
                                    setCompressionInfo("");
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
                            {compressionInfo && (
                                <p className="text-xs text-green-600 text-center">{compressionInfo}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
