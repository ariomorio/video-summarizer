"use client";

import { useState, useEffect } from "react";
import { X, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
    const [inputKey, setInputKey] = useState("");

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem("gemini_api_key");
            if (storedKey) setInputKey(storedKey);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem("gemini_api_key", inputKey);
        // Force update for components listening to storage
        window.dispatchEvent(new Event("storage"));
        onClose();
        // Reload to ensure all components pick up the new key if they don't listen to storage event
        // Or we can rely on page reload. For now, let's just close.
        // Better UX: notify user or trigger a re-render. 
        // Since Dashboard might not be listening, a reload might be needed or a custom event.
        // But for now, fixing the reference error is priority.
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[99]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
                    >
                        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-[#FF9F1C] to-[#FF4081] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                                    <Key className="text-white" size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">APIキーの設定</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Google Gemini APIキーを入力してください
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="password"
                                        value={inputKey}
                                        onChange={(e) => setInputKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF9F1C] focus:border-transparent transition-all"
                                        autoFocus
                                    />
                                    <p className="text-xs text-center mt-3 text-gray-400">
                                        キーはブラウザにのみ保存されます
                                    </p>
                                    <div className="mt-3 text-center">
                                        <a
                                            href="/api-guide"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[#FF4081] hover:text-[#FF9F1C] font-medium transition-colors inline-flex items-center gap-1"
                                        >
                                            <Key size={12} />
                                            APIキーの取得方法はこちら
                                        </a>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!inputKey?.trim()}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
                                    >
                                        保存
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
