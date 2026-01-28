"use client";

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Copy, Check } from "lucide-react";
import { useState } from 'react';
import { motion } from 'framer-motion';
import ExportButtons from './ExportButtons';

interface SummaryDisplayProps {
    markdown: string;
    filename?: string;
}

export default function SummaryDisplay({ markdown, filename }: SummaryDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!markdown) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full"
        >
            <div className="h-full bg-transparent">
                <div className="bg-transparent px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <h2 className="font-semibold text-lg text-gray-800">生成されたサマリー</h2>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
                    >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        {copied ? "コピーしました！" : "コピー"}
                    </button>
                </div>

                <div className="p-8 prose prose-slate max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-li:text-gray-600">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{markdown}</ReactMarkdown>
                </div>

                {/* Export Buttons */}
                <ExportButtons markdown={markdown} filename={filename || "summary"} />
            </div>
        </motion.div>
    );
}
