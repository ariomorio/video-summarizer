"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Video, Key, Upload, History, FileText, Sparkles, CheckCircle } from "lucide-react";

export default function HelpPage() {
    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF9F1C] to-[#FF4081] rounded-2xl shadow-lg shadow-orange-500/30 mb-4">
                        <BookOpen className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">使い方ガイド</h1>
                    <p className="text-gray-600">動画サマリー生成ツールの使い方を分かりやすく説明します</p>
                </div>

                {/* Step 1: API Key Setup */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                            <span className="text-[#FF9F1C] font-bold text-lg">1</span>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800">
                                <Key size={24} className="text-[#FF9F1C]" />
                                APIキーの設定
                            </h2>
                            <div className="space-y-4 text-gray-600">
                                <p className="leading-relaxed">
                                    まず最初に、Google Gemini APIのキーを設定する必要があります。
                                </p>

                                <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-100 rounded-xl p-5">
                                    <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="bg-[#FF4081] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">!</span>
                                        APIキーをまだ取得していない方へ
                                    </p>
                                    <a
                                        href="/api-guide"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF9F1C] to-[#FF4081] text-white rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all text-sm font-bold"
                                    >
                                        詳しいAPIキー取得ガイドを見る
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                </div>

                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                                    <p className="text-sm font-bold text-gray-900 mb-3">📝 手順：</p>
                                    <ol className="text-sm space-y-3 ml-2 text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">1</span>
                                            画面右上の「<span className="font-bold text-[#FF4081]">API設定</span>」ボタンをクリック
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">2</span>
                                            表示されたウィンドウにAPIキーを入力
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">3</span>
                                            「<span className="font-bold text-gray-900">保存</span>」ボタンをクリック
                                        </li>
                                    </ol>
                                </div>
                                <p className="text-sm text-gray-500 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Sparkles size={14} className="text-[#FF9F1C]" />
                                    <span>APIキーは一度設定すれば、ブラウザに保存されます。次回からは入力不要です。</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Upload Video */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center border border-pink-100">
                            <span className="text-[#FF4081] font-bold text-lg">2</span>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800">
                                <Upload size={24} className="text-[#FF4081]" />
                                動画をアップロード
                            </h2>
                            <div className="space-y-4 text-gray-600">
                                <p className="leading-relaxed">
                                    サマリーを作成したい動画ファイルをアップロードします。
                                </p>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Single Upload */}
                                    <div className="bg-[#FFF9F5] border border-orange-100 rounded-xl p-5 hover:border-[#FF9F1C] transition-colors group">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                            <Video className="text-[#FF9F1C]" size={20} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">単一モード</p>
                                        <p className="text-xs text-gray-500 mb-3">1つの動画をじっくり分析</p>
                                        <ol className="text-xs space-y-1.5 ml-4 list-decimal text-gray-600">
                                            <li>「単一」タブを選択</li>
                                            <li>エリアをクリックorドラッグ</li>
                                            <li>「AI要約を開始」</li>
                                        </ol>
                                    </div>

                                    {/* Batch Upload */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 hover:border-[#FF4081] transition-colors group">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                            <History className="text-[#FF4081]" size={20} />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">一括モード</p>
                                        <p className="text-xs text-gray-500 mb-3">複数の動画をまとめて処理</p>
                                        <ol className="text-xs space-y-1.5 ml-4 list-decimal text-gray-600">
                                            <li>「一括」タブを選択</li>
                                            <li>複数ファイルを選択</li>
                                            <li>「一括処理を開始」</li>
                                        </ol>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400">
                                    対応形式: MP4, MOV, AVI (最大2GB)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3: View Summary */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                            <span className="text-[#FF9F1C] font-bold text-lg">3</span>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800">
                                <Sparkles size={24} className="text-[#FF9F1C]" />
                                サマリーを確認
                            </h2>
                            <div className="space-y-4 text-gray-600">
                                <p className="leading-relaxed">
                                    AIが動画の内容を分析して、分かりやすいサマリーを生成します。
                                </p>
                                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                                    <p className="text-sm font-bold text-gray-900 mb-3">✨ 処理の流れ：</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0"><CheckCircle size={14} /></div>
                                            <span>動画から音声を抽出</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0"><CheckCircle size={14} /></div>
                                            <span>Gemini AIで内容を分析</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0"><CheckCircle size={14} /></div>
                                            <span>構造化されたサマリーを生成</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    サマリーはMarkdwon形式でコピーやダウンロードが可能です。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 4: History */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                            <span className="text-gray-500 font-bold text-lg">4</span>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800">
                                <History size={24} className="text-gray-500" />
                                履歴を確認
                            </h2>
                            <div className="space-y-4 text-gray-600">
                                <p className="leading-relaxed">
                                    過去に生成したサマリーは自動的に保存され、いつでも確認できます。
                                </p>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                                    <ol className="text-sm space-y-2 ml-4 list-decimal text-gray-600">
                                        <li>サイドバーの「<strong>履歴</strong>」をクリック</li>
                                        <li>サブメニューから見たい履歴を選択</li>
                                        <li>メイン画面にサマリーが表示されます</li>
                                    </ol>
                                </div>
                                <p className="text-xs text-gray-400">
                                    ※ 最大20件まで自動保存されます
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-3xl border border-orange-100 p-8">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900">
                        <FileText size={20} className="text-[#FF9F1C]" />
                        便利な機能
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/50">
                            <p className="font-bold text-gray-800 mb-2 text-sm">⚙️ プロンプトカスタマイズ</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                現在はデフォルトのプロンプトを使用していますが、将来的にはカスタマイズ機能も実装予定です。
                            </p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-white/50">
                            <p className="font-bold text-gray-800 mb-2 text-sm">📥 一括ダウンロード</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                一括モードで処理した動画のサマリーを、まとめて1つのMarkdownファイルとしてダウンロードできます。
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 pl-2 border-l-4 border-[#FF9F1C]">よくある質問</h2>
                    <div className="grid gap-3">
                        <details className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 group open:bg-gray-50 transition-colors">
                            <summary className="font-bold text-gray-800 cursor-pointer flex items-center justify-between list-none">
                                <span>Q. APIキーはどこで取得できますか？</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="mt-3 text-sm text-gray-600 leading-relaxed pl-1">
                                Google AI Studioで無料で取得できます。詳しくは<a href="/api-guide" className="text-[#FF4081] hover:underline font-bold">APIキー取得ガイド</a>をご覧ください。設定ページの「デバッグ」機能で接続確認も可能です。
                            </p>
                        </details>
                        <details className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 group open:bg-gray-50 transition-colors">
                            <summary className="font-bold text-gray-800 cursor-pointer flex items-center justify-between list-none">
                                <span>Q. 処理にどれくらい時間がかかりますか？</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="mt-3 text-sm text-gray-600 leading-relaxed pl-1">
                                動画の長さによりますが、通常1〜3分程度です。ブラウザ上で音声処理を行うため、インターネット速度よりもPCの処理能力に依存する場合があります。
                            </p>
                        </details>
                        <details className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 group open:bg-gray-50 transition-colors">
                            <summary className="font-bold text-gray-800 cursor-pointer flex items-center justify-between list-none">
                                <span>Q. 対応している動画形式は？</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="mt-3 text-sm text-gray-600 leading-relaxed pl-1">
                                MP4、MOV、AVI、MKVなど、一般的な動画形式に対応しています。音声が含まれていない動画は処理できません。
                            </p>
                        </details>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
