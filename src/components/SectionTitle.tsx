import React from "react";

interface SectionTitleProps {
  title: string;
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <div className="space-y-1 mt-5 animate-fadeIn" id="section-dinamik-title-container">
      <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 uppercase tracking-tight leading-none">
        {title}
      </h1>
      <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mt-1.5 font-mono">
        Sección Oficial Oficializada
      </span>
    </div>
  );
}
