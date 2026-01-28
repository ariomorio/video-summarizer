"use client";

import { useState, useEffect } from "react";
import ApiKeySettings from "@/components/ApiKeySettings";
import PromptEditor from "@/components/PromptEditor";
import { Settings as SettingsIcon, FileText, Zap, Key, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");
    const [openaiKeyInput, setOpenaiKeyInput] = useState("");
    const [isOpenaiOpen, setIsOpenaiOpen] = useState(true);
    const [debugMode, setDebugMode] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("debug_mode");
        setDebugMode(saved === "true");

        const savedOpenaiKey = localStorage.getItem("openai_api_key");
        if (savedOpenaiKey) {
            setOpenaiKey(savedOpenaiKey);
            setOpenaiKeyInput(savedOpenaiKey);
            setIsOpenaiOpen(false);
        }
    }, []);

    const toggleDebugMode = () => {
        const newValue = !debugMode;
        setDebugMode(newValue);
        localStorage.setItem("debug_mode", String(newValue));
    };

    const handleSaveOpenaiKey = () => {
        localStorage.setItem("openai_api_key", openaiKeyInput);
        setOpenaiKey(openaiKeyInput);
        setIsOpenaiOpen(false);
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Gemini API Key Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-2xl">🔑</span>
                        Gemini APIキー（要約用）
                    </h2>
                    <ApiKeySettings apiKey={apiKey} setApiKey={setApiKey} />
                </div>

                {/* OpenAI API Key Settings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-2xl">🎙️</span>
                        OpenAI APIキー（Whisper文字起こし用・任意）
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        OpenAI APIキーを設定すると、YouTubeモードで文字起こし機能が使えます。
                    </p>
                    {!isOpenaiOpen && openaiKey ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                <CheckCircle size={14} />
                                <span>OpenAI APIキー設定済み（Whisper有効）</span>
                            </div>
                            <button onClick={() => setIsOpenaiOpen(true)} className="text-xs text-green-600 hover:underline">変更</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input
                                type="password"
                                value={openaiKeyInput}
                                onChange={(e) => setOpenaiKeyInput(e.target.value)}
                                placeholder="sk-... 形式のOpenAI APIキーを入力"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm"
                            />
                            <button
                                onClick={handleSaveOpenaiKey}
                                disabled={!openaiKeyInput}
                                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                            >
                                OpenAI APIキーを保存
                            </button>
                            <p className="text-xs text-gray-400">
                                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    OpenAI Platform
                                </a>
                                からAPIキーを取得
                            </p>
                        </div>
                    )}
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
                            <span className="font-medium">2.0.0 Enhanced</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">要約AI</span>
                            <span className="font-medium">Gemini 2.0 Flash</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">文字起こし</span>
                            <span className="font-medium">OpenAI Whisper</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">フレームワーク</span>
                            <span className="font-medium">Next.js 16</span>
                        </div>
                    </div>

                    {/* New Features */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-700 mb-2">v2.0 新機能:</p>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                YouTube URL直接入力対応
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Whisper文字起こし機能
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                PDF/Word/Notionエクスポート
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
