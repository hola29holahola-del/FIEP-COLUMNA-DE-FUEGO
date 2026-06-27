import React, { useState } from "react";
import { Publicacion } from "../types";
import {
  X,
  Play,
  Calendar,
  Share2,
  Check,
  ArrowLeft,
  Trash2,
  Video,
  Image as ImageIcon
} from "lucide-react";

interface PublicationDetailProps {
  publication: Publicacion;
  onClose: () => void;
  adminLoggedIn: boolean;
  onDelete: (id: string) => Promise<void>;
  triggerToast: (msg: string) => void;
}

export default function PublicationDetail({
  publication,
  onClose,
  adminLoggedIn,
  onDelete,
  triggerToast
}: PublicationDetailProps) {

  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isVideo = publication.tipo === "video" || publication.videoUrl;
  const mediaUrl = publication.imagenBase64 || (publication as any).photoUrl || "";

  const handleCopyLink = () => {
    const directUrl = `${window.location.origin}/publicacion/${publication.id}`;
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    triggerToast("¡Enlace de publicación copiado al portapapeles!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro de remover esta publicación permanentemente?")) return;
    setDeleting(true);
    try {
      await onDelete(publication.id);
      onClose();
    } catch (e) {
      console.error(e);
      triggerToast("Error al eliminar la publicación.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDetailDate = (dateVal: any) => {
    if (!dateVal) return "Fecha no especificada";
    try {
      const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "Fórmula de fecha eclesiástica";
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[2rem] border border-slate-200/80 shadow-xl overflow-hidden animate-scaleUp">
      {/* Top Header Return and Controls bar */}
      <div className="p-5 border-b flex items-center justify-between bg-slate-50">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 py-2 px-4 hover:bg-slate-250 bg-white border rounded-xl text-xs font-extrabold uppercase tracking-widest text-slate-700 hover:text-slate-905 transition cursor-pointer shadow-3xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Regresar</span>
        </button>

        <div className="flex items-center gap-2">
          {adminLoggedIn && (
            <button
              disabled={deleting}
              onClick={handleDelete}
              className="p-2 bg-rose-50 hover:bg-rose-150 border border-rose-200 text-rose-700 rounded-xl cursor-pointer hover:text-rose-900 shadow-3xs transition flex items-center gap-1.5 text-xs font-bold"
              title="Eliminar Publicación"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{deleting ? "Borrando..." : "Eliminar"}</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition cursor-pointer shadow-sm"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Share2 className="h-4 w-4" />}
            <span>{copied ? "Copiado" : "Compartir"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Full Media display frame */}
        <div className="md:col-span-7 bg-slate-950 p-6 flex flex-col justify-center items-center min-h-[300px] md:min-h-[500px] relative border-r border-slate-100/5">
          {isVideo ? (
            <div className="w-full h-full flex flex-col justify-center items-center max-h-[70vh]">
              {publication.videoUrl && publication.videoUrl.startsWith("data:video/") ? (
                <video
                  src={publication.videoUrl}
                  controls
                  playsInline
                  className="w-full h-auto max-h-[65vh] object-contain rounded-2xl shadow-2xl"
                />
              ) : (
                <div className="relative w-full h-full flex flex-col justify-center items-center">
                  {mediaUrl ? (
                    <img
                      src={mediaUrl}
                      alt=""
                      className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl opacity-60 filter brightness-50"
                    />
                  ) : (
                    <div className="h-56 w-56 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center opacity-40">
                      <Video className="h-16 w-16 text-slate-500 stroke-1 animate-pulse" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex flex-col justify-center items-center space-y-4">
                    <a
                      href={publication.videoUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="h-18 w-18 rounded-full bg-white text-slate-950 hover:bg-sky-500 hover:text-white flex items-center justify-center shadow-2xl transition hover:scale-110"
                    >
                      <Play className="h-8 w-8 fill-current ml-1" />
                    </a>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Abrir Video del Sermón</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex justify-center items-center max-h-[70vh]">
              {mediaUrl ? (
                <img
                  src={mediaUrl}
                  alt="Resolución Original FIEP"
                  referrerPolicy="no-referrer"
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl hover:scale-[1.005] transition duration-300"
                />
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <ImageIcon className="h-12 w-12 mx-auto stroke-1 text-slate-600 mb-2" />
                  <p className="text-xs">No se especificó archivo gráfico original.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Text descriptions frame */}
        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-8 text-left bg-white">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase font-mono tracking-widest px-3 py-1 rounded-full ${isVideo ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                {isVideo ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                {isVideo ? "Video / Sermón eclesial" : "Aviso Eclesiástico FIEP"}
              </span>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono font-bold pt-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-450" />
                <span>{formatDetailDate(publication.fecha)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">Mensaje / Detalles de la Obra</h4>
              <p className="text-slate-850 text-xs sm:text-sm font-semibold leading-relaxed font-sans whitespace-pre-wrap select-text">
                {publication.texto || "Sin descripción proporcionada."}
              </p>
            </div>
          </div>

          <div className="border-t pt-5 text-slate-400 text-[10px] font-semibold leading-normal font-sans italic p-1 bg-slate-50/50 rounded-xl border border-dashed">
            * Publicación corporativa timbrada eclesialmente por el cuerpo ejecutivo de la FIEP Fuego Santo.
          </div>
        </div>
      </div>
    </div>
  );
}
