"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Save } from "lucide-react";

const DEFAULT_PROMPT = `あなたはプロの編集者です。提供された音声データを分析し、以下の構成でサマリーを作成してください。
音声のみの解析となるため、文脈からスライドの内容などを補完し、論理的に構成してください。
以下執筆ルールに基づき、以下出力内容のみ出力するようにしてください。

#【執筆ルール】
「〜と述べていました」という表現は避け、断定系で記述すること。
思考プロセスや手順（How-to）を重視して具体的に書くこと。
各セクションの間に <br> を入れて余白を作ること。

#【出力内容】
# 💡 【講義タイトルをここに入力】

<br>
<br>

---

## 📌 0. この講義のゴール（要点3選）

* **{学び1}**：
* **{学び2}**：
* **{学び3}**：

<br>
<br>

---

## 📖 1. 実践ノウハウと具体的プロセス

<br>

### 🟦 \`01｜{トピック名}（開始時間 00:00~）\`

**🧠 思考プロセス（Why & Logic）**
* * <br>

**🛠️ 具体的な手順・ノウハウ（How-to）**
* **要点:** * **ステップ1:** * **ステップ2:** * **ステップ3:** <br>

**✅ 具体的アクション**
* [ ] 

<br>
<br>

---

## 🚀 2. 講義直後に実行すべきアクション

<br>

* [ ] **{アクション1}**：
* [ ] **{アクション2}**：
* [ ] **{アクション3}**：

<br>

---`;

export default function PromptEditor() {
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedPrompt = localStorage.getItem("custom_prompt");
        if (savedPrompt) {
            setPrompt(savedPrompt);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("custom_prompt", prompt);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        if (confirm("デフォルトプロンプトに戻しますか？")) {
            setPrompt(DEFAULT_PROMPT);
            localStorage.setItem("custom_prompt", DEFAULT_PROMPT);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

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
                    <strong>💡 ヒント:</strong> プロンプトには以下のような要素を含めることができます：
                </p>
                <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                    <li>出力形式の指定（箇条書き、段落形式など）</li>
                    <li>含めてほしい情報（要点、アクションアイテムなど）</li>
                    <li>トーンや文体の指定（フォーマル、カジュアルなど）</li>
                    <li>言語の指定（日本語、英語など）</li>
                </ul>
            </div>
        </div>
    );
}
