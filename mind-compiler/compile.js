import { OfflineCompiler } from 'mind-ar/src/image-target/offline-compiler.js';
import { loadImage } from 'mind-ar/node_modules/canvas/index.js';
import { writeFileSync } from 'fs';

async function run(imagePath, outputPath) {
  const img = await loadImage(imagePath);
  const compiler = new OfflineCompiler();

  await compiler.compileImageTargets([img], (progress) => {
    process.stderr.write(`progress: ${progress.toFixed(1)}%\n`);
  });

  const buffer = compiler.exportData();
  writeFileSync(outputPath, buffer);
  console.log('DONE');
}

const [, , imagePath, outputPath] = process.argv;

if (!imagePath || !outputPath) {
  console.error('Usage: node compile.js <input_image_path> <output_mind_path>');
  process.exit(1);
}

run(imagePath, outputPath).catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});