import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'YouTube URLが必要です' },
                { status: 400 }
            );
        }

        // Validate YouTube URL
        if (!ytdl.validateURL(url)) {
            return NextResponse.json(
                { error: '無効なYouTube URLです' },
                { status: 400 }
            );
        }

        // Get video info
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;
        const duration = parseInt(info.videoDetails.lengthSeconds);

        // Check duration (limit to 30 minutes for free API)
        if (duration > 1800) {
            return NextResponse.json(
                { error: '30分以上の動画は処理できません' },
                { status: 400 }
            );
        }

        // Get audio-only format
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        if (audioFormats.length === 0) {
            return NextResponse.json(
                { error: '音声トラックが見つかりません' },
                { status: 400 }
            );
        }

        // Get the best audio format
        const format = ytdl.chooseFormat(audioFormats, { quality: 'highestaudio' });

        // Stream the audio
        const stream = ytdl(url, { format });
        const chunks: Buffer[] = [];

        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }

        const audioBuffer = Buffer.concat(chunks);
        const base64Audio = audioBuffer.toString('base64');

        return NextResponse.json({
            success: true,
            title,
            duration,
            audio: base64Audio,
            mimeType: format.mimeType || 'audio/mp4',
        });

    } catch (error) {
        console.error('YouTube processing error:', error);
        return NextResponse.json(
            { error: `YouTube処理エラー: ${(error as Error).message}` },
            { status: 500 }
        );
    }
}
