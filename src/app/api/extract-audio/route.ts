import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    const tempFiles: string[] = [];

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'ファイルが必要です' },
                { status: 400 }
            );
        }

        // Create temp file paths
        const uuid = randomUUID();
        const inputPath = join(tmpdir(), `input_${uuid}.mp4`);
        const outputPath = join(tmpdir(), `output_${uuid}.mp3`);
        tempFiles.push(inputPath, outputPath);

        // Write uploaded file to temp
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(inputPath, buffer);

        // Get input file duration for progress estimation
        let duration = 0;
        try {
            const { stdout } = await execAsync(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
            );
            duration = parseFloat(stdout.trim()) || 0;
        } catch {
            // Duration detection failed, continue anyway
        }

        // Extract audio with aggressive compression for speech
        // 64kbps mono is enough for speech recognition
        // -ac 1: mono channel
        // -ar 16000: 16kHz sample rate (optimal for speech)
        // -b:a 64k: 64kbps bitrate
        const ffmpegCmd = `ffmpeg -i "${inputPath}" -vn -ac 1 -ar 16000 -b:a 64k -f mp3 "${outputPath}" -y`;

        await execAsync(ffmpegCmd, { timeout: 300000 }); // 5 min timeout

        // Read the output file
        const audioBuffer = await readFile(outputPath);
        const audioStats = await stat(outputPath);
        const fileSizeMB = audioStats.size / (1024 * 1024);

        // Clean up temp files
        for (const tempFile of tempFiles) {
            try {
                await unlink(tempFile);
            } catch {
                // Ignore cleanup errors
            }
        }

        // Convert to base64
        const base64Audio = audioBuffer.toString('base64');

        return NextResponse.json({
            success: true,
            audio: base64Audio,
            mimeType: 'audio/mp3',
            originalSize: file.size,
            compressedSize: audioStats.size,
            compressionRatio: ((1 - audioStats.size / file.size) * 100).toFixed(1),
            duration,
            fileSizeMB: fileSizeMB.toFixed(2),
            needsFileAPI: fileSizeMB > 15, // Flag if file is large
        });

    } catch (error) {
        // Clean up temp files on error
        for (const tempFile of tempFiles) {
            try {
                await unlink(tempFile);
            } catch {
                // Ignore cleanup errors
            }
        }

        console.error('Audio extraction error:', error);

        // Check if FFmpeg is not installed
        if ((error as Error).message?.includes('ffmpeg')) {
            return NextResponse.json(
                { error: 'FFmpegがインストールされていません。サーバーにFFmpegをインストールしてください。', fallbackToClient: true },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: `音声抽出エラー: ${(error as Error).message}`, fallbackToClient: true },
            { status: 500 }
        );
    }
}

// Next.js 13+ App Router handles body parsing automatically for formData
