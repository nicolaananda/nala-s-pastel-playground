import assert from 'node:assert/strict';
import sharp from 'sharp';
import { createResponsiveImages, responsiveMetadata } from './responsive-images.js';

const source = await sharp({create:{width:1200,height:800,channels:3,background:'#abcdef'}}).png().toBuffer();
const output = await createResponsiveImages(source);
assert.deepEqual(output.variants.map(v => v.width), [320, 640, 960]);
for (const variant of output.variants) assert.equal((await sharp(variant.buffer).metadata()).format, 'webp');
const metadata = responsiveMetadata({url:'https://cdn.example/original.webp',width:1200,height:800,variants:output.variants.map(v=>({width:v.width,url:`https://cdn.example/${v.width}.webp`}))});
assert.equal(metadata.variants.length, 3);
console.log('responsive image checks passed');
