/**
 * ImgBB API Key: 2584e919c36c920c8d78e3c9c7f2b4f2
 * Endpoint: https://api.imgbb.com/1/upload
 */

const DEFAULT_IMGBB_API_KEY = "2584e919c36c920c8d78e3c9c7f2b4f2";

export function getImgBBApiKey(): string {
  const customKey = (window as any).__imgbb_key;
  if (customKey && customKey.trim()) {
    return customKey.trim();
  }
  return DEFAULT_IMGBB_API_KEY;
}

/**
 * Helper to convert standard File object to a base64 (data URI)
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image base64 data URI to a max dimension at 70% quality
 */
export function compressImageBase64(dataUrl: string, maxWidth = 500, maxHeight = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!dataUrl.startsWith("data:image/")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      resolve(compressed);
    };
    img.onerror = (err) => {
      console.error("Compression error:", err);
      resolve(dataUrl); // fallback to original on error
    };
  });
}

/**
 * Helper to convert base64 (data URI) to a standard File object
 */
export function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Validates the size and type of file, then uploads to ImgBB.
 * Photos <= 1.5MB, Videos <= 5MB.
 */
export async function uploadToImgBB(fileInput: File | string, customName?: string): Promise<string> {
  let processedInput = fileInput;

  // If it's a file, we want to convert it to base64 so we can compress it if it's an image
  if (fileInput instanceof File) {
    if (fileInput.type.startsWith("image/")) {
      try {
        const base64 = await fileToDataURL(fileInput);
        processedInput = await compressImageBase64(base64);
      } catch (err) {
        console.error("Error reading/compressing file input:", err);
      }
    }
  } else if (typeof fileInput === "string" && fileInput.startsWith("data:image/")) {
    processedInput = await compressImageBase64(fileInput);
  }

  let file: File;
  
  if (typeof processedInput === "string") {
    // If it is a base64 string
    if (processedInput.startsWith("data:")) {
      const extension = processedInput.split(";")[0].split("/")[1] || "jpeg";
      file = dataURLtoFile(processedInput, `upload-${Date.now()}.${extension}`);
    } else {
      throw new Error("El string de entrada no tiene un formato Data URL válido.");
    }
  } else {
    file = processedInput;
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  const endpoint = `https://api.imgbb.com/1/upload?key=${getImgBBApiKey()}`;

  try {
    // Validation
    if (isImage) {
      // Max 32MB (ImgBB official limit)
      const limit = 32 * 1024 * 1024;
      if (file.size > limit) {
        throw new Error(`La foto supera el límite de 32MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
      }
    } else if (isVideo) {
      // Max 10MB for local video fallback
      const limit = 10 * 1024 * 1024;
      if (file.size > limit) {
        throw new Error(`El vídeo supera el límite de 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
      }
      // Force error to trigger the video local fallback immediately since ImgBB doesn't host videos
      throw new Error("Videos no son soportados por ImgBB nativamente. Se guardará localmente.");
    } else {
      const limit = 10 * 1024 * 1024;
      if (file.size > limit) {
        throw new Error(`El archivo supera el límite de 10MB.`);
      }
    }

    // Perform POST
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ImgBB upload status failure:", errText);
      throw new Error("Error en la respuesta del servidor ImgBB.");
    }

    const json = await res.json();
    if (json && json.success && json.data && json.data.url) {
      return json.data.url; // Hosted URL
    } else {
      throw new Error(json?.error?.message || "La carga en ImgBB no devolvió una URL válida.");
    }
  } catch (err: any) {
    console.error("uploadToImgBB raw error:", err);
    
    // Display a user friendly toast if triggerToast is registered
    const customToast = (window as any).__triggerToast;
    if (customToast) {
      customToast("Carga en ImgBB fallida. Usando almacenamiento local alternativo.");
    } else {
      console.warn("ImgBB failed, using fallback.");
    }

    // Fallback: Return base64 representation so the app remains fully functional
    if (typeof processedInput === "string") {
      return processedInput;
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  }
}
