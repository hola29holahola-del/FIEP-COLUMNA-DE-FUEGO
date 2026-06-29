import React, { useState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface NewsPostProps {
  ano: string;
  titulo: string;
  descripcion: string;
  children?: React.ReactNode;
  adminLoggedIn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function NewsPost({
  ano,
  titulo,
  descripcion,
  children,
  adminLoggedIn = false,
  onEdit,
  onDelete
}: NewsPostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongText = descripcion && descripcion.length > 150;
  const displayedText = isLongText && !isExpanded ? `${descripcion.substring(0, 150)}...` : descripcion;

  return (
    <div className="bg-white hover:bg-slate-50/40 p-6 sm:p-8 rounded-[2rem] border border-slate-100 hover:border-sky-150 shadow-3xs hover:shadow-2xs transition-all duration-300 relative group/newsCard flex flex-col w-full text-left" id="news-post-container">
      
      {/* Admin Action Buttons */}
      {adminLoggedIn && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-80 group-hover/newsCard:opacity-100 transition z-10">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 cursor-pointer transition shadow-3xs"
              title="Editar Hito"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 bg-rose-100 hover:bg-rose-200 rounded text-rose-700 cursor-pointer transition shadow-3xs"
              title="Eliminar Hito"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* TITULAR HORIZONTAL ANCHO (Disposición ancha y corta en la parte superior) */}
      <div className="w-full flex flex-col gap-2.5 border-b border-slate-100/80 pb-4">
        {/* Year Badge and Main Headline Title */}
        <div className="flex flex-wrap items-center gap-3 w-full">
          <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-full flex-shrink-0">
            {ano}
          </span>
          <h4 className="text-base sm:text-lg font-black text-slate-900 font-display uppercase tracking-tight flex-grow leading-tight">
            {titulo}
          </h4>
        </div>

        {/* WIDE & SHORT TEXT BLOCK: Stretches completely across the container horizontally */}
        <div className="w-full">
          <p className="text-xs sm:text-xs text-slate-600 font-medium leading-relaxed font-sans whitespace-pre-wrap w-full text-justify sm:text-left">
            {displayedText}
          </p>
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  Ver menos <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Ver más <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* CONTENT AREA BELOW THE WIDE TEXT BLOCK (Photos, video, other details) */}
      {children && (
        <div className="w-full pt-2">
          {children}
        </div>
      )}

    </div>
  );
}
