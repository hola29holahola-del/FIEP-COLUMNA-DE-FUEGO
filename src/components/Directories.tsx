import React, { useState } from "react";
import { AppConfig, IglesiaUsuario, BoardMember } from "../types";
import { downloadPlanillaPDF as generatePlanillaPDF, getWhatsAppLink as buildWhatsAppLink } from "../lib/pdfHelper";
import { uploadToImgBB } from "../utils/imgbb";
import DirectivosGrid from "./DirectivosGrid";
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Phone,
  Compass,
  ArrowRight,
  Sparkles,
  Award,
  Globe,
  MapPin,
  Flame,
  CheckCircle,
  FileText,
  Pencil,
  Save,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  User,
  Upload
} from "lucide-react";

interface DirectoriesProps {
  config: AppConfig | null;
  allUsers: IglesiaUsuario[];
  currentTab: "pastores" | "evangelismo" | "instituto" | "miembros";
  onPreinscripcion: (
    nombres: string,
    apellidos: string,
    cedula: string,
    whatsapp: string,
    edad: string,
    motivo: string,
    extraFields?: {
      fechaNacimiento?: string;
      iglesia?: string;
      iglesiaUbicacion?: string;
      pastor?: string;
      pastorTelefono?: string;
      fechaInicio?: string;
      celularHermano?: string;
      fechaInscripcion?: string;
    }
  ) => Promise<void>;
  onNavigateToSecretRegister?: () => void;
  onNavigateToSecretRegisterWithTab?: (tab: "pastor" | "evangelismo" | "miembro") => void;
  adminLoggedIn?: boolean;
  onSaveConfig?: (updatedFields: Partial<AppConfig>) => Promise<void>;
  triggerToast?: (msg: string) => void;
  onDeleteMember?: (id: string) => Promise<void>;
  evangelismoDirectivos?: BoardMember[];
  onCreateEvangelismoDirectivo?: (cargo: string, nombre: string, apellido: string, photoUrl: string) => Promise<string>;
  onUpdateEvangelismoDirectivo?: (id: string, cargo: string, nombre: string, apellido: string, photoUrl: string) => Promise<void>;
  onDeleteEvangelismoDirectivo?: (id: string) => Promise<void>;
  institutoDirectivos?: BoardMember[];
  onCreateInstitutoDirectivo?: (cargo: string, nombre: string, apellido: string, photoUrl: string) => Promise<string>;
  onUpdateInstitutoDirectivo?: (id: string, cargo: string, nombre: string, apellido: string, photoUrl: string) => Promise<void>;
  onDeleteInstitutoDirectivo?: (id: string) => Promise<void>;
}

export default function Directories({
  config,
  allUsers,
  currentTab,
  onPreinscripcion,
  onNavigateToSecretRegister,
  onNavigateToSecretRegisterWithTab,
  adminLoggedIn = false,
  onSaveConfig,
  triggerToast,
  onDeleteMember,
  evangelismoDirectivos = [],
  onCreateEvangelismoDirectivo,
  onUpdateEvangelismoDirectivo,
  onDeleteEvangelismoDirectivo,
  institutoDirectivos = [],
  onCreateInstitutoDirectivo,
  onUpdateInstitutoDirectivo,
  onDeleteInstitutoDirectivo
}: DirectoriesProps) {

  // Pastors list states
  const [pastorQuery, setPastorQuery] = useState("");
  const [openPastorZones, setOpenPastorZones] = useState<string[]>([]);

  // Evangelismo list states
  const [evQuery, setEvQuery] = useState("");
  const [openEvZones, setOpenEvZones] = useState<string[]>([]);

  // Miembros list states
  const [miembrosQuery, setMiembrosQuery] = useState("");
  const [openZones, setOpenZones] = useState<string[]>([]);

  // Academy pre-registration form state
  const [pNombre, setPNombre] = useState("");
  const [pApellido, setPApellido] = useState("");
  const [pCedula, setPCedula] = useState("");
  const [pCelular, setPCelular] = useState("");
  const [pEdad, setPEdad] = useState("");
  const [pMotivo, setPMotivo] = useState("");
  
  // New detailed fields from attached document
  const [pFechaNacimiento, setPFechaNacimiento] = useState("");
  const [pIglesia, setPIglesia] = useState("");
  const [pIglesiaUbicacion, setPIglesiaUbicacion] = useState("");
  const [pPastor, setPPastor] = useState("");
  const [pPastorTelefono, setPPastorTelefono] = useState("");
  const [pFechaInicio, setPFechaInicio] = useState("");
  const [pCelularHermano, setPCelularHermano] = useState("");
  const [pFechaInscripcion, setPFechaInscripcion] = useState(new Date().toLocaleDateString('es-ES'));

  const [formLoading, setFormLoading] = useState(false);
  const [formDone, setFormDone] = useState(false);

  // ================= CONTEXTUAL EDIT MODAL STATES =================
  const [editingKey, setEditingKey] = useState<"pastores" | "evangelismo" | "miembros" | "instituto_general" | "evangelismo_historia" | "instituto_descripcion" | null>(null);

  // Temporary Edit values
  const [tempSectTitle, setTempSectTitle] = useState("");
  const [tempSectDesc, setTempSectDesc] = useState("");
  const [tempProf, setTempProf] = useState("");
  const [tempLugares, setTempLugares] = useState("");
  const [tempEvangelismoHistoria, setTempEvangelismoHistoria] = useState("");
  const [tempInstitutoDescripcion, setTempInstitutoDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  // ============= EVANGELISMO DEPARTMENT DIRECTIVA STATES =============
  const [activeEvBoardModal, setActiveEvBoardModal] = useState<"add" | "edit" | null>(null);
  const [selectedEvBoardIdx, setSelectedEvBoardIdx] = useState<number | null>(null);
  const [selectedEvBoardId, setSelectedEvBoardId] = useState<string | null>(null);
  const [tempEvBoardCargo, setTempEvBoardCargo] = useState("");
  const [tempEvBoardNombre, setTempEvBoardNombre] = useState("");
  const [tempEvBoardApellido, setTempEvBoardApellido] = useState("");
  const [tempEvBoardPhoto, setTempEvBoardPhoto] = useState("");

  const handleLocalFileRead = (e: React.ChangeEvent<HTMLInputElement>, onRead: (b64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onRead(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openEvBoardAdd = () => {
    setSelectedEvBoardIdx(null);
    setSelectedEvBoardId(null);
    setTempEvBoardCargo("");
    setTempEvBoardNombre("");
    setTempEvBoardApellido("");
    setTempEvBoardPhoto("");
    setActiveEvBoardModal("add");
  };

  const openEvBoardEdit = (idx: number) => {
    const mbr = evangelismoDirectivos[idx];
    setSelectedEvBoardIdx(idx);
    setSelectedEvBoardId(mbr.id || null);
    setTempEvBoardCargo(mbr.cargo);
    setTempEvBoardNombre(mbr.nombre);
    setTempEvBoardApellido(mbr.apellido || "");
    setTempEvBoardPhoto(mbr.photoUrl || "");
    setActiveEvBoardModal("edit");
  };

  const saveEvBoardMember = async () => {
    if (!tempEvBoardNombre || !tempEvBoardCargo) {
      if (triggerToast) triggerToast("Por favor complete nombre y cargo.");
      return;
    }
    setSaving(true);
    try {
      let finalPhotoUrl = tempEvBoardPhoto;
      if (tempEvBoardPhoto && tempEvBoardPhoto.startsWith("data:")) {
        if (triggerToast) triggerToast("Subiendo foto a ImgBB...");
        finalPhotoUrl = await uploadToImgBB(tempEvBoardPhoto);
      }

      if (activeEvBoardModal === "add") {
        if (onCreateEvangelismoDirectivo) {
          await onCreateEvangelismoDirectivo(
            tempEvBoardCargo,
            tempEvBoardNombre,
            tempEvBoardApellido,
            finalPhotoUrl
          );
        }
      } else {
        if (onUpdateEvangelismoDirectivo && selectedEvBoardId) {
          await onUpdateEvangelismoDirectivo(
            selectedEvBoardId,
            tempEvBoardCargo,
            tempEvBoardNombre,
            tempEvBoardApellido,
            finalPhotoUrl
          );
        }
      }
      setActiveEvBoardModal(null);
    } catch (err: any) {
      console.error(err);
      if (triggerToast) triggerToast("Error al subir foto: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };


  // ============= INSTITUTO BIBLICO DIRECTIVA STATES =============
  const [activeInstBoardModal, setActiveInstBoardModal] = useState<"add" | "edit" | null>(null);
  const [selectedInstBoardIdx, setSelectedInstBoardIdx] = useState<number | null>(null);
  const [selectedInstBoardId, setSelectedInstBoardId] = useState<string | null>(null);
  const [tempInstBoardCargo, setTempInstBoardCargo] = useState("");
  const [tempInstBoardNombre, setTempInstBoardNombre] = useState("");
  const [tempInstBoardApellido, setTempInstBoardApellido] = useState("");
  const [tempInstBoardPhoto, setTempInstBoardPhoto] = useState("");

  const openInstBoardAdd = () => {
    setSelectedInstBoardIdx(null);
    setSelectedInstBoardId(null);
    setTempInstBoardCargo("");
    setTempInstBoardNombre("");
    setTempInstBoardApellido("");
    setTempInstBoardPhoto("");
    setActiveInstBoardModal("add");
  };

  const openInstBoardEdit = (idx: number) => {
    const mbr = institutoDirectivos[idx];
    setSelectedInstBoardIdx(idx);
    setSelectedInstBoardId(mbr.id || null);
    setTempInstBoardCargo(mbr.cargo);
    setTempInstBoardNombre(mbr.nombre);
    setTempInstBoardApellido(mbr.apellido || "");
    setTempInstBoardPhoto(mbr.photoUrl || "");
    setActiveInstBoardModal("edit");
  };

  const saveInstBoardMember = async () => {
    if (!tempInstBoardNombre || !tempInstBoardCargo) {
      if (triggerToast) triggerToast("Por favor complete nombre y cargo.");
      return;
    }
    setSaving(true);
    try {
      let finalPhotoUrl = tempInstBoardPhoto;
      if (tempInstBoardPhoto && tempInstBoardPhoto.startsWith("data:")) {
        if (triggerToast) triggerToast("Subiendo foto a ImgBB...");
        finalPhotoUrl = await uploadToImgBB(tempInstBoardPhoto);
      }

      if (activeInstBoardModal === "add") {
        if (onCreateInstitutoDirectivo) {
          await onCreateInstitutoDirectivo(
            tempInstBoardCargo,
            tempInstBoardNombre,
            tempInstBoardApellido,
            finalPhotoUrl
          );
        }
      } else {
        if (onUpdateInstitutoDirectivo && selectedInstBoardId) {
          await onUpdateInstitutoDirectivo(
            selectedInstBoardId,
            tempInstBoardCargo,
            tempInstBoardNombre,
            tempInstBoardApellido,
            finalPhotoUrl
          );
        }
      }
      setActiveInstBoardModal(null);
    } catch (err: any) {
      console.error(err);
      if (triggerToast) triggerToast("Error al subir foto: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };


  const contactWhatsApp = config?.directorWhatsApp || "+506 8888 8888";
  const rawCleanPhone = contactWhatsApp.replace(/[^\d+]/g, "");
  const mapLink = `https://wa.me/${rawCleanPhone}?text=Hola,%20solicito%20detalles%20de%20inscripcion%20en%20las%20clases%20de%20teolog%C3%ADa%20del%20IBEM.`;

  const [lastSubmitted, setLastSubmitted] = useState<{
    nombre: string;
    apellido: string;
    cedula: string;
    celular: string;
    edad: string;
    motivo: string;
    fechaNacimiento: string;
    iglesia: string;
    iglesiaUbicacion: string;
    pastor: string;
    pastorTelefono: string;
    fechaInicio: string;
    celularHermano: string;
    fechaInscripcion: string;
  } | null>(null);

  // Submit handle for IBEM
  const handlePreinscripcionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNombre || !pApellido || !pCedula || !pCelular) return;
    setFormLoading(true);
    
    // Fallbacks if optional fields are empty
    const subData = {
      nombre: pNombre.trim(),
      apellido: pApellido.trim(),
      cedula: pCedula.trim(),
      celular: pCelular.trim(),
      edad: pEdad.trim() || "No especificado",
      motivo: pMotivo.trim() || "Estudio sistemático de la Palabra de Dios.",
      fechaNacimiento: pFechaNacimiento.trim() || "No especificado",
      iglesia: pIglesia.trim() || "No especificado",
      iglesiaUbicacion: pIglesiaUbicacion.trim() || "No especificado",
      pastor: pPastor.trim() || "No especificado",
      pastorTelefono: pPastorTelefono.trim() || "No especificado",
      fechaInicio: pFechaInicio.trim() || "No especificado",
      celularHermano: pCelularHermano.trim() || "No especificado",
      fechaInscripcion: pFechaInscripcion.trim() || new Date().toLocaleDateString('es-ES')
    };

    try {
      await onPreinscripcion(
        subData.nombre,
        subData.apellido,
        subData.cedula,
        subData.celular,
        subData.edad,
        subData.motivo,
        {
          fechaNacimiento: subData.fechaNacimiento,
          iglesia: subData.iglesia,
          iglesiaUbicacion: subData.iglesiaUbicacion,
          pastor: subData.pastor,
          pastorTelefono: subData.pastorTelefono,
          fechaInicio: subData.fechaInicio,
          celularHermano: subData.celularHermano,
          fechaInscripcion: subData.fechaInscripcion
        }
      );
      
      setLastSubmitted(subData);
      
      // Reset form fields
      setPNombre("");
      setPApellido("");
      setPCedula("");
      setPCelular("");
      setPEdad("");
      setPMotivo("");
      setPFechaNacimiento("");
      setPIglesia("");
      setPIglesiaUbicacion("");
      setPPastor("");
      setPPastorTelefono("");
      setPFechaInicio("");
      setPCelularHermano("");
      
      setFormDone(true);
      
      // Attempt immediate auto-download for convenience
      setTimeout(() => {
        downloadPlanillaPDF(subData);
      }, 300);

    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };
  const downloadPlanillaPDF = (dataToUse?: typeof lastSubmitted) => {
    const data = dataToUse || lastSubmitted;
    if (data) {
      generatePlanillaPDF(data);
    }
  };

  const getWhatsAppLink = (data: typeof lastSubmitted) => {
    if (!data) return "";
    return buildWhatsAppLink(data);
  };

  // Open specific editor
  const openEditor = (sect: typeof editingKey) => {
    if (!sect) return;
    setEditingKey(sect);
    if (sect === "pastores") {
      setTempSectTitle(config?.sections?.pastores?.title || "Directorio del Gremio Pastoral");
      setTempSectDesc(config?.sections?.pastores?.description || "Comprometidos con el avivamiento y la sana doctrina pentecostal.");
    } else if (sect === "evangelismo") {
      setTempSectTitle(config?.sections?.evangelismo?.title || "Departamento de Evangelismo");
      setTempSectDesc(config?.sections?.evangelismo?.description || "Llevando el mensaje de salvación a cada rincón del país.");
    } else if (sect === "miembros") {
      setTempSectTitle(config?.sections?.miembros?.title || "Membresía General");
      setTempSectDesc(config?.sections?.miembros?.description || "Servidores de fe, diáconos, ujieres y la congregación en alianza conciliar.");
    } else if (sect === "instituto_general") {
      setTempProf(config?.institutoProfesores || "Rev. Dr. Carlos Mendoza (Teología y Dogmática) • Pr. Jacobo Castro (Exégesis y Hermenéutica) • Misionera María de la Paz Ruiz (Misionología).");
      setTempLugares(config?.institutoLugares || "Sede Central de la Federación (Sábados de 8:00 AM a 1:00 PM) • Plataformas virtuales Online sincrónicas.");
    } else if (sect === "evangelismo_historia") {
      setTempEvangelismoHistoria(config?.evangelismoHistoria || "");
    } else if (sect === "instituto_descripcion") {
      setTempInstitutoDescripcion(config?.institutoDescripcion || "Súmese a los cursos ministeriales y profundice en teología bíblica, homilía evangélica y misiones. El programa académico de la federación está diseñado para obreros que trazan fielmente la palabra de verdad.");
    }
  };

  // Save changes to Firestore
  const saveContextualChanges = async () => {
    if (!onSaveConfig) return;
    setSaving(true);
    try {
      const baseSections = {
        pastores: {
          title: config?.sections?.pastores?.title || "Directorio del Gremio Pastoral",
          description: config?.sections?.pastores?.description || "Comprometidos con el avivamiento y la sana doctrina pentecostal.",
          icon: config?.sections?.pastores?.icon || "compass",
        },
        evangelismo: {
          title: config?.sections?.evangelismo?.title || "Departamento de Evangelismo",
          description: config?.sections?.evangelismo?.description || "Llevando el mensaje de salvación a cada rincón del país.",
          icon: config?.sections?.evangelismo?.icon || "flame",
        },
        miembros: {
          title: config?.sections?.miembros?.title || "Membresía General",
          description: config?.sections?.miembros?.description || "Servidores de fe, diáconos, ujieres y la congregación en alianza conciliar.",
          icon: config?.sections?.miembros?.icon || "users",
        },
        instituto: {
          title: config?.sections?.instituto?.title || "Seminario Teológico IBEM",
          description: config?.sections?.instituto?.description || "Comprometidos con la formación bíblica y teológica de ministerios de altar.",
          icon: config?.sections?.instituto?.icon || "book",
        },
        ...(config?.sections || {})
      };

      if (editingKey === "pastores") {
        baseSections.pastores = {
          ...baseSections.pastores,
          title: tempSectTitle,
          description: tempSectDesc
        };
        await onSaveConfig({ sections: baseSections });
      } else if (editingKey === "evangelismo") {
        baseSections.evangelismo = {
          ...baseSections.evangelismo,
          title: tempSectTitle,
          description: tempSectDesc
        };
        await onSaveConfig({ sections: baseSections });
      } else if (editingKey === "miembros") {
        baseSections.miembros = {
          ...baseSections.miembros,
          title: tempSectTitle,
          description: tempSectDesc
        };
        await onSaveConfig({ sections: baseSections });
      } else if (editingKey === "instituto_general") {
        await onSaveConfig({
          institutoProfesores: tempProf,
          institutoLugares: tempLugares
        });
      } else if (editingKey === "evangelismo_historia") {
        await onSaveConfig({
          evangelismoHistoria: tempEvangelismoHistoria
        });
      } else if (editingKey === "instituto_descripcion") {
        await onSaveConfig({
          institutoDescripcion: tempInstitutoDescripcion
        });
      }
      setEditingKey(null);
      if (triggerToast) triggerToast("Contenido del encabezado actualizado.");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // CLASSIFIED FILTER LISTS
  const pastorsList = allUsers.filter(u => {
    const isP = u.departamento === "pastores" || (u.rol || "").toLowerCase() === "pastor";
    if (!isP) return false;
    const q = pastorQuery.toLowerCase().trim();
    return q === "" ||
      (u.nombres || "").toLowerCase().includes(q) ||
      (u.apellidos || "").toLowerCase().includes(q) ||
      (u.iglesia || "").toLowerCase().includes(q) ||
      (u.cedula || "").toLowerCase().includes(q);
  });

  const evangelistasList = allUsers.filter(u => {
    const isE = u.departamento === "evangelistas" || (u.rol || "").toLowerCase().includes("evangel");
    if (!isE) return false;
    const q = evQuery.toLowerCase().trim();
    return q === "" ||
      (u.nombres || "").toLowerCase().includes(q) ||
      (u.apellidos || "").toLowerCase().includes(q) ||
      (u.iglesia || "").toLowerCase().includes(q) ||
      (u.cedula || "").toLowerCase().includes(q);
  });

  const miembrosList = allUsers.filter(u => {
    const isM = u.departamento === "miembros" || (u.rol || "").toLowerCase() === "miembro";
    if (!isM) return false;
    const q = miembrosQuery.toLowerCase().trim();
    return q === "" ||
      (u.nombres || "").toLowerCase().includes(q) ||
      (u.apellidos || "").toLowerCase().includes(q) ||
      (u.iglesia || "").toLowerCase().includes(q) ||
      (u.cedula || "").toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-8 text-left relative">
      
      {/* ================= SECTION 1: GREMIO PASTORAL DIRECTORY ================= */}
      {currentTab === "pastores" && (
        <div className="space-y-6">
          
          {/* Header Card banner */}
          <div className={`bg-gradient-to-r from-blue-600 via-sky-500 to-sky-400 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative ${adminLoggedIn ? 'border-2 border-dashed border-blue-300' : ''}`}>
            
            {adminLoggedIn && (
              <button
                onClick={() => openEditor("pastores")}
                className="absolute top-3 right-3 py-1 px-3 bg-white text-blue-700 font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow hover:bg-sky-50 z-10"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar Encabezado</span>
              </button>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pr-16">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-white rounded-2xl p-1.5 shadow-lg select-none flex-shrink-0 flex items-center justify-center">
                <img 
                  src={config?.logoBase64 || config?.logoUrl || "https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png"} 
                  alt="Logo Oficial Gremio" 
                  className="h-full w-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2 max-w-xl text-left">
                <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-widest text-[#f0f9ff]">
                  <Compass className="h-3 w-3" /> Gremio Pastoral Nacional
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight">Hombres de Unción y Autoridad Espiritual</h2>
                <p className="text-xs text-white/90 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {config?.sections?.pastores?.title || "Directorio del Gremio Pastoral"}: {config?.sections?.pastores?.description || "Comprometidos con el avivamiento y la sana doctrina pentecostal."}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block p-4 bg-white/10 rounded-2xl border border-white/20 select-none">
              <span className="block text-2xl font-black font-display text-white">{pastorsList.length}</span>
              <span className="block text-[8px] font-mono uppercase tracking-widest text-sky-100">Pastores Registrados</span>
            </div>
          </div>

          {/* Directory search or register row */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pastores por nombres, apellidos, cédula de identidad, congregación..."
                value={pastorQuery}
                onChange={(e) => setPastorQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-3xs"
              />
            </div>
            {adminLoggedIn && (
              <button
                onClick={() => onNavigateToSecretRegisterWithTab ? onNavigateToSecretRegisterWithTab("pastor") : onNavigateToSecretRegister?.()}
                className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-sm hover:shadow-md h-fit whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Miembro del Gremio</span>
              </button>
            )}
          </div>

          {/* Pastors Grid grouped by 13 Zones */}
          <div className="space-y-4">
            {Array.from({ length: 13 }, (_, i) => `Zona ${i + 1}`).map((zone) => {
              // Filter pastors for this zone
              const zonePastors = pastorsList.filter(
                (user) => (user.zona || "").trim().toLowerCase() === zone.toLowerCase()
              );

              const isSearchActive = pastorQuery.trim() !== "";
              const isOpen = openPastorZones.includes(zone) || (isSearchActive && zonePastors.length > 0);

              const toggleZone = () => {
                if (openPastorZones.includes(zone)) {
                  setOpenPastorZones(openPastorZones.filter((z) => z !== zone));
                } else {
                  setOpenPastorZones([...openPastorZones, zone]);
                }
              };

              return (
                <div key={zone} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-3xs transition-all hover:border-blue-100">
                  {/* Accordion header button */}
                  <button
                    onClick={toggleZone}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/60 hover:bg-slate-50 text-left font-display text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      <span>{zone}</span>
                      <span className="ml-2 py-0.5 px-2 bg-blue-100 text-blue-800 rounded-full font-mono font-bold text-[10px] lowercase tracking-normal">
                        {zonePastors.length} {zonePastors.length === 1 ? "pastor" : "pastores"}
                      </span>
                    </div>
                    <div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Content rendering */}
                  {isOpen && (
                    <div className="p-5 bg-slate-50/10">
                      {zonePastors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
                          {zonePastors.map((user) => (
                            <div
                              key={user.id}
                              className="bg-white hover:bg-slate-50/50 border border-slate-100 p-5 rounded-3xl hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4"
                            >
                              <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full overflow-hidden border bg-slate-100 relative flex-shrink-0 flex items-center justify-center">
                                  {user.photoUrl ? (
                                    <img
                                      src={user.photoUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <User className="h-8 w-8 text-slate-300" />
                                  )}
                                </div>
                                <div className="text-left space-y-1">
                                  <span className="inline-block text-[8px] font-mono uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    {user.ministerio || "Pastor Titular"}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-900 font-display">
                                    {user.nombres} {user.apellidos}
                                  </h4>
                                  <p className="text-[11px] text-slate-450 font-semibold leading-none">{user.iglesia}</p>
                                </div>
                              </div>

                              <div className="border-t pt-3 flex items-center justify-between text-[11px]">
                                <span className="font-mono text-slate-400">{adminLoggedIn ? `ID: ${user.cedula}` : "ID: Protegido"}</span>
                                
                                <div className="flex items-center gap-2">
                                  {adminLoggedIn && onDeleteMember && (
                                    <button
                                      onClick={async () => {
                                        await onDeleteMember(user.id);
                                      }}
                                      className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Eliminar</span>
                                    </button>
                                  )}
                                  {adminLoggedIn && (
                                    <button
                                      onClick={() => {
                                        const dynamicUrl = `${window.location.origin}/ver-miembro/${user.id}`;
                                        window.open(dynamicUrl, "_blank");
                                      }}
                                      className="py-1 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                    >
                                      <span>Ver Credencial</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 italic text-xs">
                          Ningún pastor registrado en esta zona.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {pastorsList.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium italic">
                Ningún miembro registrado en este filtro del gremio pastoral todavía.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= SECTION 2: DEPTO EVANGELISMO DIRECTORY ================= */}
      {currentTab === "evangelismo" && (
        <div className="space-y-6">
          
          {/* Header Card banner */}
          <div className={`bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-400 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative ${adminLoggedIn ? 'border-2 border-dashed border-purple-300' : ''}`}>
            
            {adminLoggedIn && (
              <button
                onClick={() => openEditor("evangelismo")}
                className="absolute top-3 right-3 py-1 px-3 bg-white text-purple-700 font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow hover:bg-purple-100/10 z-10"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar Encabezado</span>
              </button>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pr-16">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-white rounded-2xl p-1.5 shadow-lg select-none flex-shrink-0 flex items-center justify-center">
                <img 
                  src="https://i.postimg.cc/JzdFxpKr/Chat-GPT-Image-19-may-2026-07-54-55-p-m.png" 
                  alt="Logo Oficial Evangelismo" 
                  className="h-full w-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2 max-w-xl text-left">
                <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-widest text-[#f5f3ff]">
                  <Flame className="h-3.5 w-3.5" /> Depto. de Evangelismo y Misiones
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight">Embajadores del Evangelio por Todo el Mundo</h2>
                <p className="text-xs text-white/95 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {config?.sections?.evangelismo?.title || "Departamento de Evangelismo"}: {config?.sections?.evangelismo?.description || "Llevando el mensaje de salvación a cada rincón del país."}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block p-4 bg-white/10 rounded-2xl border border-white/20 select-none text-center min-w-[100px]">
              <span className="block text-2xl font-black font-display text-white">{evangelistasList.length}</span>
              <span className="block text-[8px] font-mono uppercase tracking-widest text-purple-100">Evangelistas y Misiones</span>
            </div>
          </div>

          {/* SECCIÓN DINÁMICA DE HISTORIA Y DIRECTIVA DEL DEPARTAMENTO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 1. SECCIÓN DE CONTENIDO EDITABLE (Nuestra Historia) */}
            <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-3xs text-left relative flex flex-col justify-between min-h-[320px]">
              {adminLoggedIn && (
                <button
                  onClick={() => openEditor("evangelismo_historia")}
                  className="absolute top-4 right-4 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition shadow"
                  title="Editar Historia del Departamento"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Editar Historia</span>
                </button>
              )}
              
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-widest">
                  Nuestra Historia
                </span>
                <h3 className="text-lg font-black font-display text-slate-950 uppercase tracking-tight">
                  Trayectoria y Propósito
                </h3>
                <div className="text-xs text-slate-600 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {config?.evangelismoHistoria || `El Departamento de Evangelismo y Misiones fue constituido con el claro propósito de avivar el fuego misionero, plantando nuevas congregaciones y respaldando a los obreros en las regiones más remotas. 

A través de campañas, conferencias y capacitación continua, impulsamos la proclamación de la sana doctrina pentecostal y el desarrollo comunitario integral.`}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-6 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-semibold">Actualizado en tiempo real</span>
                <Flame className="h-4 w-4 text-purple-500 animate-pulse" />
              </div>
            </div>

            {/* 2. DIRECTIVA DEL DEPARTAMENTO (Formulario Dinámico y Grid estilo Junta Nacional) */}
            <div className="lg:col-span-7 bg-white border border-slate-100 p-6 rounded-[2rem] shadow-3xs text-left flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-widest">
                      Organización
                    </span>
                    <h3 className="text-lg font-black font-display text-slate-950 uppercase tracking-tight">
                      Directiva de Depto.
                    </h3>
                  </div>
                  {adminLoggedIn && (
                    <button
                      onClick={openEvBoardAdd}
                      className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow"
                      title="Añadir Directivo del Departamento"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Nuevo Directivo</span>
                    </button>
                  )}
                </div>

                {/* Grid de directivos de evangelismo estilo Junta Nacional: formato Grid de 4 columnas por fila en móviles */}
                <div className="pt-2">
                  <DirectivosGrid
                    members={evangelismoDirectivos}
                    adminLoggedIn={adminLoggedIn}
                    onEdit={openEvBoardEdit}
                    onDelete={onDeleteEvangelismoDirectivo}
                    deptType="evangelismo"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Directory search or register row */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar evangelistas o misioneras certificadas..."
                value={evQuery}
                onChange={(e) => setEvQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600 shadow-3xs"
              />
            </div>
            {adminLoggedIn && (
              <button
                onClick={() => onNavigateToSecretRegisterWithTab ? onNavigateToSecretRegisterWithTab("evangelismo") : onNavigateToSecretRegister?.()}
                className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-sm hover:shadow-md h-fit whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Miembro del Departamento</span>
              </button>
            )}
          </div>

          {/* Missionaries Grid grouped by 13 Zones */}
          <div className="space-y-4">
            {Array.from({ length: 13 }, (_, i) => `Zona ${i + 1}`).map((zone) => {
              // Filter evangelistas for this zone
              const zoneEvangelistas = evangelistasList.filter(
                (user) => (user.zona || "").trim().toLowerCase() === zone.toLowerCase()
              );

              const isSearchActive = evQuery.trim() !== "";
              const isOpen = openEvZones.includes(zone) || (isSearchActive && zoneEvangelistas.length > 0);

              const toggleZone = () => {
                if (openEvZones.includes(zone)) {
                  setOpenEvZones(openEvZones.filter((z) => z !== zone));
                } else {
                  setOpenEvZones([...openEvZones, zone]);
                }
              };

              return (
                <div key={zone} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-3xs transition-all hover:border-purple-100">
                  {/* Accordion header button */}
                  <button
                    onClick={toggleZone}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/60 hover:bg-slate-50 text-left font-display text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                      <span>{zone}</span>
                      <span className="ml-2 py-0.5 px-2 bg-purple-100 text-purple-850 rounded-full font-mono font-bold text-[10px] lowercase tracking-normal">
                        {zoneEvangelistas.length}
                      </span>
                    </div>
                    <div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Content rendering */}
                  {isOpen && (
                    <div className="p-5 bg-slate-50/10">
                      {zoneEvangelistas.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
                          {zoneEvangelistas.map((user) => (
                            <div
                              key={user.id}
                              className="bg-white hover:bg-slate-50/50 border border-slate-100 p-5 rounded-3xl hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4"
                            >
                              <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full overflow-hidden border bg-slate-100 relative flex-shrink-0 flex items-center justify-center">
                                  {user.photoUrl ? (
                                    <img
                                      src={user.photoUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <User className="h-8 w-8 text-slate-300" />
                                  )}
                                </div>
                                <div className="text-left space-y-1">
                                  <span className="inline-block text-[8px] font-mono uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                    {user.ministerio || "Evangelista Certificado"}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-900 font-display">
                                    {user.nombres} {user.apellidos}
                                  </h4>
                                  <p className="text-[11px] text-slate-450 font-semibold leading-none">{user.iglesia}</p>
                                </div>
                              </div>

                              <div className="border-t pt-3 flex items-center justify-between text-[11px]">
                                <span className="font-mono text-slate-400">{adminLoggedIn ? `ID: ${user.cedula}` : "ID: Protegido"}</span>
                                
                                <div className="flex items-center gap-2">
                                  {adminLoggedIn && onDeleteMember && (
                                    <button
                                      onClick={async () => {
                                        await onDeleteMember(user.id);
                                      }}
                                      className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Eliminar</span>
                                    </button>
                                  )}
                                  {adminLoggedIn && (
                                    <button
                                      onClick={() => {
                                        const dynamicUrl = `${window.location.origin}/ver-miembro/${user.id}`;
                                        window.open(dynamicUrl, "_blank");
                                      }}
                                      className="py-1 px-3 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                    >
                                      <span>Ver Credencial</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 italic text-xs">
                          Ningún miembro registrado en esta zona.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {evangelistasList.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium italic">
                Ningún miembro registrado bajo el filtro de Evangelismo/Misiones todavía.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= SECTION: MIEMBROS DE LA FEDERACION ================= */}
      {currentTab === "miembros" && (
        <div className="space-y-6">
          
          {/* Header Card banner */}
          <div className={`bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-500 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative ${adminLoggedIn ? 'border-2 border-dashed border-sky-300' : ''}`}>
            
            {adminLoggedIn && (
              <button
                onClick={() => openEditor("miembros")}
                className="absolute top-3 right-3 py-1 px-3 bg-white text-indigo-700 font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow hover:bg-sky-50 z-10"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar Encabezado</span>
              </button>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pr-16">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-white rounded-2xl p-1.5 shadow-lg select-none flex-shrink-0 flex items-center justify-center">
                <Users className="h-10 w-10 text-blue-700" />
              </div>
              <div className="space-y-2 max-w-xl text-left">
                <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-widest text-blue-50">
                  <Layers className="h-3.5 w-3.5" /> Membresía General de la Federación
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight">Cuerpo de Cristo Unido y Activo</h2>
                <p className="text-xs text-white/95 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {config?.sections?.miembros?.title || "Membresía General FIEP"}: {config?.sections?.miembros?.description || "Servidores de fe, diáconos, ujieres y la congregación en alianza conciliar."}
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block p-4 bg-white/10 rounded-2xl border border-white/20 select-none text-center min-w-[100px]">
              <span className="block text-2xl font-black font-display text-white">{miembrosList.length}</span>
              <span className="block text-[8px] font-mono uppercase tracking-widest text-sky-100">Miembros Afiliados</span>
            </div>
          </div>

          {/* Directory search or register row */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar miembros por nombre, cédula o congregación..."
                value={miembrosQuery}
                onChange={(e) => setMiembrosQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-3xs"
              />
            </div>
            {adminLoggedIn && (
              <button
                onClick={() => onNavigateToSecretRegisterWithTab ? onNavigateToSecretRegisterWithTab("miembro") : onNavigateToSecretRegister?.()}
                className="py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-sm hover:shadow-md h-fit whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Miembro (General)</span>
              </button>
            )}
          </div>

          {/* Members Grid grouped by 13 Zones */}
          <div className="space-y-4">
            {Array.from({ length: 13 }, (_, i) => `Zona ${i + 1}`).map((zone) => {
              // Filter members for this zone
              const zoneMembers = miembrosList.filter(
                (user) => (user.zona || "").trim().toLowerCase() === zone.toLowerCase()
              );

              const isSearchActive = miembrosQuery.trim() !== "";
              const isOpen = openZones.includes(zone) || (isSearchActive && zoneMembers.length > 0);

              const toggleZone = () => {
                if (openZones.includes(zone)) {
                  setOpenZones(openZones.filter((z) => z !== zone));
                } else {
                  setOpenZones([...openZones, zone]);
                }
              };

              return (
                <div key={zone} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-3xs transition-all hover:border-blue-100">
                  {/* Accordion header button */}
                  <button
                    onClick={toggleZone}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/60 hover:bg-slate-50 text-left font-display text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      <span>{zone}</span>
                      <span className="ml-2 py-0.5 px-2 bg-blue-100 text-blue-800 rounded-full font-mono font-bold text-[10px] lowercase tracking-normal">
                        {zoneMembers.length} {zoneMembers.length === 1 ? "miembro" : "miembros"}
                      </span>
                    </div>
                    <div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Accordion Content rendering */}
                  {isOpen && (
                    <div className="p-5 bg-slate-55/10">
                      {zoneMembers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
                          {zoneMembers.map((user) => (
                            <div
                              key={user.id}
                              className="bg-white hover:bg-slate-50/50 border border-slate-100 p-5 rounded-3xl hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4"
                            >
                              <div className="flex items-start gap-4">
                                <div className="h-16 w-16 rounded-full overflow-hidden border bg-slate-100 relative flex-shrink-0 flex items-center justify-center">
                                  {user.photoUrl ? (
                                    <img
                                      src={user.photoUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <User className="h-8 w-8 text-slate-300" />
                                  )}
                                </div>
                                <div className="text-left space-y-1">
                                  <span className="inline-block text-[8px] font-mono uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    {user.ministerio || "Miembro Activo"}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-900 font-display">
                                    {user.nombres} {user.apellidos}
                                  </h4>
                                  <p className="text-[11px] text-slate-450 font-semibold leading-none">{user.iglesia}</p>
                                  {user.pastor && (
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Pastor: {user.pastor}</p>
                                  )}
                                </div>
                              </div>

                              <div className="border-t pt-3 flex items-center justify-between text-[11px]">
                                <span className="font-mono text-slate-400">{adminLoggedIn ? `ID: ${user.cedula}` : "ID: Protegido"}</span>
                                
                                <div className="flex items-center gap-2">
                                  {adminLoggedIn && onDeleteMember && (
                                    <button
                                      onClick={async () => {
                                        await onDeleteMember(user.id);
                                      }}
                                      className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Eliminar</span>
                                    </button>
                                  )}
                                  {adminLoggedIn && (
                                    <button
                                      onClick={() => {
                                        const dynamicUrl = `${window.location.origin}/ver-miembro/${user.id}`;
                                        window.open(dynamicUrl, "_blank");
                                      }}
                                      className="py-1 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                    >
                                      <span>Ver Credencial</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400 font-medium italic text-xs">
                          Ningún miembro registrado en {zone} bajo este filtro todavía.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Check for legacy/uncategorized members without a standard Zona assigned */}
            {(() => {
              const uncategorized = miembrosList.filter(user => {
                const z = (user.zona || "").trim().toLowerCase();
                return !Array.from({ length: 14 }, (_, i) => `zona ${i + 1}`).includes(z);
              });

              if (uncategorized.length === 0) return null;

              const isSearchActive = miembrosQuery.trim() !== "";
              const isOpen = openZones.includes("uncategorized") || (isSearchActive && uncategorized.length > 0);

              const toggleUncategorized = () => {
                if (openZones.includes("uncategorized")) {
                  setOpenZones(openZones.filter((z) => z !== "uncategorized"));
                } else {
                  setOpenZones([...openZones, "uncategorized"]);
                }
              };

              return (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 overflow-hidden shadow-3xs">
                  <button
                    onClick={toggleUncategorized}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50 text-left font-display text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                      <span>Otros Miembros (Sin Zona Asignada)</span>
                      <span className="ml-2 py-0.5 px-2 bg-slate-100 text-slate-600 rounded-full font-mono font-bold text-[10px] lowercase tracking-normal">
                        {uncategorized.length} {uncategorized.length === 1 ? "miembro" : "miembros"}
                      </span>
                    </div>
                    <div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-5 bg-slate-50/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn">
                        {uncategorized.map((user) => (
                          <div
                            key={user.id}
                            className="bg-white hover:bg-slate-50/50 border border-slate-100 p-5 rounded-3xl hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4"
                          >
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 rounded-full overflow-hidden border bg-slate-100 relative flex-shrink-0 flex items-center justify-center">
                                {user.photoUrl ? (
                                  <img
                                    src={user.photoUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <User className="h-8 w-8 text-slate-300" />
                                )}
                              </div>
                               <div className="text-left space-y-1">
                                 <span className="inline-block text-[8px] font-mono uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                   {user.ministerio || "Miembro Activo"}
                                 </span>
                                 <h4 className="text-sm font-black text-slate-900 font-display">
                                   {user.nombres} {user.apellidos}
                                 </h4>
                                 <p className="text-[11px] text-slate-450 font-semibold leading-none">{user.iglesia}</p>
                                 {user.pastor && (
                                   <p className="text-[10px] text-slate-500 font-medium mt-0.5">Pastor: {user.pastor}</p>
                                 )}
                               </div>
                            </div>

                            <div className="border-t pt-3 flex items-center justify-between text-[11px]">
                              <span className="font-mono text-slate-400">{adminLoggedIn ? `ID: ${user.cedula}` : "ID: Protegido"}</span>
                              
                              <div className="flex items-center gap-2">
                                {adminLoggedIn && onDeleteMember && (
                                  <button
                                    onClick={async () => {
                                      await onDeleteMember(user.id);
                                    }}
                                    className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                  >
                                    <Trash2 className="h-3 w-3 text-white" />
                                    <span>Eliminar</span>
                                  </button>
                                )}
                                {adminLoggedIn && (
                                  <button
                                    onClick={() => {
                                      const dynamicUrl = `${window.location.origin}/ver-miembro/${user.id}`;
                                      window.open(dynamicUrl, "_blank");
                                    }}
                                    className="py-1 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                                  >
                                    <span>Ver Credencial</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {miembrosList.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium italic text-xs">
                Ningún miembro registrado en la federación todavía.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= SECTION 3: INSTITUTO BIBLICO IBEM PRE-REGISTRAR ================= */}
      {currentTab === "instituto" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {adminLoggedIn && (
            <button
              onClick={() => openEditor("instituto_general")}
              className="absolute -top-4 right-4 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-md z-10"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar Sedes e Información</span>
            </button>
          )}

          {/* Left: General Academic info cards ( profesores, dates, schedules) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
              {adminLoggedIn && (
                <button
                  onClick={() => openEditor("instituto_descripcion")}
                  className="absolute top-4 right-4 py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white font-extrabold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition shadow-sm z-10"
                >
                  <Pencil className="h-3 w-3 text-white" />
                  <span>Editar Descripción</span>
                </button>
              )}
              <div className="h-16 w-16 md:h-20 md:w-20 bg-white rounded-2xl p-1.5 shadow-lg select-none flex-shrink-0 flex items-center justify-center">
                <img 
                  src="https://i.postimg.cc/8cMwkdrJ/Gemini-Generated-Image-62ha0f62ha0f62ha.png" 
                  alt="Logo Oficial Instituto" 
                  className="h-full w-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-3 text-left">
                <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-widest text-[#fdf2f2]">
                  <BookOpen className="h-3.5 w-3.5" /> Seminario Teológico IBEM
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight">Forme su Vocación de Altar</h2>
                <p className="text-xs text-white/95 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {config?.institutoDescripcion || "Súmese a los cursos ministeriales y profundice en teología bíblica, homilía evangélica y misiones. El programa académico de la federación está diseñado para obreros que trazan fielmente la palabra de verdad."}
                </p>
              </div>
            </div>

            {/* Dynamic Directiva / Docentes del Instituto Section */}
            <div className="bg-white border text-left p-6 rounded-[2rem] shadow-3xs space-y-4">
              <div className="border-b pb-2 flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-sm uppercase text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Users className="h-4 w-4" /></span>
                  Directiva y Cuerpo Docente (IBEM)
                </h3>
                {adminLoggedIn && (
                  <button
                    onClick={openInstBoardAdd}
                    className="py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-3xs"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Añadir Docente/Directivo</span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <DirectivosGrid
                  members={institutoDirectivos}
                  adminLoggedIn={adminLoggedIn}
                  onEdit={openInstBoardEdit}
                  onDelete={onDeleteInstitutoDirectivo}
                  deptType="instituto"
                />
              </div>
            </div>

            {/* Academic Info Grid Cards */}
            <div className="bg-white border text-left p-6 rounded-[2rem] shadow-3xs space-y-6">

              {/* Direct query link whatsapp support - GREEN ACCENT FOR DIRECT REGISTRATION AND CONTACT */}
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-150 flex items-start gap-3.5">
                <span className="p-2 bg-emerald-500 rounded-xl text-white">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.01-5.114-2.853-6.958C16.64 1.94 14.168.927 11.535.927c-5.451 0-9.887 4.434-9.89 9.886-.001 1.769.465 3.493 1.348 5.03l-.997 3.642 3.73-.978zm11.758-6.195c-.321-.16-.1.897-.482.897-.13-.01-.25-.06-.34-.14-.49-.49-1.29-1.37-1.83-1.92-.48-.48-.37-.84-.04-1.23.11-.12.22-.24.33-.37.11-.13.16-.27.08-.41-.08-.14-.48-1.15-.65-1.57-.17-.41-.35-.35-.48-.36-.13-.01-.27-.01-.41-.01s-.36.05-.55.26c-.19.21-.73.71-.73 1.74s.75 2.02.85 2.16c.11.14 1.48 2.26 3.59 3.17.5.21.89.34 1.2.44.5.16.96.14 1.32.08.41-.06 1.25-.51 1.42-1 .18-.5.18-.92.13-1-.05-.09-.2-.15-.52-.31z" />
                  </svg>
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-900 font-display">Finalizar Preinscripción por WhatsApp</h4>
                  <p className="text-[11px] text-emerald-700 font-sans font-medium leading-relaxed">
                    ¿Desea finalizar su proceso, enviar su documentación o solventar dudas? Abra WhatsApp con nuestro número central directo:
                  </p>
                  <a
                    href="https://wa.me/584166735964?text=Hola,%20deseo%20completar%20mi%20preinscripci%C3%B3n%20en%20las%20clases%20de%20teolog%C3%ADa%20del%20IBEM."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition shadow-sm mt-1 cursor-pointer"
                  >
                    <span>Finalizar Inscripción por WhatsApp (+58 416-6735964)</span>
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Right: Pre-registration Application interactive Form */}
          <div className="lg:col-span-6 bg-white border rounded-[2rem] shadow-sm p-6 sm:p-8 space-y-6 text-left">
            <div className="border-b pb-3 space-y-1">
              <span className="text-[9px] font-mono font-black uppercase text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                FORM_PRE_ACCADEMICO_2026
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 font-display uppercase tracking-tight">Formulario de Admisión Web</h3>
              <p className="text-xs text-slate-500 font-semibold font-sans leading-relaxed">
                Complete minuciosamente sus antecedentes ministeriales en este casillero. La secretaría evaluará los requisitos en asamblea ordinaria.
              </p>
            </div>

            {formDone ? (
              <div className="p-6 bg-emerald-50 border border-emerald-150 rounded-2xl text-center space-y-5 animate-scaleUp">
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-950 font-display uppercase tracking-tight">¡Inscripción Registrada!</h4>
                  <p className="text-[11.5px] text-emerald-800 font-sans mt-1 leading-relaxed font-semibold">
                    Su planilla de inscripción para el Instituto Bíblico IBEM se ha generado y descargado de forma automática. Siga estos pasos sencillos para finalizar:
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => downloadPlanillaPDF(lastSubmitted)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Descargar Planilla PDF de Nuevo</span>
                  </button>
                  
                  <a
                    href={getWhatsAppLink(lastSubmitted)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition text-center flex items-center justify-center gap-2"
                  >
                    <span>Enviar Datos Directo al Director por WhatsApp</span>
                  </a>
                </div>

                <div className="pt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setFormDone(false)}
                    className="py-1.5 px-4 text-[10px] text-slate-500 hover:text-slate-800 font-bold bg-slate-100/60 hover:bg-slate-150 rounded-lg transition"
                  >
                    Registrar otra postulación
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePreinscripcionSubmit} className="space-y-4 text-xs font-semibold">
                
                {/* 1. Nombres y Apellidos */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Nombres <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pNombre}
                      onChange={(e) => setPNombre(e.target.value)}
                      placeholder="Juan"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Apellidos <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pApellido}
                      onChange={(e) => setPApellido(e.target.value)}
                      placeholder="Mendoza"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl"
                    />
                  </div>
                </div>

                {/* 2. Cédula y Fecha de Nacimiento */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Cédula o Identidad <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pCedula}
                      onChange={(e) => setPCedula(e.target.value)}
                      placeholder="ej: V-12.345.678"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Fecha de Nacimiento <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pFechaNacimiento}
                      onChange={(e) => setPFechaNacimiento(e.target.value)}
                      placeholder="ej: DD/MM/AAAA"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 3. Edad y Iglesia */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Edad <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pEdad}
                      onChange={(e) => setPEdad(e.target.value)}
                      placeholder="ej: 28"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Miembro de la Iglesia <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pIglesia}
                      onChange={(e) => setPIglesia(e.target.value)}
                      placeholder="Nombre de la Iglesia"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl"
                    />
                  </div>
                </div>

                {/* 4. Ubicación de la Iglesia y Pastor */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Iglesia Ubicada en <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pIglesiaUbicacion}
                      onChange={(e) => setPIglesiaUbicacion(e.target.value)}
                      placeholder="Ciudad / Sector de Iglesia"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Pastor(a) de la Iglesia <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pPastor}
                      onChange={(e) => setPPastor(e.target.value)}
                      placeholder="Nombre del Pastor"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl"
                    />
                  </div>
                </div>

                {/* 5. Teléfono Pastor y Fecha de Inicio Curso */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Teléfono del Pastor <span className="text-rose-600">*</span></label>
                    <input
                      type="tel"
                      required
                      value={pPastorTelefono}
                      onChange={(e) => setPPastorTelefono(e.target.value)}
                      placeholder="Número del Pastor"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Curso inicia el <span className="text-rose-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={pFechaInicio}
                      onChange={(e) => setPFechaInicio(e.target.value)}
                      placeholder="ej: DD/MM/AAAA"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 6. Celular Personal y Teléfono de un Hermano */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Número Celular Personal <span className="text-rose-600">*</span></label>
                    <input
                      type="tel"
                      required
                      value={pCelular}
                      onChange={(e) => setPCelular(e.target.value)}
                      placeholder="Su Número de WhatsApp"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Teléfono de un Hermano/Contacto <span className="text-rose-600">*</span></label>
                    <input
                      type="tel"
                      required
                      value={pCelularHermano}
                      onChange={(e) => setPCelularHermano(e.target.value)}
                      placeholder="Contacto Alternativo"
                      className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 7. Fecha de Inscripción del Formulario */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Fecha de Inscripción (Hoy) <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={pFechaInscripcion}
                    onChange={(e) => setPFechaInscripcion(e.target.value)}
                    className="w-full p-2.5 border bg-slate-50 rounded-xl font-mono font-bold"
                  />
                </div>

                {/* 8. Breve reseña del llamado / ministerio */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Cuéntenos brevemente su llamado o ministerio congregacional</label>
                  <textarea
                    value={pMotivo}
                    onChange={(e) => setPMotivo(e.target.value)}
                    placeholder="ej: Deseo prepararme para pastorear misiones rurales o instruir en escuela dominical..."
                    rows={3}
                    className="w-full p-2.5 border bg-slate-50 rounded-xl leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {formLoading ? "Enviando Solicitud..." : "Enviar Formulario de Admisión"}
                </button>

              </form>
            )}

          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* ================ CONTEXTUAL MODALS RENDERER ============= */}
      {/* ========================================================== */}
      
      {editingKey && !["instituto_general", "evangelismo_historia", "instituto_descripcion"].includes(editingKey) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-xs sm:text-sm">Editar Encabezado de Sección</h3>
              <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Nombre / Título de la Sección</label>
                <input
                  type="text"
                  value={tempSectTitle}
                  onChange={(e) => setTempSectTitle(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Descripción / Slogan de la Sección</label>
                <textarea
                  rows={4}
                  value={tempSectDesc}
                  onChange={(e) => setTempSectDesc(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setEditingKey(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white cursor-pointer transition">Cancelar</button>
              <button
                disabled={saving}
                onClick={saveContextualChanges}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition flex items-center gap-1"
              >
                {saving ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar Encabezado</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {editingKey === "evangelismo_historia" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-xl w-full flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-purple-400" />
                <h3 className="font-extrabold font-display uppercase tracking-tight text-xs sm:text-sm">Editar Nuestra Historia / Descripción</h3>
              </div>
              <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Historia / Reseña / Misión y Visión de Misiones</label>
                <p className="text-[10px] text-slate-400">Puedes ingresar libremente la historia del departamento, misión, visión, o cualquier detalle relevante del trabajo misionero evangelístico.</p>
                <textarea
                  rows={10}
                  value={tempEvangelismoHistoria}
                  onChange={(e) => setTempEvangelismoHistoria(e.target.value)}
                  placeholder="Ej: El Departamento de Evangelismo y Misiones fue constituido con el claro propósito de alcanzar..."
                  className="w-full text-xs font-semibold p-4 bg-slate-50 border border-slate-200 rounded-2xl leading-relaxed focus:ring-1 focus:ring-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setEditingKey(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white cursor-pointer transition">Cancelar</button>
              <button
                disabled={saving}
                onClick={saveContextualChanges}
                className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition flex items-center gap-1"
              >
                {saving ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar Detalles</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {editingKey === "instituto_descripcion" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-xl w-full flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-orange-400" />
                <h3 className="font-extrabold font-display uppercase tracking-tight text-xs sm:text-sm">Editar Descripción del Instituto</h3>
              </div>
              <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Descripción / Invitación del Seminario</label>
                <p className="text-[10px] text-slate-400">Puedes ingresar la descripción que se mostrará en el banner del Instituto Bíblico IBEM.</p>
                <textarea
                  rows={8}
                  value={tempInstitutoDescripcion}
                  onChange={(e) => setTempInstitutoDescripcion(e.target.value)}
                  placeholder="Ej: Súmese a los cursos ministeriales y profundice en teología bíblica..."
                  className="w-full text-xs font-semibold p-4 bg-slate-50 border border-slate-200 rounded-2xl leading-relaxed focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setEditingKey(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white cursor-pointer transition">Cancelar</button>
              <button
                disabled={saving}
                onClick={saveContextualChanges}
                className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition flex items-center gap-1"
              >
                {saving ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar Descripción</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {editingKey === "instituto_general" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-xs sm:text-sm">Editar Datos Académicos IBEM</h3>
              <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Cuerpo Docente / Profesores</label>
                <textarea
                  rows={3}
                  value={tempProf}
                  onChange={(e) => setTempProf(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setEditingKey(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white cursor-pointer transition">Cancelar</button>
              <button
                disabled={saving}
                onClick={saveContextualChanges}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition flex items-center gap-1"
              >
                {saving ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar Cambios</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {activeEvBoardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-xs sm:text-sm flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-purple-400" />
                {activeEvBoardModal === "add" ? "Registrar Directivo de Depto." : "Editar Directivo de Depto."}
              </h3>
              <button onClick={() => setActiveEvBoardModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Cargo / Rol en el Depto.</label>
                <input
                  type="text"
                  value={tempEvBoardCargo}
                  onChange={(e) => setTempEvBoardCargo(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Ej: Director, Secretario, Tesorero, Vocal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Nombre</label>
                  <input
                    type="text"
                    value={tempEvBoardNombre}
                    onChange={(e) => setTempEvBoardNombre(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Apellido</label>
                  <input
                    type="text"
                    value={tempEvBoardApellido}
                    onChange={(e) => setTempEvBoardApellido(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Foto del Líder (Resolución Original)</label>
                <div className="flex items-center gap-4">
                  {tempEvBoardPhoto ? (
                    <div className="h-16 w-16 rounded-xl border border-dashed border-slate-200 object-contain overflow-hidden bg-white flex items-center justify-center p-1">
                      <img src={tempEvBoardPhoto} alt="" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-slate-50 border border-dashed flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-350" />
                    </div>
                  )}
                  
                  <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer hover:border-slate-400 group pb-3">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-semibold">Subir Foto Original</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLocalFileRead(e, setTempEvBoardPhoto)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setActiveEvBoardModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white cursor-pointer transition">Cancelar</button>
              <button
                disabled={saving}
                onClick={saveEvBoardMember}
                className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition flex items-center gap-1"
              >
                {saving ? "Registrando..." : <><Save className="h-4 w-4" /> Guardar Directivo</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {activeInstBoardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-xs sm:text-sm flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-orange-400" />
                {activeInstBoardModal === "add" ? "Registrar Directivo o Docente IBEM" : "Editar Directivo o Docente IBEM"}
              </h3>
              <button onClick={() => setActiveInstBoardModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Cargo / Rol en el IBEM</label>
                <input
                  type="text"
                  value={tempInstBoardCargo}
                  onChange={(e) => setTempInstBoardCargo(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Ej: Director Académico, Profesor de Teología, Secretaria, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Nombre</label>
                  <input
                    type="text"
                    value={tempInstBoardNombre}
                    onChange={(e) => setTempInstBoardNombre(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Apellido</label>
                  <input
                    type="text"
                    value={tempInstBoardApellido}
                    onChange={(e) => setTempInstBoardApellido(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Foto del Líder o Profesor (Resolución Original)</label>
                <div className="flex items-center gap-4">
                  {tempInstBoardPhoto ? (
                    <div className="h-16 w-16 rounded-xl border border-dashed border-slate-200 object-contain overflow-hidden bg-white flex items-center justify-center p-1">
                      <img src={tempInstBoardPhoto} alt="" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-slate-50 border border-dashed flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-355" />
                    </div>
                  )}
                  
                  <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer hover:border-slate-400 group pb-3">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-semibold">Subir Foto Original</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLocalFileRead(e, setTempInstBoardPhoto)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setActiveInstBoardModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white cursor-pointer transition">Cancelar</button>
              <button
                disabled={saving}
                onClick={saveInstBoardMember}
                className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition flex items-center gap-1"
              >
                {saving ? "Registrando..." : <><Save className="h-4 w-4" /> Guardar Directivo</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
