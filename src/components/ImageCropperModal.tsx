import React, { useEffect, useRef } from "react";
import { X, Crop, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  aspectRatio?: number; // e.g. 1 for member photo, or undefined for free form
  onCropComplete: (base64: string) => void;
  title?: string;
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio,
  onCropComplete,
  title = "Recortar y Ajustar Imagen"
}: ImageCropperModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !imageSrc || !imageRef.current) return;

    // Destroy existing instance if any
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const CropperClass = (window as any).Cropper;
    if (!CropperClass) {
      console.error("Cropper.js library not loaded from CDN.");
      return;
    }

    // Initialize CropperJS
    cropperRef.current = new CropperClass(imageRef.current, {
      aspectRatio: aspectRatio,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 0.9,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready() {
        console.log("Cropper.js loaded successfully");
      }
    });

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [isOpen, imageSrc, aspectRatio]);

  const handleConfirm = () => {
    if (!cropperRef.current) return;

    // Optimal crop dimensions requested by user (e.g. 300x300, or scaled proportional)
    const options: any = {};
    if (aspectRatio === 1) {
      options.width = 300;
      options.height = 300;
    } else {
      // Free aspect ratio, limit width to 600px for efficient Firestore Base64 storage
      options.maxWidth = 600;
    }

    const canvas = cropperRef.current.getCroppedCanvas(options);
    if (canvas) {
      const base64 = canvas.toDataURL("image/jpeg", 0.85); // High quality compressed jpeg
      onCropComplete(base64);
      onClose();
    }
  };

  const handleRotate = () => {
    if (cropperRef.current) {
      cropperRef.current.rotate(90);
    }
  };

  const handleZoomIn = () => {
    if (cropperRef.current) {
      cropperRef.current.zoom(0.1);
    }
  };

  const handleZoomOut = () => {
    if (cropperRef.current) {
      cropperRef.current.zoom(-0.1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold font-display uppercase tracking-wider">{title}</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cropping Area */}
        <div className="p-6">
          <div className="max-h-[350px] overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <img 
              ref={imageRef} 
              src={imageSrc} 
              alt="Crop target" 
              className="max-w-full block" 
              style={{ maxHeight: "330px" }}
              crossOrigin="anonymous"
            />
          </div>

          <p className="text-[10px] text-slate-500 mt-2 text-center font-medium">
            Arrastre los bordes para recortar, use dos dedos o la rueda del mouse para hacer zoom.
          </p>
        </div>

        {/* Controls Panel */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition"
              title="Zoom Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition"
              title="Zoom Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition"
              title="Rotar 90°"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
            >
              <Crop className="h-4 w-4" /> Confirmar Recorte
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
