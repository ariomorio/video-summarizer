"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Save } from "lucide-react";
import { getDefaultPrompt } from "../lib/gemini";

export default function PromptEditor() {
    const [prompt, setPrompt] = useState("");
    const [saved, setSaved] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const savedPrompt = localStorage.getItem("custom_prompt");
        setPrompt(savedPrompt || getDefaultPrompt());
        setLoaded(true);
    }, []);

    const handleSave = () => {
        localStorage.setItem("custom_prompt", prompt);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        if (confirm("デフォルトプロンプトに戻しますか？")) {
            const defaultPrompt = getDefaultPrompt();
            setPrompt(defaultPrompt);
            localStorage.removeItem("custom_prompt");
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    if (!loaded) return null;

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">
                動画要約時に使用するプロンプトをカスタマイズできます。変更後は必ず保存してください。
            </p>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-96 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-mono resize-none"
                placeholder="プロンプトを入力..."
            />

            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                    <Save size={16} />
                    {saved ? "保存しました！" : "プロンプトを保存"}
                </button>
                <button
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm flex items-center gap-2"
                >
                    <RotateCcw size={16} />
                    デフォルトに戻す
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                    <strong>ヒント:</strong> プロンプトには以下のような要素を含めることができます：
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                    <li>出力形式の指定（ブログ風、箇条書き、Q&A形式など）</li>
                    <li>含めてほしい情報（要点、アクションアイテムなど）</li>
                    <li>トーンや文体の指定（語りかけ、フォーマルなど）</li>
                    <li>講義型 / グルコン型の判定ルール</li>
                </ul>
            </div>
        </div>
    );
}
