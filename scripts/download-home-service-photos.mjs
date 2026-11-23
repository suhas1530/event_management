/**
 * Regenerates the local home-services photography from vetted Unsplash photos.
 *
 * Every entry in `home-service-photos.json` is a real, publicly documented
 * Unsplash photograph (Unsplash License — free to use, no attribution required;
 * credits are still recorded in docs/PHOTO_CREDITS.md). Images are downloaded
 * once, resized to a sensible web width and written as WebP so the app never
 * hotlinks a third-party CDN at runtime.
 *
 * Usage: node scripts/download-home-service-photos.mjs
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const manifest = JSON.parse(readFileSync(resolve('scripts/home-service-photos.json'), 'utf8'))
const outDir = resolve('public/images/services')
mkdirSync(outDir, { recursive: true })

let ok = 0
for (const item of manifest) {
  const url = item.source === 'pexels'
    ? `https://images.pexels.com/photos/${item.photo}/pexels-photo-${item.photo}.jpeg?auto=compress&cs=tinysrgb&w=1600`
    : `https://images.unsplash.com/photo-${item.photo}?w=1600&q=85&fm=jpg`
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const input = Buffer.from(await response.arrayBuffer())
    if (input.byteLength < 10_000) throw new Error(`suspiciously small (${input.byteLength} bytes)`)
    await sharp(input)
      .rotate()
      .resize({ width: 1440, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(resolve(outDir, `${item.file}.webp`))
    ok += 1
    console.log(`ok   ${item.file}.webp`)
  } catch (error) {
    console.error(`FAIL ${item.file}: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}

const credits = [
  '# Home-services photography credits',
  '',
  'All photos below are from [Unsplash](https://unsplash.com/license) under the',
  'Unsplash License. They are resized, converted to WebP and served locally from',
  '`public/images/services/`. They are representative stock photography — not',
  "customer project photographs or images of Heptome's own technicians.",
  '',
  '| Local file | Source photo | Description |',
  '| --- | --- | --- |',
  ...manifest.map(item =>
    `| \`${item.file}.webp\` | ${item.source === 'pexels' ? `https://www.pexels.com/photo/${item.photo}/` : `https://unsplash.com/photos/${item.photo}`} | ${item.alt} |`,
  ),
  '',
].join('\n')
writeFileSync(resolve('docs/PHOTO_CREDITS.md'), credits)

console.log(`\n${ok}/${manifest.length} images written`)
