const { cpSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const src = join(__dirname, '..', 'node_modules', '@ffmpeg', 'core', 'dist', 'umd');
const dest = join(__dirname, '..', 'public', 'ffmpeg');

if (!existsSync(src)) {
    console.warn('⚠️ @ffmpeg/core not found in node_modules, skipping copy');
    process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(join(src, 'ffmpeg-core.js'), join(dest, 'ffmpeg-core.js'));
cpSync(join(src, 'ffmpeg-core.wasm'), join(dest, 'ffmpeg-core.wasm'));
console.log('✅ FFmpeg core files copied to public/ffmpeg/');
