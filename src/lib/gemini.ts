import { GoogleGenerativeAI } from "@google/generative-ai";

// Default prompt — blog-style writing that people actually read to the end
function getDefaultPrompt(): string {
    return `あなたは「読まれるブログ記事」を書くプロのライターです。
提供された音声を聞いて、その内容を **ブログ記事** として書き起こしてください。

ゴールは2つです。
1. **最後まで読めるもの** にすること
2. **動画を見なくても、次に何をすればいいかわかる** こと

単なる要約ではありません。
「読ませるライティング」「行動まで促すライティング」を意識してください。

---

# 書き方のルール（すべてのパターン共通）

**文体**
- 読者に語りかけるように書く（「ですます調」でOK。堅すぎず、くだけすぎず）
- 1文は短く。1〜2行で改行する
- 段落も短く。2〜3文ごとに空行を入れる
- スマホで読んでも疲れない見た目にする

**強調の使い方**
- 大事なフレーズは **太字** にして、流し読みでも要点がわかるようにする
- 特に伝えたいメッセージは、前後に空行を置いて独立させる

**引用ブロックの使い方**
- 「これだけは覚えて」というポイントや名言的なフレーズは > 引用ブロック で目立たせる

**禁止事項**
- 「〜と述べていました」「〜とのことです」は使わない
- 箇条書きだけで埋めない。文章として読める形にする
- 音声で話されていない内容は書かない
- 記号の乱用はしない（[]、：、★、■ などは使わない）

---

# パターン判定

音声を聞いて、以下のどちらに近いかを判断してください。

- **講義・セミナー型** → 一人の講師が教えている内容 → パターンA
- **グループコンサル型** → 質疑応答や個別相談が中心の内容 → パターンB

---

# パターンA 講義・セミナーの場合

以下の構成で、ブログ記事として書いてください。

---

## （音声の内容にふさわしいタイトル）

冒頭の1〜2文で、この講義が「何について」「誰向けに」話しているかを伝える導入文を書く。
読者が「自分に関係ある」と思えるような書き出しにする。

---

## この講義のポイント

ここでは3つのポイントを、それぞれ **太字のキーフレーズ＋1行の補足** で書く。

箇条書きでOKだが、ただ並べるのではなく、読者の関心を引く書き方にする。

---

## 内容まとめ

ここからが本文。トピックごとに見出しをつけて、ブログ記事のように書いていく。

### （トピック名）

**なぜこれが大事なのか** を1〜2文で伝えてから、具体的な内容に入る。

やり方や手順がある場合は、順番がわかるように書く。
ただし、箇条書きの羅列ではなく、流れが伝わる文章にする。

講師が話した具体例やエピソードがあれば、そのまま盛り込む。
実例があると読者の理解がグッと深まる。

> ここぞというポイントは、引用ブロックで強調する

（トピックは音声の内容に合わせて、必要な数だけ繰り返す）

---

## まとめ

記事全体を振り返って、**一番伝えたいこと** を短くまとめる。

読者の背中を押すような一言で締める。

> 大事なのは「完璧にしてから動く」ことじゃなくて、「まず動き出す」こと。

---

## 今すぐやること

ここが一番大事。読んだ人が **今日中に** 動けるくらい具体的に書く。

1. 何を
2. どうやって
3. どこまでやるか

を明確にする。3〜5個にまとめる。

---

# パターンB グループコンサル（グルコン）の場合

グルコンの場合は、Q&Aを中心とした構成で書く。
ただし箇条書きの羅列ではなく、**それぞれの相談を1本のミニ記事のように** 書く。
情報量は多めに。省略しない。

---

## （音声の内容にふさわしいタイトル）

冒頭で、このグルコンの全体テーマや雰囲気を1〜2文で伝える。

---

## 参加者と全体の流れ

- どんなメンバーが集まっているか（わかる範囲で）
- 全体としてどんなテーマや悩みが多かったか

---

## Q&A

### Q1. （質問の内容を、読者が「あ、自分も気になる」と思えるような見出しにする）

**相談の背景**

質問者がどんな状況にいて、何に悩んでいるのかを詳しく書く。
読者が「自分と似てる」と感じられるように、具体的に書く。

**回答のポイント**

回答者が伝えた内容を、読者が実践できるレベルで詳しく書く。

考え方やマインドの話があれば、それも省略しない。
具体的な手順やツール、数字の話があれば、すべて書く。
たとえ話やエピソードがあれば、そのまま盛り込む。

> 特に響くフレーズや、本質をついた一言は引用ブロックで強調する

**この相談から学べること**

この質問が自分に当てはまらなくても、他の人にも応用できるポイントを1〜2文で書く。

**ネクストアクション**

この相談をふまえて、読者がすぐ動けるアクションを具体的に書く。

---

### Q2.（次の質問。同じ構成で繰り返す）

（Q&Aの数は、音声の内容に合わせて必要な数だけ書く。省略しない。）

---

## 全体を通して学べること

グルコン全体をふまえて、参加者に共通するアドバイスや、根底にある大事な考え方をまとめる。

ここも箇条書きではなく、文章として読者に伝わるように書く。

---

## 今すぐやること

グルコンの内容をふまえて、読者が **今日中に** 動けるアクションを書く。

1. 何を
2. どうやって
3. どこまでやるか

を明確にする。3〜5個にまとめる。`;
}

// Helper function for exponential backoff retry
async function retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    onRetry?: (attempt: number, waitTime: number) => void
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Check if it's a rate limit error (429) or quota error
            const isRateLimitError =
                error?.status === 429 ||
                error?.message?.includes('429') ||
                error?.message?.includes('Resource has been exhausted') ||
                error?.message?.includes('quota');

            if (isRateLimitError && attempt < maxRetries - 1) {
                const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s

                if (onRetry) {
                    onRetry(attempt + 1, waitTime / 1000);
                }

                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            throw error;
        }
    }

    throw lastError;
}

export async function summarizeVideoAudio(apiKey: string, audioFile: File, setStatus: (status: string) => void): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Initializing Gemini model: gemini-2.0-flash");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    setStatus("音声をアップロード中...");

    // For File API support (browser), we can use the helper if available or inline data.
    // The prompt asked for File API usage.
    // The JS SDK supports `generateContent` with `inlineData` for base64.
    // For files > 20MB we need upload, but requirements said < 20MB inline is ok, BUT also said "use File API logic to be robust/simple" (simplified for this task).
    // Actually, the prompt said: "「Gemini APIへのファイルアップロードには...簡易化のためFile APIを使用するコードにしてください」 (Make it use File API logic for simplicity).
    // Wait, "File API" in JS usually means `File` object.
    // To send `File` to Gemini from browser:
    // 1. Convert to Base64 (inlineData) is easiest for small files.
    // 2. Upload via `GoogleAIFileManager` (requires Node/Server usually? No, it's for File API... wait. `GoogleAIFileManager` is often Node only).
    //  - Check docs: Client-side file API is strictly via `inlineData` usually for safety?
    //  - But prompt says "Make it use File API logic". I'll assume Inline Data is acceptable if I convert File -> Base64.
    //  - Or does it mean `fileToGenerativePart` helper pattern?

    // Implementation: Convert File to Base64 and send as inlineData.
    const base64Audio = await fileToGenerativePart(audioFile);

    // Get custom prompt from localStorage or use default
    const prompt = typeof window !== 'undefined'
        ? localStorage.getItem("custom_prompt") || getDefaultPrompt()
        : getDefaultPrompt();

    setStatus("Gemini APIにリクエスト送信中...");

    // Use retry with exponential backoff
    const result = await retryWithExponentialBackoff(
        () => model.generateContent([prompt, base64Audio]),
        3,
        (attempt, waitTime) => {
            setStatus(`レート制限に達しました。${waitTime}秒後に再試行 (${attempt}/3)...`);
        }
    );

    const response = await result.response;
    return response.text();
}

export async function getAvailableModels(apiKey: string): Promise<string[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // List models is not directly exposed in the high-level SDK reliably for browser in some versions, 
        // but we can try basic model retrieval or use a known list if the API supports listing.
        // Actually, the JS SDK does not always expose `listModels` easily in the client-side `GoogleGenerativeAI` class 
        // without the specific Manager.
        // But for "v1beta", we can try `getGenerativeModel` with a test.
        // A better debugging approach for 404 is just to print what we have.
        // However, correct usage of SDK for listing models usually requires `GoogleGenerativeAI.getGenerativeModel` isn't enough.

        // Let's rely on a direct fetch to the API endpoint for debugging if SDK fails, or just return the standard set to test.
        // Actually, let's just create a list of candidates to test connectivity.

        const candidates = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-1.5-pro-001"];
        const workingModels = [];

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // We generate a tiny content to test if it works, or count on it validating on init (usually lazy).
                // Best to try a dummy generation.
                await model.generateContent("Test");
                workingModels.push(modelName);
                console.log(`✅ Model ${modelName} is available`);
            } catch (e: any) {
                console.warn(`⚠️ Model ${modelName} not available (expected if using newer API key)`);
            }
        }
        return workingModels;

    } catch (error) {
        console.error("Error listing models:", error);
        return [];
    }
}

async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise as string,
            mimeType: "audio/mp3",
        },
    };
}

// Summarize audio split into chunks (for long videos > 10min)
export async function summarizeAudioChunks(
    apiKey: string,
    chunks: { base64: string; mimeType: string; startTime: number; duration: number }[],
    setStatus: (status: string) => void
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chunkSummaries: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const startMin = Math.floor(chunk.startTime / 60);
        const endMin = Math.floor((chunk.startTime + chunk.duration) / 60);

        setStatus(`チャンク ${i + 1}/${chunks.length} を分析中（${startMin}分〜${endMin}分）...`);

        const chunkPrompt = `以下の音声は録音の一部分です（${startMin}分〜${endMin}分）。
この部分で実際に話されている内容を、できるだけ詳しく・省略せずに書き起こしてください。
話されていないことは書かないでください。

以下を漏れなく拾ってください。
- 話されているトピックと、そのポイント
- 具体的なやり方、手順、アドバイス
- 質疑応答があれば、質問の背景と回答の内容を詳しく
- エピソードやたとえ話、具体例
- 響くフレーズや名言的な一言
- 大事な考え方やマインドの話`;

        const audioPart = {
            inlineData: {
                data: chunk.base64,
                mimeType: chunk.mimeType,
            },
        };

        const result = await retryWithExponentialBackoff(
            () => model.generateContent([chunkPrompt, audioPart]),
            3,
            (attempt, waitTime) => {
                setStatus(`チャンク ${i + 1}/${chunks.length}: レート制限。${waitTime}秒後に再試行 (${attempt}/3)...`);
            }
        );

        const response = await result.response;
        chunkSummaries.push(`【${startMin}分〜${endMin}分】\n${response.text()}`);
    }

    // Integrate all chunk summaries into a final summary
    setStatus("全チャンクの要約を統合中...");

    const customPrompt = typeof window !== 'undefined'
        ? localStorage.getItem("custom_prompt") || getDefaultPrompt()
        : getDefaultPrompt();

    const integrationPrompt = `以下は、長時間の音声を時間ごとに区切って書き起こしたものです。
これらを統合して、**ひとつの完成されたブログ記事** を作成してください。

- 内容の重複は整理し、時系列を考慮して自然な流れにまとめる
- 音声で実際に話された内容だけを使い、推測や補足は加えない
- 読者が最後まで読めて、動画を見なくても行動できる記事にする

--- 各パートの書き起こし ---
${chunkSummaries.join('\n\n---\n\n')}
--- ここまで ---

上記の内容をもとに、以下のフォーマットでブログ記事を作成してください。

${customPrompt}`;

    const integrationResult = await retryWithExponentialBackoff(
        () => model.generateContent(integrationPrompt),
        3,
        (attempt, waitTime) => {
            setStatus(`統合処理: レート制限。${waitTime}秒後に再試行 (${attempt}/3)...`);
        }
    );

    const integrationResponse = await integrationResult.response;
    return integrationResponse.text();
}

// Summarize audio from base64 string (for YouTube)
export async function summarizeAudioFromBase64(
    apiKey: string,
    base64Audio: string,
    mimeType: string,
    setStatus: (status: string) => void
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get custom prompt from localStorage or use default
    const prompt = typeof window !== 'undefined'
        ? localStorage.getItem("custom_prompt") || getDefaultPrompt()
        : getDefaultPrompt();

    setStatus("Gemini APIにリクエスト送信中...");

    const audioPart = {
        inlineData: {
            data: base64Audio,
            mimeType: mimeType || "audio/mp4",
        },
    };

    const result = await retryWithExponentialBackoff(
        () => model.generateContent([prompt, audioPart]),
        3,
        (attempt, waitTime) => {
            setStatus(`レート制限に達しました。${waitTime}秒後に再試行 (${attempt}/3)...`);
        }
    );

    const response = await result.response;
    return response.text();
}
