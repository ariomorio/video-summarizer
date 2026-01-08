"use client";

import { useState, useEffect } from "react";
import { Trash2, Calendar, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import DashboardLayout from "@/components/DashboardLayout";

interface HistoryItem {
    id: string;
    filename: string;
    summary: string;
    timestamp: number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("summary_history");
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    const deleteItem = (id: string) => {
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        localStorage.setItem("summary_history", JSON.stringify(updated));
        if (selectedItem?.id === id) {
            setSelectedItem(null);
        }
    };

    const clearAll = () => {
        if (confirm("全ての履歴を削除しますか？")) {
            setHistory([]);
            setSelectedItem(null);
            localStorage.removeItem("summary_history");
        }
    };

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* History List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <span className="text-2xl">📜</span>
                                履歴
                            </h2>
                            {history.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    全て削除
                                </button>
                            )}
                        </div>

                        {history.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">
                                まだ履歴がありません
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedItem?.id === item.id
                                            ? "bg-blue-50 border-blue-200"
                                            : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                                                    <FileText size={14} />
                                                    {item.filename}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                    <Calendar size={12} />
                                                    {new Date(item.timestamp).toLocaleString("ja-JP")}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteItem(item.id);
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Display */}
                <div className="lg:col-span-2">
                    {selectedItem ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold mb-4">{selectedItem.filename}</h3>
                            <div className="prose prose-slate max-w-none">
                                <ReactMarkdown>{selectedItem.summary}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            <p className="text-gray-400">左側から履歴を選択してください</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
