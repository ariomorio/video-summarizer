import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
    let tempFilePath = '';

    try {
        const { audio, mimeType, apiKey, prompt } = await request.json();

        if (!audio || !apiKey) {
            return NextResponse.json(
                { error: '音声データとAPIキーが必要です' },
                { status: 400 }
            );
        }

        // Initialize file manager
        const fileManager = new GoogleAIFileManager(apiKey);

        // Write audio to temp file
        const uuid = randomUUID();
        tempFilePath = join(tmpdir(), `audio_${uuid}.mp3`);
        const audioBuffer = Buffer.from(audio, 'base64');
        await writeFile(tempFilePath, audioBuffer);

        // Upload file to Gemini
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: mimeType || 'audio/mp3',
            displayName: `audio_${uuid}`,
        });

        // Wait for file to be processed
        let file = await fileManager.getFile(uploadResult.file.name);
        while (file.state === 'PROCESSING') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === 'FAILED') {
            throw new Error('ファイルのアップロードに失敗しました');
        }

        // Generate content using the uploaded file
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const fallbackPrompt = 'この音声の内容を、ブログ記事のようにわかりやすく詳しくまとめてください。読者が最後まで読めて、動画を見なくても行動できる記事にしてください。';

        const result = await model.generateContent([
            prompt || fallbackPrompt,
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri,
                },
            },
        ]);

        const response = await result.response;
        const summary = response.text();

        // Clean up: delete the uploaded file
        try {
            await fileManager.deleteFile(file.name);
        } catch {
            // Ignore delete errors
        }

        // Clean up temp file
        try {
            await unlink(tempFilePath);
        } catch {
            // Ignore cleanup errors
        }

        return NextResponse.json({
            success: true,
            summary,
        });

    } catch (error) {
        // Clean up temp file on error
        if (tempFilePath) {
            try {
                await unlink(tempFilePath);
            } catch {
                // Ignore cleanup errors
            }
        }

        console.error('Gemini File API error:', error);
        const msg = (error as Error).message || '';
        const safeMessage = msg.includes('API key') || msg.includes('quota')
            ? 'APIキーが無効、またはクォータ上限に達しました。設定を確認してください。'
            : 'AI処理中にエラーが発生しました。しばらく待ってから再試行してください。';
        return NextResponse.json(
            { error: safeMessage },
            { status: 500 }
        );
    }
}
