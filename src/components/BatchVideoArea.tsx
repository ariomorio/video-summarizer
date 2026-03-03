"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FolderOpen, Loader2, CheckCircle, XCircle, ChevronDown, ChevronRight, Download, FileVideo } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { summarizeVideoAudio, summarizeAudioChunks } from "../lib/gemini";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface VideoJob {
    id: string;
    file: File;
    status: "waiting" | "processing" | "completed" | "error";
    progress: number;
    statusMessage: string;
    summary?: string;
    error?: string;
    isExpanded?: boolean;
    audioBlob?: Blob;
}

interface BatchVideoAreaProps {
    apiKey: string;
}

export default function BatchVideoArea({ apiKey }: BatchVideoAreaProps) {
    const [jobs, setJobs] = useState<VideoJob[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const load = async () => {
        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current;

        if (ffmpeg.loaded) return;

        // Load from local public directory via toBlobURL (same-origin, COEP removed so fetch works)
        await ffmpeg.load({
            coreURL: await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript'),
            wasmURL: await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm'),
        });
    };

    // Warn user before closing browser during processing
    useEffect(() => {
        if (isProcessing) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = '一括処理中です。ページを離れると処理が中断されます。';
                return '一括処理中です。ページを離れると処理が中断されます。';
            };
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [isProcessing]);

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const videoFiles = files.filter(f => f.type.startsWith('video/'));

            const newJobs: VideoJob[] = videoFiles.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                status: "waiting",
                progress: 0,
                statusMessage: "待機中",
            }));

            setJobs(newJobs);
        }
    };

    const updateJob = (id: string, updates: Partial<VideoJob>) => {
        setJobs(prev => prev.map(job =>
            job.id === id ? { ...job, ...updates } : job
        ));
    };

    const processVideo = async (job: VideoJob) => {
        updateJob(job.id, { status: "processing", progress: 10, statusMessage: "FFmpegを読み込み中..." });

        try {
            await load();
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) throw new Error("FFmpeg not initialized");

            // Use job-specific filenames to avoid conflicts in batch mode
            const inputFile = `input_${job.id}.mp4`;
            const audioFile = `audio_${job.id}.mp3`;

            updateJob(job.id, { progress: 20, statusMessage: "音声を抽出中..." });
            await ffmpeg.writeFile(inputFile, await fetchFile(job.file));
            await ffmpeg.exec([
                '-i', inputFile,
                '-vn',
                '-ac', '1',
                '-ar', '16000',
                '-b:a', '64k',
                '-f', 'mp3',
                audioFile
            ]);

            // Clean up input file to free WASM memory
            try { await ffmpeg.deleteFile(inputFile); } catch { /* ignore */ }

            updateJob(job.id, { progress: 35, statusMessage: "音声ファイルを読み込み中..." });
            const fullData = await ffmpeg.readFile(audioFile);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const audioBlob = new Blob([fullData as any], { type: 'audio/mp3' });

            // Estimate duration: 64kbps = 8KB/s
            const estimatedDuration = audioBlob.size / 8000;
            const CHUNK_SECONDS = 600;

            let summary: string;

            if (estimatedDuration <= CHUNK_SECONDS) {
                // Short video — single file processing
                // Clean up audio file from WASM FS
                try { await ffmpeg.deleteFile(audioFile); } catch { /* ignore */ }

                const audioFileObj = new File([audioBlob], "audio.mp3", { type: "audio/mp3" });
                updateJob(job.id, { progress: 60, statusMessage: "Gemini AIで分析中..." });
                summary = await summarizeVideoAudio(apiKey, audioFileObj, (s) => {
                    updateJob(job.id, { statusMessage: s });
                });
            } else {
                // Long video — chunk processing
                const numChunks = Math.ceil(estimatedDuration / CHUNK_SECONDS);
                updateJob(job.id, { progress: 40, statusMessage: `${numChunks}チャンクに分割中...` });

                const chunks: { base64: string; mimeType: string; startTime: number; duration: number }[] = [];

                for (let i = 0; i < numChunks; i++) {
                    const startTime = i * CHUNK_SECONDS;
                    const chunkDuration = Math.min(CHUNK_SECONDS, estimatedDuration - startTime);
                    const chunkFile = `chunk_${job.id}_${i}.mp3`;

                    await ffmpeg.exec([
                        '-ss', String(startTime),
                        '-t', String(CHUNK_SECONDS),
                        '-i', audioFile,
                        '-c', 'copy',
                        chunkFile
                    ]);

                    const chunkData = await ffmpeg.readFile(chunkFile);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const chunkBlob = new Blob([chunkData as any], { type: 'audio/mp3' });

                    // Clean up chunk file from WASM FS
                    try { await ffmpeg.deleteFile(chunkFile); } catch { /* ignore */ }

                    const chunkBase64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(chunkBlob);
                    });

                    chunks.push({ base64: chunkBase64, mimeType: 'audio/mp3', startTime, duration: chunkDuration });
                    updateJob(job.id, {
                        progress: 40 + Math.round((i + 1) / numChunks * 20),
                        statusMessage: `チャンク ${i + 1}/${numChunks} を抽出完了`
                    });
                }

                // Clean up audio file from WASM FS
                try { await ffmpeg.deleteFile(audioFile); } catch { /* ignore */ }

                updateJob(job.id, { progress: 60, statusMessage: `Gemini AIで${numChunks}チャンクを分析中...` });
                summary = await summarizeAudioChunks(apiKey, chunks, (s) => {
                    updateJob(job.id, { statusMessage: s });
                });
            }

            updateJob(job.id, {
                status: "completed",
                progress: 100,
                statusMessage: "完了！",
                summary,
                audioBlob
            });

            // 履歴に保存
            saveToHistory(job.file.name, summary);

        } catch (error) {
            console.error(error);
            updateJob(job.id, {
                status: "error",
                statusMessage: "エラー",
                error: (error as Error).message
            });
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
    };

    const processAllJobs = async () => {
        if (!apiKey) {
            alert("APIキーを入力してください");
            return;
        }

        setIsProcessing(true);

        // WASM FFmpegはシングルスレッドなので、1件ずつ順番に処理する
        // （並列にするとファイルが競合してエラーになる）
        const waitingJobs = jobs.filter(j => j.status === "waiting");

        for (const job of waitingJobs) {
            await processVideo(job);
        }

        setIsProcessing(false);
    };

    const toggleExpand = (id: string) => {
        setJobs(prev => prev.map(job =>
            job.id === id ? { ...job, isExpanded: !job.isExpanded } : job
        ));
    };

    const downloadSummary = (filename: string, summary: string) => {
        const blob = new Blob([summary], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_summary.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadAll = () => {
        const completedJobs = jobs.filter(j => j.status === "completed" && j.summary);
        if (completedJobs.length === 0) return;

        const content = completedJobs.map((job, index) => {
            return `## ${index + 1}. ${job.file.name}\n\n${job.summary}\n\n---\n\n`;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_summaries_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadAudio = (filename: string, audioBlob: Blob) => {
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename.replace(/\.[^/.]+$/, '')}_audio.mp3`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadAllAudio = () => {
        const completedJobs = jobs.filter(j => j.status === "completed" && j.audioBlob);
        if (completedJobs.length === 0) return;

        completedJobs.forEach((job, index) => {
            setTimeout(() => {
                downloadAudio(job.file.name, job.audioBlob!);
            }, index * 300); // Stagger downloads to avoid browser blocking
        });
    };

    const completedCount = jobs.filter(j => j.status === "completed").length;
    const errorCount = jobs.filter(j => j.status === "error").length;

    return (
        <div className="w-full space-y-6">
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
                            <p className="text-sm font-semibold text-gray-900">一括処理中です</p>
                            <p className="text-xs text-gray-600 mt-1">
                                ブラウザを閉じたり、ページを離れると処理が中断されます。完了までお待ちください。
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!jobs.length ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-orange-200 rounded-2xl p-12 text-center hover:bg-orange-50/50 hover:border-[#FF9F1C] transition-all cursor-pointer group"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFilesChange}
                        accept="video/*"
                        multiple
                        className="hidden"
                    />

                    <div className="bg-orange-50 p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform mx-auto w-16 h-16 flex items-center justify-center">
                        <FolderOpen className="text-[#FF9F1C] w-8 h-8" />
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        複数の動画ファイルを選択
                    </h3>
                    <p className="text-sm text-gray-400">
                        MP4, MOV 対応（複数選択可能）
                    </p>
                </div>
            ) : (
                <>
                    {/* Status Bar */}
                    <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <span className="bg-[#FF9F1C] text-white px-2 py-0.5 rounded text-xs">BATCH</span>
                                処理状況
                            </h3>
                            <div className="flex gap-4 text-xs font-medium">
                                <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> {completedCount}</span>
                                <span className="text-red-600 flex items-center gap-1"><XCircle size={14} /> {errorCount}</span>
                                <span className="text-gray-500">計 {jobs.length}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={processAllJobs}
                                disabled={isProcessing || !apiKey}
                                className="flex-1 py-2.5 bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white rounded-lg font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all text-sm"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin w-4 h-4" />
                                        処理中...
                                    </span>
                                ) : (
                                    "一括処理を開始"
                                )}
                            </button>
                            {completedCount > 0 && (
                                <>
                                    <button
                                        onClick={downloadAll}
                                        className="px-4 py-2 bg-white text-[#FF4081] border border-[#FF4081] rounded-lg font-bold hover:bg-pink-50 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <Download size={16} />
                                        要約DL
                                    </button>
                                    <button
                                        onClick={downloadAllAudio}
                                        className="px-4 py-2 bg-white text-[#FF9F1C] border border-[#FF9F1C] rounded-lg font-bold hover:bg-orange-50 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <Download size={16} />
                                        音声DL
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    setJobs([]);
                                    setIsProcessing(false);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                            >
                                クリア
                            </button>
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="space-y-3">
                        <AnimatePresence>
                            {jobs.map((job) => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-colors ${job.status === "completed" ? "border-green-100" :
                                        job.status === "processing" ? "border-orange-200 ring-1 ring-orange-100" : "border-gray-100"
                                        }`}
                                >
                                    {/* Job Header */}
                                    <div
                                        onClick={() => job.status === "completed" && toggleExpand(job.id)}
                                        className={`p-4 flex items-center gap-3 ${job.status === "completed" ? "cursor-pointer hover:bg-gray-50/50" : ""}`}
                                    >
                                        {/* Status Icon */}
                                        <div className="flex-shrink-0">
                                            {job.status === "waiting" && <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><FileVideo size={16} /></div>}
                                            {job.status === "processing" && <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#FF9F1C]"><Loader2 className="animate-spin" size={16} /></div>}
                                            {job.status === "completed" && <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500"><CheckCircle size={16} /></div>}
                                            {job.status === "error" && <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><XCircle size={16} /></div>}
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 text-sm truncate">{job.file.name}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-2">
                                                {(job.file.size / 1024 / 1024).toFixed(1)} MB
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className={job.status === "processing" ? "text-[#FF9F1C]" : ""}>{job.statusMessage}</span>
                                            </p>
                                        </div>

                                        {/* Progress Percentage */}
                                        {job.status === "processing" && (
                                            <div className="flex-shrink-0 text-sm font-bold text-[#FF9F1C]">
                                                {job.progress}%
                                            </div>
                                        )}

                                        {/* Expand Icon */}
                                        {job.status === "completed" && (
                                            <div className="flex-shrink-0 text-gray-300">
                                                {job.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    {job.status === "processing" && (
                                        <div className="h-1 bg-gray-100 w-full">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-[#FF9F1C] to-[#FF4081]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${job.progress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    )}

                                    {/* Error Message and Retry Button */}
                                    {job.status === "error" && (
                                        <div className="p-4 border-t border-red-100 bg-red-50/30 space-y-3">
                                            <div className="text-sm text-red-700">
                                                {job.error || job.statusMessage}
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    // Reset job status to waiting and reprocess
                                                    setJobs(prev => prev.map(j =>
                                                        j.id === job.id ? { ...j, status: "waiting" as const, error: undefined } : j
                                                    ));
                                                    await processVideo(job);
                                                }}
                                                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                    <path d="M3 3v5h5" />
                                                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                                    <path d="M16 16h5v5" />
                                                </svg>
                                                再試行
                                            </button>
                                        </div>
                                    )}

                                    {/* Summary Content */}
                                    {job.status === "completed" && job.isExpanded && job.summary && (
                                        <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                                            <div className="bg-white rounded-xl border border-gray-100 p-4 max-h-60 overflow-y-auto text-sm prose prose-orange prose-sm max-w-none">
                                                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{job.summary}</ReactMarkdown>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-3">
                                                {job.audioBlob && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadAudio(job.file.name, job.audioBlob!);
                                                        }}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-[#FF9F1C] hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-orange-100"
                                                    >
                                                        <Download size={14} />
                                                        音声DL
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadSummary(job.file.name, job.summary!);
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs font-bold text-[#FF4081] hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-pink-100"
                                                >
                                                    <Download size={14} />
                                                    要約DL
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {job.status === "error" && job.error && (
                                        <div className="p-4 border-t border-red-100 bg-red-50">
                                            <p className="text-sm text-red-600 font-medium">エラー: {job.error}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
}
