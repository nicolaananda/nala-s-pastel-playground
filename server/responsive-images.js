import sharp from 'sharp';

export const RESPONSIVE_WIDTHS = [320, 640, 960];

export async function createResponsiveImages(buffer, quality = 82) {
  const input = sharp(buffer, { limitInputPixels: 25_000_000, failOn: 'error' });
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > 25_000_000) throw new Error('Dimensi gambar tidak valid');
  const widths = RESPONSIVE_WIDTHS.filter(width => width <= metadata.width);
  if (!widths.length) widths.push(metadata.width);
  const variants = await Promise.all(widths.map(async width => ({
    width,
    buffer: await sharp(buffer, { limitInputPixels: 25_000_000, failOn: 'error' }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer(),
  })));
  return { width: metadata.width, height: metadata.height, variants };
}

export function responsiveMetadata({ url, width, height, variants }) {
  if (typeof url !== 'string' || !/^https?:\/\/[^\s]+$/.test(url)) throw new Error('URL gambar tidak valid');
  return {
    url,
    width,
    height,
    variants: variants.map(({ width: variantWidth, url: variantUrl }) => {
      if (!RESPONSIVE_WIDTHS.includes(variantWidth) && variantWidth !== width) throw new Error('Lebar varian tidak valid');
      if (typeof variantUrl !== 'string' || !/^https?:\/\/[^\s]+$/.test(variantUrl)) throw new Error('URL varian tidak valid');
      return { width: variantWidth, url: variantUrl };
    }),
  };
}
