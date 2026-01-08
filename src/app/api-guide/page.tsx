"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Key, ExternalLink, CheckCircle, AlertCircle, ArrowRight, Copy } from "lucide-react";
import { useState } from "react";

export default function ApiGuidePage() {
    const [copied, setCopied] = useState(false);

    const copyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FF9F1C] to-[#FF4081] rounded-2xl shadow-xl shadow-orange-500/30 mb-6">
                        <Key className="text-white" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">APIキー取得ガイド</h1>
                    <p className="text-gray-600">初めての方でも簡単！3ステップで完了します</p>
                </div>

                {/* Important Notice */}
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-100 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm">
                            <AlertCircle className="text-[#FF9F1C]" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">📌 重要なポイント</h3>
                            <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc marker:text-[#FF9F1C]">
                                <li><strong>完全無料</strong>で取得できます（クレジットカード不要）</li>
                                <li>Googleアカウントが必要です</li>
                                <li>取得したAPIキーは<strong>このアプリ専用</strong>に使用します</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Step 1 */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#FF9F1C] to-[#FF4081] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            1
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Google AI Studioにアクセス</h2>

                            <p className="text-gray-600 mb-4 leading-relaxed">
                                Gemini APIキーはGoogleの公式サイト「AI Studio」で発行します。以下のボタンからアクセスしてください。
                            </p>

                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all hover:scale-[1.02] font-bold shadow-lg"
                            >
                                <ExternalLink size={18} />
                                Google AI Studioを開く
                            </a>

                            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">URL check</p>
                                    <button
                                        onClick={() => copyUrl("https://aistudio.google.com/app/apikey")}
                                        className="text-xs text-[#FF4081] hover:text-pink-700 flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <Copy size={12} />
                                        {copied ? "コピー完了" : "URLをコピー"}
                                    </button>
                                </div>
                                <code className="text-sm text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-100 block">
                                    https://aistudio.google.com/app/apikey
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex items-start gap-5 relative z-10">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#FF4081] to-[#FF9F1C] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            2
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">APIキーを作成</h2>

                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 bg-green-100 p-1 rounded text-green-600">
                                        <ArrowRight size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 mb-1">「Create API key」ボタンをクリック</p>
                                        <p className="text-sm text-gray-600">
                                            画面左上の青いボタンを探してください。
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-1 bg-green-100 p-1 rounded text-green-600">
                                        <ArrowRight size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 mb-1">プロジェクトを選択</p>
                                        <p className="text-sm text-gray-600">
                                            検索窓で「Create API key in new project」を選びます。これで自動的にプロジェクトが作成されます。
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-3">
                                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                                <p className="text-sm font-bold text-green-800">
                                    成功すると、「AIza」で始まる長い文字列が表示されます！
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex items-start gap-5 relative z-10">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            3
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">このアプリに設定</h2>

                            <div className="space-y-4">
                                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                    <p className="font-bold text-gray-900 mb-3 text-sm border-b border-gray-100 pb-2">最後の手順</p>
                                    <ol className="text-sm space-y-3 text-gray-600 ml-2">
                                        <li className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">1</span>
                                            作成されたAPIキーをコピー
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">2</span>
                                            このアプリに戻る
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">3</span>
                                            右上の「API設定」に貼り付けて保存
                                        </li>
                                    </ol>
                                </div>
                            </div>

                            <div className="mt-6 py-4 text-center">
                                <p className="text-gray-900 font-bold mb-2">🎉 準備完了！</p>
                                <p className="text-sm text-gray-500">
                                    これで最新のAIモデルを使って、動画の要約を作成できます。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="bg-white border-l-4 border-red-400 p-6 rounded-r-xl shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="bg-red-50 p-2 rounded-full">
                            <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 mb-2">🔒 セキュリティに関する注意</h3>
                            <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                                <li>APIキーは<strong>パスワードと同じ</strong>くらい大切です</li>
                                <li>他人への共有や、SNSへの投稿は絶対に避けてください</li>
                                <li>このアプリはAPIキーをブラウザ内にのみ保存し、外部サーバーには送信しません</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
