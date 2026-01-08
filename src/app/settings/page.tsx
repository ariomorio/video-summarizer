"use client";

import { useState, useEffect } from "react";
import ApiKeySettings from "@/components/ApiKeySettings";
import PromptEditor from "@/components/PromptEditor";
import { Settings as SettingsIcon, FileText, Zap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState("");
    const [debugMode, setDebugMode] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("debug_mode");
        setDebugMode(saved === "true");
    }, []);

    const toggleDebugMode = () => {
        const newValue = !debugMode;
        setDebugMode(newValue);
        localStorage.setItem("debug_mode", String(newValue));
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* API Key Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔑</span>
                        APIキー設定
                    </h2>
                    <ApiKeySettings apiKey={apiKey} setApiKey={setApiKey} />
                </div>

                {/* Prompt Customization */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        プロンプトカスタマイズ
                    </h2>
                    <PromptEditor />
                </div>

                {/* Debug Mode */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap size={20} />
                        デバッグモード
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">詳細ログを表示</p>
                            <p className="text-xs text-gray-500">コンソールに詳細な処理ログを出力します</p>
                        </div>
                        <button
                            onClick={toggleDebugMode}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${debugMode ? "bg-blue-600" : "bg-gray-200"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${debugMode ? "translate-x-6" : "translate-x-1"
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* App Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <SettingsIcon size={20} />
                        アプリ情報
                    </h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">バージョン</span>
                            <span className="font-medium">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">使用モデル</span>
                            <span className="font-medium">Gemini 2.0 Flash</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">フレームワーク</span>
                            <span className="font-medium">Next.js 16</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
