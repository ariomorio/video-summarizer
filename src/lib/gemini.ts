import { GoogleGenerativeAI } from "@google/generative-ai";

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
    console.log("Initializing Gemini model: gemini-2.0-flash-exp");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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
    const defaultPrompt = `あなたはプロの編集者です。提供された音声データを分析し、以下の構成でサマリーを作成してください。
音声のみの解析となるため、文脈からスライドの内容などを補完し、論理的に構成してください。
以下執筆ルールに基づき、以下出力内容のみ出力するようにしてください。

#【執筆ルール】
「～と述べていました」という表現は避け、断定系で記述すること。
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

    const prompt = typeof window !== 'undefined'
        ? localStorage.getItem("custom_prompt") || defaultPrompt
        : defaultPrompt;

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

        const candidates = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-1.5-pro-001"];
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
