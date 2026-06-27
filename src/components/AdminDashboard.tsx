import React, { useState } from "react";
import { AppConfig, PresinscritoInstituto } from "../types";
import Logo from "./Logo";
import { downloadPlanillaPDF, getWhatsAppLink } from "../lib/pdfHelper";
import {
  ShieldCheck,
  Clipboard,
  ExternalLink,
  Users,
  Home,
  LogOut,
  Copy,
  Check,
  UserCheck,
  Flame,
  Award,
  Phone,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Search,
  Calendar,
  MessageCircle,
  Eye
} from "lucide-react";

interface AdminDashboardProps {
  config: AppConfig | null;
  triggerToast: (msg: string) => void;
  currentUserEmail: string | null;
  onSignOut: () => void;
  onNavigateBack?: () => void;
  allEnrollments: PresinscritoInstituto[];
  onDeleteEnrollment: (id: string) => Promise<void>;
}

export default function AdminDashboard({
  config,
  triggerToast,
  currentUserEmail,
  onSignOut,
  onNavigateBack,
  allEnrollments = [],
  onDeleteEnrollment
}: AdminDashboardProps) {

  const [copiedSec, setCopiedSec] = useState(false);
  const [copiedMas, setCopiedMas] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<string | null>(null);

  const secretaryLink = `${window.location.origin}${window.location.pathname}?modulo=registro_miembros`;
  const masterLink = `${window.location.origin}${window.location.pathname}?modulo=registro_secreto`;

  const copyLink = (link: string, type: "secretary" | "master") => {
    navigator.clipboard.writeText(link);
    if (type === "secretary") {
      setCopiedSec(true);
      triggerToast("¡Enlace para secretarios eclesiales copiado!");
      setTimeout(() => setCopiedSec(false), 2000);
    } else {
      setCopiedMas(true);
      triggerToast("¡Enlace del Formulario Maestro de directivas copiado!");
      setTimeout(() => setCopiedMas(false), 2000);
    }
  };

  const logoUrl = config?.logoBase64 || config?.logoUrl || "https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png";

  const toggleExpand = (id: string) => {
    setExpandedEnrollmentId(expandedEnrollmentId === id ? null : id);
  };

  const handleDownloadPDF = (enr: PresinscritoInstituto) => {
    const data = {
      nombre: enr.nombres || "",
      apellido: enr.apellidos || "",
      cedula: enr.cedula || "",
      celular: enr.whatsapp || "",
      edad: enr.edad || "",
      motivo: enr.motivo || "",
      fechaNacimiento: enr.fechaNacimiento || "No especificado",
      iglesia: enr.iglesia || "No especificado",
      iglesiaUbicacion: enr.iglesiaUbicacion || "No especificado",
      pastor: enr.pastor || "No especificado",
      pastorTelefono: enr.pastorTelefono || "No especificado",
      fechaInicio: enr.fechaInicio || "No especificado",
      celularHermano: enr.celularHermano || "No especificado",
      fechaInscripcion: enr.fechaInscripcion || new Date().toLocaleDateString('es-ES'),
    };
    downloadPlanillaPDF(data);
    triggerToast("Descargando Planilla PDF...");
  };

  const handleSendWhatsApp = (enr: PresinscritoInstituto) => {
    const data = {
      nombre: enr.nombres || "",
      apellido: enr.apellidos || "",
      cedula: enr.cedula || "",
      celular: enr.whatsapp || "",
      edad: enr.edad || "",
      motivo: enr.motivo || "",
      fechaNacimiento: enr.fechaNacimiento || "No especificado",
      iglesia: enr.iglesia || "No especificado",
      iglesiaUbicacion: enr.iglesiaUbicacion || "No especificado",
      pastor: enr.pastor || "No especificado",
      pastorTelefono: enr.pastorTelefono || "No especificado",
      fechaInicio: enr.fechaInicio || "No especificado",
      celularHermano: enr.celularHermano || "No especificado",
      fechaInscripcion: enr.fechaInscripcion || new Date().toLocaleDateString('es-ES'),
    };
    const link = getWhatsAppLink(data);
    window.open(link, "_blank");
  };

  // Filter enrollments based on search query
  const filteredEnrollments = allEnrollments.filter((enr) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${enr.nombres} ${enr.apellidos}`.toLowerCase();
    const cedula = (enr.cedula || "").toLowerCase();
    const iglesia = (enr.iglesia || "").toLowerCase();
    return fullName.includes(query) || cedula.includes(query) || iglesia.includes(query);
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans animate-fadeIn">
      {/* Top Navigation Control bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo url={logoUrl} className="h-10 w-10 p-0.5 bg-slate-100 rounded-lg shadow-2xs" />
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-none tracking-tight font-display uppercase">Columna de Fuego</h2>
              <span className="text-[10px] text-blue-600 font-bold uppercase mt-0.5 tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Panel Administrativo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onNavigateBack) {
                  onNavigateBack();
                } else {
                  window.location.href = window.location.origin;
                }
              }}
              className="py-2.5 px-4.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-3xs transition flex items-center gap-2 cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Ver Web Pública</span>
            </button>
            <button
              onClick={onSignOut}
              className="py-2.5 px-4.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
        
        {/* SECTION 1: Links generator */}
        <div className="space-y-6">
          <div className="space-y-1.5 border-b pb-4">
            <h3 className="text-lg font-black font-display text-slate-900 uppercase">Panel de Enlaces de Afiliación</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Como administrador para la FIEP, usted puede distribuir los siguientes formularios seguros. Los secretarios o líderes podrán registrar miembros sin comprometer las credenciales maestras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Secretary links */}
            <div className="bg-white border rounded-[2rem] p-6 shadow-3xs flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase font-display">Membresía General (Secretarios)</h4>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
                  Enlace simplificado de ingreso. Únicamente permite registrar miembros generales sin acceso a selección de jerarquías de altar.
                </p>
              </div>
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Enlace Copiable</span>
                <div className="flex bg-white rounded-xl border p-2 items-center justify-between gap-2 overflow-hidden shadow-inner">
                  <span className="text-[10px] text-slate-600 font-mono truncate select-all">{secretaryLink}</span>
                  <button
                    onClick={() => copyLink(secretaryLink, "secretary")}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-700 transition flex-shrink-0 cursor-pointer font-bold text-xs"
                  >
                    {copiedSec ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Master ministerial forms */}
            <div className="bg-white border rounded-[2rem] p-6 shadow-3xs flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Award className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase font-display">Formulario Maestro Ministerial</h4>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
                  Enlace completo. Permite la selección libre de tipos de altar (Pastores, Evangelistas, Presbíteros, Miembros generales).
                </p>
              </div>
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Enlace Copiable</span>
                <div className="flex bg-white rounded-xl border p-2 items-center justify-between gap-2 overflow-hidden shadow-inner">
                  <span className="text-[10px] text-slate-600 font-mono truncate select-all">{masterLink}</span>
                  <button
                    onClick={() => copyLink(masterLink, "master")}
                    className="p-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 transition flex-shrink-0 cursor-pointer font-bold text-xs"
                  >
                    {copiedMas ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: Bible Institute Registered Applicants List */}
        <div className="space-y-6">
          <div className="space-y-1.5 border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-black font-display text-slate-900 uppercase flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-red-600" />
                <span>Alumnos Inscritos - Instituto Bíblico IBEM</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Visualice, controle y exporte las planillas oficiales de los estudiantes inscritos en el primer trimestre.
              </p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar alumno, cédula o iglesia..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-250 text-xs font-semibold rounded-xl shadow-3xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {filteredEnrollments.length === 0 ? (
            <div className="p-10 bg-slate-100 border border-dashed rounded-[2rem] text-center space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No se encontraron preinscritos registrados</p>
              <p className="text-[11px] text-slate-400">Si un participante llena el formulario de inscripción, aparecerá automáticamente aquí.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredEnrollments.map((enr) => {
                const isExpanded = expandedEnrollmentId === enr.id;
                return (
                  <div
                    key={enr.id}
                    className={`bg-white border rounded-[1.75rem] shadow-3xs overflow-hidden transition-all duration-200 ${
                      isExpanded ? "ring-1 ring-red-500 border-red-200" : "hover:border-slate-300"
                    }`}
                  >
                    {/* Header bar of applicant */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl mt-0.5">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                            {enr.nombres} {enr.apellidos}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 font-semibold font-mono">
                            <span>C.I: {enr.cedula}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span>Iglesia: {enr.iglesia}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span>Cel: {enr.whatsapp}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => toggleExpand(enr.id)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                          title="Ver Ficha Completa"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Detalles</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        
                        <button
                          onClick={() => handleDownloadPDF(enr)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                          title="Descargar Planilla PDF"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">PDF</span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsApp(enr)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                          title="Enviar a WhatsApp del Director"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (onDeleteEnrollment) {
                              await onDeleteEnrollment(enr.id);
                            }
                          }}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition cursor-pointer"
                          title="Eliminar Estudiante"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded details section */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50 animate-fadeIn text-xs font-semibold space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nacido el</span>
                            <span className="text-slate-800 font-mono font-bold">{enr.fechaNacimiento || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Edad</span>
                            <span className="text-slate-800 font-mono font-bold">{enr.edad || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Miembro de la Iglesia</span>
                            <span className="text-slate-800">{enr.iglesia || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ubicada en</span>
                            <span className="text-slate-800">{enr.iglesiaUbicacion || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pastor de la Iglesia</span>
                            <span className="text-slate-800">{enr.pastor || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Teléfono del Pastor</span>
                            <span className="text-slate-800 font-mono font-bold">{enr.pastorTelefono || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Curso Inicia</span>
                            <span className="text-slate-800 font-mono font-bold">{enr.fechaInicio || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Celular del Estudiante</span>
                            <span className="text-slate-800 font-mono font-bold">{enr.whatsapp || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Celular de Hermano / Apoderado</span>
                            <span className="text-slate-800 font-mono font-bold">{enr.celularHermano || "No especificado"}</span>
                          </div>
                          <div className="space-y-0.5 sm:col-span-2">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Fecha de Inscripción (Firma)</span>
                            <span className="text-slate-800 font-mono font-bold">{enr.fechaInscripcion || "No especificado"}</span>
                          </div>
                        </div>

                        {enr.motivo && (
                          <div className="p-3 bg-white border rounded-xl space-y-1">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Llamado o Ministerio del Alumno</span>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-sans font-medium italic">
                              "{enr.motivo}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
