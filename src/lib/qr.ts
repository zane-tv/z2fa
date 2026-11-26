import jsQR from 'jsqr';
import QRCode from 'qrcode';

export async function decodeQrFromBlob(blob: Blob): Promise<string | null> {
  const imageBitmap = await createImageBitmap(blob);
  try {
    // Try original size (capped at 1600px) and smaller 800px scale for sharp/blurry tolerance
    const scales = [1600, 900];

    for (const maxDim of scales) {
      const ratio = Math.min(1, maxDim / Math.max(imageBitmap.width, imageBitmap.height));
      const width = Math.max(1, Math.round(imageBitmap.width * ratio));
      const height = Math.max(1, Math.round(imageBitmap.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;

      // White background behind transparent PNG QR codes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(imageBitmap, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const result = jsQR(imageData.data, width, height, {
        inversionAttempts: 'attemptBoth',
      });
      if (result && result.data) {
        return result.data;
      }
    }
    return null;
  } finally {
    imageBitmap.close();
  }
}

export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#090D16',
      light: '#FFFFFF',
    },
  });
}
