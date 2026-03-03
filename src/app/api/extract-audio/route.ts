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

const CHUNK_SECONDS = 600; // 10 minutes

export async function POST(request: NextRequest) {
    const tempFiles: string[] = [];

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const chunked = formData.get('chunked') === 'true';

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

        // Reject files > 500MB on server (Vercel memory limit)
        if (file.size > 500 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'ファイルが大きすぎます（500MB以上）。ブラウザ側で処理してください。', fallbackToClient: true },
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

        // Get input file duration
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

        const audioStats = await stat(outputPath);
        const fileSizeMB = audioStats.size / (1024 * 1024);

        // Chunked mode: split audio into 10-minute segments
        if (chunked && duration > CHUNK_SECONDS) {
            const numChunks = Math.ceil(duration / CHUNK_SECONDS);
            const chunks: { base64: string; mimeType: string; startTime: number; duration: number }[] = [];

            for (let i = 0; i < numChunks; i++) {
                const startTime = i * CHUNK_SECONDS;
                const chunkDuration = Math.min(CHUNK_SECONDS, duration - startTime);
                const chunkPath = join(tmpdir(), `chunk_${uuid}_${i}.mp3`);
                tempFiles.push(chunkPath);

                await execFileAsync('ffmpeg', [
                    '-ss', String(startTime),
                    '-t', String(CHUNK_SECONDS),
                    '-i', outputPath,
                    '-c', 'copy', chunkPath, '-y'
                ], { timeout: 60000 });

                const chunkBuffer = await readFile(chunkPath);
                chunks.push({
                    base64: chunkBuffer.toString('base64'),
                    mimeType: 'audio/mp3',
                    startTime,
                    duration: chunkDuration,
                });
            }

            // Clean up temp files
            for (const tempFile of tempFiles) {
                try { await unlink(tempFile); } catch { /* ignore */ }
            }

            return NextResponse.json({
                success: true,
                chunked: true,
                chunks,
                originalSize: file.size,
                compressedSize: audioStats.size,
                compressionRatio: ((1 - audioStats.size / file.size) * 100).toFixed(1),
                duration,
                fileSizeMB: fileSizeMB.toFixed(2),
                numChunks,
            });
        }

        // Single mode (existing behavior)
        const audioBuffer = await readFile(outputPath);

        // Clean up temp files
        for (const tempFile of tempFiles) {
            try { await unlink(tempFile); } catch { /* ignore */ }
        }

        // Convert to base64
        const base64Audio = audioBuffer.toString('base64');

        return NextResponse.json({
            success: true,
            chunked: false,
            audio: base64Audio,
            mimeType: 'audio/mp3',
            originalSize: file.size,
            compressedSize: audioStats.size,
            compressionRatio: ((1 - audioStats.size / file.size) * 100).toFixed(1),
            duration,
            fileSizeMB: fileSizeMB.toFixed(2),
            needsFileAPI: fileSizeMB > 15,
        });

    } catch (error) {
        // Clean up temp files on error
        for (const tempFile of tempFiles) {
            try { await unlink(tempFile); } catch { /* ignore */ }
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
