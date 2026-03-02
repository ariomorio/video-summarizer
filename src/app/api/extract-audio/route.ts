import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execFileAsync = promisify(execFile);

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const ALLOWED_MIMES = [
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/x-matroska', 'video/mpeg',
];

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

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'ファイルサイズが上限（2GB）を超えています' },
                { status: 413 }
            );
        }

        // MIME type validation
        if (file.type && !ALLOWED_MIMES.includes(file.type)) {
            return NextResponse.json(
                { error: '対応していないファイル形式です。MP4, MOV, AVI, WebM, MKV形式に対応しています。' },
                { status: 415 }
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
            const { stdout } = await execFileAsync('ffprobe', [
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                inputPath
            ]);
            duration = parseFloat(stdout.trim()) || 0;
        } catch {
            // Duration detection failed, continue anyway
        }

        // Extract audio with aggressive compression for speech
        // 64kbps mono is enough for speech recognition
        await execFileAsync('ffmpeg', [
            '-i', inputPath,
            '-vn', '-ac', '1', '-ar', '16000',
            '-b:a', '64k', '-f', 'mp3', outputPath, '-y'
        ], { timeout: 300000 }); // 5 min timeout

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
        if ((error as Error).message?.includes('ENOENT')) {
            return NextResponse.json(
                { error: 'サーバーの音声処理環境が利用できません。クライアント側での処理にフォールバックします。', fallbackToClient: true },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: '音声抽出中にエラーが発生しました。しばらく待ってから再試行してください。', fallbackToClient: true },
            { status: 500 }
        );
    }
}

// Next.js 13+ App Router handles body parsing automatically for formData
