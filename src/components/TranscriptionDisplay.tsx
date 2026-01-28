"use client";

import { useState } from 'react';
import { Copy, Check, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptionDisplayProps {
    transcript: string;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
    }>;
}

export default function TranscriptionDisplay({ transcript, segments }: TranscriptionDisplayProps) {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(transcript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!transcript) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-blue-100 overflow-hidden"
        >
            {/* Header */}
            <div
                className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">文字起こし（Whisper）</h3>
                        <p className="text-xs text-gray-500">
                            {transcript.length.toLocaleString()} 文字
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCopy();
                        }}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
                    >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        {copied ? "コピー完了" : "コピー"}
                    </button>
                    {isExpanded ? (
                        <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                    )}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 max-h-96 overflow-y-auto">
                            {segments && segments.length > 0 ? (
                                <div className="space-y-3">
                                    {segments.map((segment, index) => (
                                        <div key={index} className="flex gap-4 text-sm">
                                            <span className="text-blue-500 font-mono text-xs bg-blue-50 px-2 py-1 rounded flex-shrink-0">
                                                {formatTime(segment.start)}
                                            </span>
                                            <p className="text-gray-700 leading-relaxed">
                                                {segment.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {transcript}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
