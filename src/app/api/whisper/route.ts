import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
    try {
        const { audio, mimeType, apiKey } = await request.json();

        if (!audio || !apiKey) {
            return NextResponse.json(
                { error: '音声データとAPIキーが必要です' },
                { status: 400 }
            );
        }

        const openai = new OpenAI({ apiKey });

        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audio, 'base64');

        // Create a File-like object for the API
        const audioBlob = new Blob([audioBuffer], { type: mimeType || 'audio/mp4' });
        const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });

        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'ja', // Default to Japanese, can be made configurable
            response_format: 'verbose_json',
        });

        return NextResponse.json({
            success: true,
            transcript: transcription.text,
            segments: transcription.segments,
            duration: transcription.duration,
        });

    } catch (error) {
        console.error('Whisper transcription error:', error);
        return NextResponse.json(
            { error: `文字起こしエラー: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
