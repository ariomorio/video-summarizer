"use client";

import { useState, useEffect } from "react";
import { Key, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getAvailableModels } from "../lib/gemini";

interface ApiKeySettingsProps {
    apiKey: string;
    setApiKey: (key: string) => void;
}

export default function ApiKeySettings({ apiKey, setApiKey }: ApiKeySettingsProps) {
    const [inputKey, setInputKey] = useState("");
    const [isOpen, setIsOpen] = useState(true);
    const [checking, setChecking] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[] | null>(null);

    useEffect(() => {
        const savedKey = localStorage.getItem("gemini_api_key");
        if (savedKey) {
            setApiKey(savedKey);
            setInputKey(savedKey);
            setIsOpen(false);
        }
    }, [setApiKey]);

    const handleSave = () => {
        localStorage.setItem("gemini_api_key", inputKey);
        setApiKey(inputKey);
        setIsOpen(false);
        setAvailableModels(null);
    };

    const checkModels = async () => {
        if (!inputKey) return;
        setChecking(true);
        const models = await getAvailableModels(inputKey);
        setAvailableModels(models);
        setChecking(false);
    };

    return (
        <div className="w-full">
            {!isOpen && apiKey ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                            <Key size={14} />
                            <span>APIキー設定済み</span>
                        </div>
                        <button onClick={() => setIsOpen(true)} className="text-xs text-green-600 hover:underline">変更</button>
                    </div>

                    <button
                        onClick={checkModels}
                        disabled={checking}
                        className="w-full text-xs text-center text-blue-600 hover:underline flex items-center justify-center gap-1"
                    >
                        {checking && <Loader2 size={12} className="animate-spin" />}
                        デバッグ: 接続確認 & モデルチェック
                    </button>

                    {availableModels !== null && (
                        <div className="text-xs p-3 bg-gray-50 rounded border border-gray-100">
                            <p className="font-semibold mb-1">利用可能なモデル:</p>
                            {availableModels.length > 0 ? (
                                <>
                                    <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                        {availableModels.map(m => (
                                            <li key={m} className="text-green-600 font-medium">{m}</li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 text-gray-500 italic">
                                        ✓ 接続成功！{availableModels[0]} を使用中
                                    </p>
                                </>
                            ) : (
                                <p className="text-red-500">利用可能なモデルが見つかりません (404/認証エラー)</p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <input
                        type="password"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="Gemini APIキーを入力"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    />
                    <button
                        onClick={handleSave}
                        disabled={!inputKey}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                    >
                        APIキーを保存
                    </button>
                    <p className="text-xs text-gray-400">
                        Google AI Studioの右上から取得
                    </p>
                </div>
            )}
        </div>
    );
}
