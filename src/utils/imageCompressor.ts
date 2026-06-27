/**
 * Compresses an image file client-side using HTML5 Canvas to optimize Storage usage.
 * @param file The original File uploaded by the user
 * @param maxW The maximum width in pixels
 * @param maxH The maximum height in pixels
 * @param quality Float from 0 to 1 representing JPEG compression output quality
 * @returns A Promise resolving to a compressed Blob (as image/jpeg)
 */
export function compressImage(
  file: File,
  maxW = 600,
  maxH = 600,
  quality = 0.75
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio adapted dimensions
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Unable to create canvas 2D context"));
        }

        // Draw image keeping original proportions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert the canvas context back to an optimized JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Image compression returned null blob"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Compresses an image file client-side to an optimized JPEG Base64 data URL.
 * @param file The original File uploaded by the user
 * @param maxW The maximum width in pixels (typically 200 as requested)
 * @param maxH The maximum height in pixels (typically 200 as requested)
 * @param quality JPEG compression quality (typically 0.7 as requested)
 */
export function compressImageToBase64(
  file: File,
  maxW = 200,
  maxH = 200,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio adapted dimensions
        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Unable to create canvas 2D context"));
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          // Convert using canvas.toDataURL("image/jpeg", 0.7)
          const base64Str = canvas.toDataURL("image/jpeg", quality);
          resolve(base64Str);
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
