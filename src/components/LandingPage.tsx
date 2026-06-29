import React, { useState } from "react";
import { AppConfig, Publicacion, BoardMember, PresbiteroZona } from "../types";
import { uploadToImgBB } from "../utils/imgbb";
import Logo from "./Logo";
import NewsPost from "./NewsPost";
import HitosGallery from "./HitosGallery";
import {
  Users,
  Flame,
  BookOpen,
  Play,
  ArrowRight,
  User as UserIcon,
  Video,
  ImageIcon,
  Calendar,
  Layers,
  Facebook,
  Share2,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  Upload,
  Link
} from "lucide-react";

interface LandingPageProps {
  config: AppConfig | null;
  configLoading?: boolean;
  publications: Publicacion[];
  boardMembers?: BoardMember[];
  presbiteros?: PresbiteroZona[];
  onNavigate: (tab: "inicio" | "pastores" | "evangelismo" | "miembros" | "instituto" | "publicaciones" | "admin") => void;
  adminLoggedIn: boolean;
  onEditLandingTexts?: () => void;
  logoLoading?: boolean;
  onSaveConfig: (updatedFields: Partial<AppConfig>) => Promise<void>;
  onCreatePublication: (texto: string, imgBase64: string, tipo: "imagen" | "video", videoUrl: string) => Promise<void>;
  onDeletePublication: (id: string) => Promise<void>;
  onCreateBoardMember: (cargo: string, nombre: string, apellido: string, photoUrl: string) => Promise<string | undefined>;
  onUpdateBoardMember: (id: string, cargo: string, nombre: string, apellido: string, photoUrl: string) => Promise<void>;
  onDeleteBoardMember: (id: string) => Promise<void>;
  onCreatePresbitero?: (nombre: string, apellido: string, cargo: string, zona: string, photoUrl: string) => Promise<string | undefined>;
  onUpdatePresbitero?: (id: string, nombre: string, apellido: string, cargo: string, zona: string, photoUrl: string) => Promise<void>;
  onDeletePresbitero?: (id: string) => Promise<void>;
  triggerToast: (msg: string) => void;
  onOpenPublication?: (id: string) => void;
}

export default function LandingPage({
  config,
  configLoading = false,
  publications,
  boardMembers = [],
  presbiteros = [],
  onNavigate,
  adminLoggedIn,
  logoLoading = false,
  onSaveConfig,
  onCreatePublication,
  onDeletePublication,
  onCreateBoardMember,
  onUpdateBoardMember,
  onDeleteBoardMember,
  onCreatePresbitero,
  onUpdatePresbitero,
  onDeletePresbitero,
  triggerToast,
  onOpenPublication
}: LandingPageProps) {
  
  const logoUrl = config?.logoBase64 || config?.logoUrl || "https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png";
  
  // Format dates elegantly for feed
  const formatPubDate = (timestamp: any) => {
    if (!timestamp) return "Reciente";
    try {
      const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return "Reciente";
    }
  };

  const milestones = config?.historyMilestones && config.historyMilestones.length > 0
    ? config.historyMilestones
    : [];

  const boardOfDirectors: BoardMember[] = boardMembers && boardMembers.length > 0
    ? boardMembers
    : (config?.juntaDirectiva && config.juntaDirectiva.length > 0 ? config.juntaDirectiva : []);

  const presName = config?.presidentName || "";
  const presLastName = config?.presidentLastName || "";
  const presPhoto = config?.presidentPhoto || "";
  const presMsg = config?.presidentMessage || "";

  // ================= EDIT MODAL STATE MANAGEMENT =================
  const [activeModal, setActiveModal] = useState<
    "hero" | "addMilestone" | "editMilestone" | "addPublication" | "president" | "junta" | "galeria" | "presbitero" | null
  >(null);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Temporary Edit Form states
  const [heroTitle, setHeroTitle] = useState(config?.heroTitle || "BIENVENIDO A LA PÁGINA OFICIAL DE LA");
  const [heroSubtitle, setHeroSubtitle] = useState(config?.heroSubtitle || "F.I.E.P. COLUMNA DE FUEGO");
  const [imgbbApiKey, setImgbbApiKey] = useState(config?.imgbbApiKey || "");

  // Milestones Temp
  const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState<number | null>(null);
  const [mileAno, setMileAno] = useState("");
  const [mileTitulo, setMileTitulo] = useState("");
  const [mileDesc, setMileDesc] = useState("");
  const [mileImgBase64, setMileImgBase64] = useState("");
  const [mileMediaList, setMileMediaList] = useState<{ type: "image" | "video"; url: string }[]>([]);
  const [tempMediaUrl, setTempMediaUrl] = useState("");
  const [tempMediaType, setTempMediaType] = useState<"image" | "video">("image");

  // President Temp
  const [tempPresName, setTempPresName] = useState(presName);
  const [tempPresLastName, setTempPresLastName] = useState(presLastName);
  const [tempPresMsg, setTempPresMsg] = useState(presMsg);
  const [tempPresPhoto, setTempPresPhoto] = useState(presPhoto);

  // Board Member Temp
  const [selectedBoardIdx, setSelectedBoardIdx] = useState<number | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [tempBoardCargo, setTempBoardCargo] = useState("");
  const [tempBoardNombre, setTempBoardNombre] = useState("");
  const [tempBoardApellido, setTempBoardApellido] = useState("");
  const [tempBoardPhoto, setTempBoardPhoto] = useState("");

  // Presbiteros Temp
  const [selectedPresbiteroId, setSelectedPresbiteroId] = useState<string | null>(null);
  const [tempPresbiteroNombre, setTempPresbiteroNombre] = useState("");
  const [tempPresbiteroApellido, setTempPresbiteroApellido] = useState("");
  const [tempPresbiteroCargo, setTempPresbiteroCargo] = useState("Presbítero");
  const [tempPresbiteroZona, setTempPresbiteroZona] = useState("Zona 1");
  const [tempPresbiteroPhoto, setTempPresbiteroPhoto] = useState("");

  // Publication Temp
  const [pubTexto, setPubTexto] = useState("");
  const [pubImg, setPubImg] = useState("");
  const [pubVideoUrl, setPubVideoUrl] = useState("");
  const [pubTipo, setPubTipo] = useState<"imagen" | "video">("imagen");
  const [saving, setSaving] = useState(false);

  // Synchronize editorial form values with firebase config once background load resolves
  React.useEffect(() => {
    if (config) {
      setHeroTitle(config.heroTitle || "BIENVENIDO A LA PÁGINA OFICIAL DE LA");
      setHeroSubtitle(config.heroSubtitle || "F.I.E.P. COLUMNA DE FUEGO");
      setTempPresName(config.presidentName || "");
      setTempPresLastName(config.presidentLastName || "");
      setTempPresMsg(config.presidentMessage || "");
      setTempPresPhoto(config.presidentPhoto || "");
      setImgbbApiKey(config.imgbbApiKey || "");
    }
  }, [config]);

  // Helper: Read files locally in full resolution
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

  const handleMultipleFilesRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      const isVideo = file.type?.startsWith("video/") || false;
      const isImage = file.type?.startsWith("image/") || false;
      
      if (!isImage && !isVideo) {
        triggerToast("Solo se permiten archivos de imagen o video.");
        return;
      }
      
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setMileMediaList((prev) => [
          ...prev,
          { type: isVideo ? "video" : "image", url: b64 }
        ]);
      };
      reader.readAsDataURL(file);
    });
    // Reset file input value
    e.target.value = "";
  };

  const handleAddManualMediaUrl = () => {
    if (!tempMediaUrl.trim()) {
      triggerToast("Ingresa un enlace válido.");
      return;
    }
    setMileMediaList((prev) => [
      ...prev,
      { type: tempMediaType, url: tempMediaUrl.trim() }
    ]);
    setTempMediaUrl("");
  };

  // ================= SAVE OPERATIONS =================
  const saveHeroTexts = async () => {
    setSaving(true);
    try {
      await onSaveConfig({
        heroTitle,
        heroSubtitle,
        imgbbApiKey
      });
      setActiveModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const savePresident = async () => {
    setSaving(true);
    try {
      let finalPhotoUrl = tempPresPhoto;
      if (tempPresPhoto && tempPresPhoto.startsWith("data:")) {
        triggerToast("Subiendo foto del presidente a ImgBB...");
        finalPhotoUrl = await uploadToImgBB(tempPresPhoto);
      }
      await onSaveConfig({
        presidentName: tempPresName,
        presidentLastName: tempPresLastName,
        presidentMessage: tempPresMsg,
        presidentPhoto: finalPhotoUrl
      });
      setActiveModal(null);
    } catch (e: any) {
      console.error(e);
      triggerToast("Error al guardar presidente: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  // Milestones managers
  const openMilestoneEdit = (idx: number) => {
    const mile = milestones[idx];
    setSelectedMilestoneIdx(idx);
    setMileAno(mile.ano);
    setMileTitulo(mile.titulo);
    setMileDesc(mile.descripcion);
    setMileImgBase64(mile.imagen || "");
    setMileMediaList(mile.mediaList || []);
    setActiveModal("editMilestone");
  };

  const openMilestoneAdd = () => {
    setMileAno("");
    setMileTitulo("");
    setMileDesc("");
    setMileImgBase64("");
    setMileMediaList([]);
    setActiveModal("addMilestone");
  };

  const saveMilestoneEdit = async () => {
    if (selectedMilestoneIdx === null) return;
    setSaving(true);
    try {
      let finalImgUrl = mileImgBase64;
      if (mileImgBase64 && mileImgBase64.startsWith("data:")) {
        triggerToast("Subiendo imagen de portada...");
        finalImgUrl = await uploadToImgBB(mileImgBase64);
      }

      const finalMediaList = [];
      for (const media of mileMediaList) {
        if (media.url && media.url.startsWith("data:")) {
          triggerToast("Subiendo multimedia de galería...");
          const uploadedUrl = await uploadToImgBB(media.url);
          finalMediaList.push({ type: media.type, url: uploadedUrl });
        } else {
          finalMediaList.push(media);
        }
      }

      const copy = [...milestones];
      copy[selectedMilestoneIdx] = {
        ...copy[selectedMilestoneIdx],
        ano: mileAno,
        titulo: mileTitulo,
        descripcion: mileDesc,
        imagen: finalImgUrl,
        mediaList: finalMediaList
      };
      await onSaveConfig({
        historyMilestones: copy
      });
      setActiveModal(null);
    } catch (e: any) {
      console.error(e);
      triggerToast("Error al guardar hito: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const saveMilestoneAdd = async () => {
    setSaving(true);
    try {
      let finalImgUrl = mileImgBase64;
      if (mileImgBase64 && mileImgBase64.startsWith("data:")) {
        triggerToast("Subiendo imagen de portada...");
        finalImgUrl = await uploadToImgBB(mileImgBase64);
      }

      const finalMediaList = [];
      for (const media of mileMediaList) {
        if (media.url && media.url.startsWith("data:")) {
          triggerToast("Subiendo multimedia de galería...");
          const uploadedUrl = await uploadToImgBB(media.url);
          finalMediaList.push({ type: media.type, url: uploadedUrl });
        } else {
          finalMediaList.push(media);
        }
      }

      const newMilestone = {
        id: "mile_" + Date.now(),
        ano: mileAno || new Date().getFullYear().toString(),
        titulo: mileTitulo || "Nuevo Hito",
        descripcion: mileDesc || "",
        imagen: finalImgUrl || "",
        mediaList: finalMediaList
      };
      await onSaveConfig({
        historyMilestones: [...milestones, newMilestone]
      });
      setActiveModal(null);
    } catch (e: any) {
      console.error(e);
      triggerToast("Error al agregar hito: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const deleteMilestone = async (idx: number) => {
    if (!window.confirm("¿Seguro de eliminar este hito histórico?")) return;
    try {
      const copy = milestones.filter((_, i) => i !== idx);
      await onSaveConfig({
         historyMilestones: copy
      });
      triggerToast("Hito histórico removido.");
    } catch (e) {
      console.error(e);
    }
  };

  // Board managers
  const openBoardAdd = () => {
    setSelectedBoardIdx(null);
    setSelectedBoardId(null);
    setTempBoardCargo("");
    setTempBoardNombre("");
    setTempBoardApellido("");
    setTempBoardPhoto("");
    setActiveModal("junta");
  };

  const openBoardEdit = (idx: number) => {
    const mbr = boardOfDirectors[idx];
    setSelectedBoardIdx(idx);
    setSelectedBoardId(mbr.id || null);
    setTempBoardCargo(mbr.cargo);
    setTempBoardNombre(mbr.nombre);
    setTempBoardApellido(mbr.apellido || "");
    setTempBoardPhoto(mbr.photoUrl || "");
    setActiveModal("junta");
  };

  const openPresbiteroAdd = (defaultZona?: string) => {
    setSelectedPresbiteroId(null);
    setTempPresbiteroNombre("");
    setTempPresbiteroApellido("");
    setTempPresbiteroCargo("Presbítero");
    setTempPresbiteroZona(defaultZona || "Zona 1");
    setTempPresbiteroPhoto("");
    setActiveModal("presbitero");
  };

  const openPresbiteroEdit = (item: PresbiteroZona) => {
    setSelectedPresbiteroId(item.id || null);
    setTempPresbiteroNombre(item.nombre);
    setTempPresbiteroApellido(item.apellido);
    setTempPresbiteroCargo(item.cargo || "Presbítero");
    setTempPresbiteroZona(item.zona || "Zona 1");
    setTempPresbiteroPhoto(item.photoUrl || "");
    setActiveModal("presbitero");
  };

  const saveBoardEdit = async () => {
    if (!tempBoardNombre.trim()) {
      alert("El nombre del directivo no puede estar vacío");
      return;
    }
    setSaving(true);
    try {
      let finalPhotoUrl = tempBoardPhoto;
      if (tempBoardPhoto && tempBoardPhoto.startsWith("data:")) {
        triggerToast("Subiendo foto de perfil a la red...");
        finalPhotoUrl = await uploadToImgBB(tempBoardPhoto);
      }

      if (selectedBoardId) {
        await onUpdateBoardMember(selectedBoardId, tempBoardCargo, tempBoardNombre, tempBoardApellido, finalPhotoUrl);
      } else if (selectedBoardIdx !== null) {
        // Legacy fallback
        let copy = [...boardOfDirectors];
        copy[selectedBoardIdx] = {
          cargo: tempBoardCargo,
          nombre: tempBoardNombre,
          apellido: tempBoardApellido,
          photoUrl: finalPhotoUrl
        };
        await onSaveConfig({
          juntaDirectiva: copy
        });
        triggerToast("Directivo legado actualizado con éxito.");
      } else {
        await onCreateBoardMember(tempBoardCargo, tempBoardNombre, tempBoardApellido, finalPhotoUrl);
      }
      setActiveModal(null);
    } catch (e: any) {
      console.error(e);
      triggerToast(e?.message || "Error al guardar directivo.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBoardMember = async () => {
    const isLegacy = selectedBoardIdx !== null && !selectedBoardId;
    if (selectedBoardIdx === null && !selectedBoardId) return;
    if (!window.confirm("¿Seguro de remover este directivo de la Junta Nacional?")) return;
    setSaving(true);
    try {
      if (selectedBoardId) {
        await onDeleteBoardMember(selectedBoardId);
      } else if (selectedBoardIdx !== null) {
        // Legacy fallback
        const copy = boardOfDirectors.filter((_, idx) => idx !== selectedBoardIdx);
        await onSaveConfig({
          juntaDirectiva: copy
        });
      }
      setActiveModal(null);
      triggerToast("Directivo removido de la Junta.");
    } catch (e: any) {
      console.error(e);
      triggerToast("Error al remover de la Junta.");
    } finally {
      setSaving(false);
    }
  };

  // Publication managers
  const savePublicationAdd = async () => {
    if (!pubTexto.trim()) {
      alert("La descripción de la publicación no puede quedar vacía.");
      return;
    }
    setSaving(true);
    try {
      await onCreatePublication(pubTexto, pubImg, pubTipo, pubVideoUrl);
      setPubTexto("");
      setPubImg("");
      setPubVideoUrl("");
      setActiveModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (configLoading) {
    return (
      <div className="space-y-12 pb-12 relative">
        {/* Skeleton 1: Slogan de Bienvenida */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-2 px-4">
          <div className="space-y-3">
            <div className="h-8 w-11/12 max-w-xl bg-slate-200 animate-pulse rounded-lg mx-auto" />
            <div className="h-4 w-3/4 max-w-sm bg-slate-200 animate-pulse rounded-lg mx-auto mt-2" />
            <div className="max-w-2xl mx-auto bg-slate-100/60 p-5 rounded-2xl border border-slate-200/50 animate-pulse flex flex-col items-center space-y-2.5">
              <div className="h-3.5 w-16 bg-slate-200 rounded-full" />
              <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </section>

        {/* Skeleton 2: Gradient Pills */}
        <section className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 sm:h-20 bg-slate-100/40 border border-slate-200/30 rounded-2xl p-2.5 sm:p-4 flex items-center justify-between animate-pulse">
                <div className="space-y-1.5 flex-1 text-left">
                  <div className="h-3 w-10/12 bg-slate-200 rounded" />
                  <div className="h-2 w-7/12 bg-slate-200 rounded" />
                </div>
                <div className="h-7 w-7 sm:h-9 sm:w-9 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        </section>

        {/* Skeleton 3: Split Layout */}
        <section className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Timeline */}
            <div className="lg:col-span-6 bg-slate-100/30 border border-slate-200/30 rounded-[2rem] p-6 sm:p-8 space-y-6 animate-pulse text-left">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-200 rounded-lg" />
                <div className="h-5 w-44 bg-slate-200 rounded" />
              </div>
              <div className="pl-6 border-l-2 border-slate-200/30 space-y-8 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-10 bg-slate-200 rounded" />
                    <div className="h-3.5 w-32 bg-slate-200 rounded" />
                    <div className="h-12 w-full bg-slate-200 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (President and News) */}
            <div className="lg:col-span-6 space-y-8 text-left">
              {/* President card */}
              <div className="bg-slate-100/30 border border-slate-200/30 rounded-[2rem] p-6 sm:p-8 space-y-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 bg-slate-200 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 flex-1 p-1">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 w-full bg-slate-200 rounded" />
                  <div className="h-3 w-5/6 bg-slate-200 rounded" />
                </div>
              </div>

              {/* Action grid (Recent Announcements) */}
              <div className="bg-slate-100/30 border border-slate-200/30 rounded-[2rem] p-6 sm:p-8 space-y-4 animate-pulse">
                <div className="h-5 w-44 bg-slate-200 rounded" />
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="h-48 bg-slate-200 rounded-2xl" />
                  <div className="h-48 bg-slate-200 rounded-2xl" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Skeleton 4: Junta Directiva */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-100/30 border border-slate-200/30 rounded-[2rem] p-6 sm:p-8 space-y-4 animate-pulse text-center">
            <div className="h-5 w-48 bg-slate-200 mx-auto rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-20 w-20 bg-slate-200 rounded-xl mx-auto" />
                  <div className="h-3/12 w-16 bg-slate-200 rounded mx-auto" />
                  <div className="h-3/12 w-20 bg-slate-200 rounded mx-auto mt-1" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skeleton 5: Presbíteros */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-100/30 border border-slate-200/30 rounded-[2rem] p-6 sm:p-8 space-y-4 animate-pulse text-left">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-200/30 rounded-2xl flex items-center p-2.5 gap-2.5">
                  <div className="h-9 w-9 bg-slate-200 rounded-full flex-shrink-0" />
                  <div className="space-y-1 w-full p-0.5">
                    <div className="h-2 w-8 bg-slate-200 rounded" />
                    <div className="h-3 w-12 bg-slate-200 rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 relative">
      
      {/* 1. Welcoming Slogan - Centered under the master navigation logo */}
      <section className={`text-center max-w-4xl mx-auto space-y-6 pt-2 px-4 transition-all duration-300 relative rounded-3xl p-4 ${adminLoggedIn ? 'border-2 border-dashed border-blue-400/50 bg-blue-50/10' : ''}`}>
        {adminLoggedIn && (
          <button
            onClick={() => {
              setHeroTitle(config?.heroTitle || "BIENVENIDO A LA PÁGINA OFICIAL DE LA");
              setHeroSubtitle(config?.heroSubtitle || "F.I.E.P. COLUMNA DE FUEGO");
              setActiveModal("hero");
            }}
            className="absolute top-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5 text-xs font-bold transition cursor-pointer z-10"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Editar Encabezado</span>
          </button>
        )}

        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-slate-900 tracking-tight leading-tight uppercase">
            {config?.heroTitle || "BIENVENIDO A LA PÁGINA OFICIAL DE LA F.I.E.P. COLUMNA DE FUEGO"}
          </h2>
          
          <div className="max-w-2xl mx-auto bg-white/75 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-sky-100/50 shadow-sm relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-extrabold uppercase font-mono tracking-widest px-3 py-0.5 rounded-full">
              Éxodo 13:21
            </div>
            <p className="text-slate-700 text-xs sm:text-sm italic font-medium leading-relaxed font-sans text-center mt-1">
              "Y Jehová iba delante de ellos de día en una columna de nube para guiarlos por el camino, y de noche en una columna de fuego para alumbrarles, a fin de que anduviesen de día y de noche."
            </p>
          </div>
        </div>
      </section>

      {/* 2. Four Gradient Pills Navigation Buttons - Image 1 Style */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Pill 1: Gremio Pastoral */}
          <button
            onClick={() => onNavigate("pastores")}
            className="group relative overflow-hidden bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500 hover:to-blue-600 text-white p-3 sm:p-4 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:brightness-105 cursor-pointer text-left"
          >
            <div className="absolute right-2 bottom-1 opacity-15 group-hover:scale-110 transition duration-300">
              <Users className="h-10 w-10 sm:h-16 sm:w-16 stroke-1 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase font-display select-none">
                Gremio Pastoral
              </h3>
              <p className="text-[9px] sm:text-[10px] text-white/90 font-medium font-sans mt-0.5 select-none line-clamp-2">
                - Organización de Pastores Profesionales
              </p>
            </div>
          </button>
 
          {/* Pill 2: Depto. de Evangelismo */}
          <button
            onClick={() => onNavigate("evangelismo")}
            className="group relative overflow-hidden bg-gradient-to-r from-[#a855f7] via-[#9333ea] to-[#7c3aed] hover:to-[#6d28d9] text-white p-3 sm:p-4 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:brightness-105 cursor-pointer text-left"
          >
            <div className="absolute right-2 bottom-1 opacity-15 group-hover:scale-110 transition duration-300">
              <Flame className="h-10 w-10 sm:h-16 sm:w-16 stroke-1 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase font-display select-none">
                Depto. de Evangelismo
              </h3>
              <p className="text-[9px] sm:text-[10px] text-white/90 font-medium font-sans mt-0.5 select-none line-clamp-2">
                - Evangelismo y Misiones
              </p>
            </div>
          </button>
 
          {/* Pill 3: Instituto Bíblico IBEM */}
          <button
            onClick={() => onNavigate("instituto")}
            className="group relative overflow-hidden bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:to-amber-600 text-white p-3 sm:p-4 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:brightness-105 cursor-pointer text-left"
          >
            <div className="absolute right-2 bottom-1 opacity-15 group-hover:scale-110 transition duration-300">
              <BookOpen className="h-10 w-10 sm:h-16 sm:w-16 stroke-1 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase font-display select-none">
                Instituto Bíblico IBEM
              </h3>
              <p className="text-[9px] sm:text-[10px] text-white/90 font-medium font-sans mt-0.5 select-none line-clamp-2">
                FORMACION Bíblica y TEOLOGICA
              </p>
            </div>
          </button>
 
          {/* Pill 4: Membresía */}
          <button
            onClick={() => onNavigate("miembros")}
            className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:to-teal-600 text-white p-3 sm:p-4 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:brightness-105 cursor-pointer text-left"
          >
            <div className="absolute right-2 bottom-1 opacity-15 group-hover:scale-110 transition duration-300">
              <Layers className="h-10 w-10 sm:h-16 sm:w-16 stroke-1 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase font-display select-none">
                Membresía
              </h3>
              <p className="text-[9px] sm:text-[10px] text-white/90 font-medium font-sans mt-0.5 select-none line-clamp-2">
                - Registro de 13 Zonas de la Congregación
              </p>
            </div>
          </button>
 
        </div>
      </section>

      {/* 3. Split Layout (Image 3: Desktop layout of homepage) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Nuestra Reseña Histórica (Vertical timeline with photos) */}
          <div className={`lg:col-span-6 bg-white/70 backdrop-blur rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 relative transition-all duration-300 ${adminLoggedIn ? 'border-2 border-dashed border-sky-400 bg-sky-50/10' : ''}`}>
            
            <div className="border-b pb-3 flex items-center justify-between gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight font-display text-left flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </span>
                Nuestra Reseña Histórica
              </h3>

              {adminLoggedIn && (
                <button
                  onClick={openMilestoneAdd}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Añadir Hito</span>
                </button>
              )}
            </div>

            {/* Vertical Central Line Timeline */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-dashed border-sky-200 space-y-8 text-left py-2">
              
              {milestones.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200/60 rounded-2xl text-center text-slate-400 font-sans italic text-xs">
                  Nuestra Reseña Histórica se encuentra en proceso de redacción y edición por la secretaría ejecutiva.
                </div>
              ) : (
                milestones.map((milestone, idx) => {
                  const nodeColors = [
                    "bg-sky-500 text-white ring-sky-100",
                    "bg-purple-500 text-white ring-purple-100",
                    "bg-orange-500 text-white ring-orange-100",
                    "bg-indigo-500 text-white ring-indigo-100"
                  ];
                  const activeColor = nodeColors[idx % nodeColors.length];

                  return (
                    <div key={milestone.id || idx} className="relative group space-y-2">
                      {/* Circle Node Marker */}
                      <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center font-display text-[9px] sm:text-xs font-black uppercase ring-4 ${activeColor}`}>
                        {idx + 1}
                      </div>

                      {/* Unified NewsPost & HitosGallery rendering */}
                      <NewsPost
                        ano={milestone.ano}
                        titulo={milestone.titulo}
                        descripcion={milestone.descripcion}
                        adminLoggedIn={adminLoggedIn}
                        onEdit={() => openMilestoneEdit(idx)}
                        onDelete={() => deleteMilestone(idx)}
                      >
                        <HitosGallery
                          imagen={milestone.imagen}
                          mediaList={milestone.mediaList}
                          onImageClick={(url) => setLightboxImage(url)}
                          title={milestone.titulo}
                        />
                      </NewsPost>
                    </div>
                  );
                })
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: Últimas Publicaciones Feed Grid */}
          <div className={`lg:col-span-6 bg-white/70 backdrop-blur rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6 relative transition-all duration-300 ${adminLoggedIn ? 'border-2 border-dashed border-purple-400 bg-purple-50/10' : ''}`}>
            
            <div className="border-b pb-3 flex items-center justify-between gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight font-display text-left flex items-center gap-2">
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Layers className="h-5 w-5" />
                </span>
                Últimas Publicaciones
              </h3>

              {adminLoggedIn && (
                <button
                  onClick={() => {
                    setPubTexto("");
                    setPubImg("");
                    setPubVideoUrl("");
                    setPubTipo("imagen");
                    setActiveModal("addPublication");
                  }}
                  className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Añadir Publicación</span>
                </button>
              )}
            </div>

            {publications.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200/80 rounded-2xl p-4 text-slate-400 font-sans text-xs italic">
                No hay publicaciones registradas por el momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {publications.slice(0, 4).map((pub) => {
                  const isVideo = pub.tipo === "video" || pub.videoUrl;
                  const itemImg = pub.imagenBase64 || (pub as any).photoUrl || "";
                  
                  if (isVideo) {
                    // 9:16 vertical video reel aspect ratio preview
                    return (
                      <div
                        key={pub.id}
                        onClick={() => onOpenPublication && onOpenPublication(pub.id)}
                        className="aspect-[9/16] w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer transition shadow-3xs hover:shadow-md flex flex-col justify-end p-4 text-left"
                      >
                        {itemImg && (
                          <img
                            src={itemImg}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition duration-500"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/20 border border-white/20 text-white flex items-center justify-center backdrop-blur-xs transition group-hover:scale-110">
                          <Play className="h-4 w-4 fill-current ml-0.5 text-white" />
                        </div>

                        <div className="relative z-20 space-y-1.5">
                          <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-sky-600 text-white px-2.5 py-0.5 rounded-md font-mono">Video Reel</span>
                          <p className="text-white text-[11px] font-bold line-clamp-3 font-sans leading-relaxed">
                            {pub.texto}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    // 1:1 square photo preview ratio
                    return (
                      <div
                        key={pub.id}
                        onClick={() => onOpenPublication && onOpenPublication(pub.id)}
                        className="aspect-square w-full bg-slate-50 border border-slate-200/50 rounded-2xl overflow-hidden relative group cursor-pointer transition shadow-3xs hover:shadow-xs flex flex-col justify-end p-4 text-left"
                      >
                        {itemImg && (
                          <img
                            src={itemImg}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />

                        <div className="relative z-20 space-y-1.5">
                          <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-purple-600 text-white px-2.5 py-0.5 rounded-md font-mono">Fotografía</span>
                          <p className="text-white text-[11px] font-bold line-clamp-3 font-sans leading-relaxed">
                            {pub.texto}
                          </p>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {/* Ver Más Publicaciones Paginator Link */}
            <div className="pt-2 text-center col-span-full">
              <button
                onClick={() => onNavigate("publicaciones")}
                className="w-full py-3 bg-white hover:bg-sky-50 text-slate-800 hover:text-blue-700 font-bold text-xs uppercase tracking-wider rounded-2xl border border-slate-200 hover:border-sky-300 shadow-3xs hover:shadow-sm transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver más Publicaciones</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Nuestra Directiva Staff Section (Beige Card - Image 1 Style) */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-[#fefdfa] border border-amber-100/50 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6 text-left relative">
          
          <div className="border-b border-amber-100/50 pb-3">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Nuestra Directiva Nacional
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* President Card Intro */}
            <div className={`md:col-span-5 bg-[#faf8f4] border border-amber-100/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative group/presCard ${adminLoggedIn ? 'border-2 border-dashed border-amber-400' : ''}`}>
              {adminLoggedIn && (
                <button
                  onClick={() => {
                    setTempPresName(presName);
                    setTempPresLastName(presLastName);
                    setTempPresMsg(presMsg);
                    setTempPresPhoto(presPhoto);
                    setActiveModal("president");
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer z-10 shadow-sm"
                  title="Editar Presidente"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Editar</span>
                </button>
              )}

              <div className="flex items-center gap-4 text-left">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-white shadow bg-slate-100 flex-shrink-0 relative flex items-center justify-center">
                  {presPhoto ? (
                    <img src={presPhoto} alt="Presidente convocante" referrerPolicy="no-referrer" className="h-full w-full object-cover relative z-10" />
                  ) : (
                    <UserIcon className="h-12 w-12 text-slate-300" />
                  )}
                </div>
                <div>
                  <span className="text-[8px] font-extrabold text-amber-600 bg-amber-100/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                    Presidente
                  </span>
                  <h4 className="text-base font-black text-slate-900 leading-tight mt-1 font-display">
                    {presName || "N/A"} {presLastName || ""}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-semibold italic leading-relaxed font-sans bg-white p-3.5 rounded-xl border border-[#faf8f4] shadow-xs text-left">
                "{presMsg || "Mensaje pastoral de la federación para todo el cuerpo de Cristo."}"
              </p>
            </div>

            {/* Other Board Executives */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4 text-left">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                  Ejecutivos de la Junta Directiva
                </h5>
                {adminLoggedIn && (
                  <button
                    onClick={openBoardAdd}
                    className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title="Añadir miembro"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Añadir miembro</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {boardOfDirectors.map((mbr, index) => (
                  <div
                    key={index}
                    className={`flex flex-col bg-white hover:bg-slate-50/50 rounded-2xl border border-slate-100 shadow-3xs overflow-hidden relative group/mbrCard transition-all duration-300 ${adminLoggedIn ? "border-2 border-dashed border-blue-400" : ""}`}
                  >
                    {adminLoggedIn && (
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10 animate-fadeIn">
                        <button
                          onClick={async () => {
                            if (!window.confirm("¿Seguro de remover este directivo de la Junta Nacional?")) return;
                            try {
                              if (mbr.id) {
                                await onDeleteBoardMember(mbr.id);
                              } else {
                                // Legacy fallback
                                const copy = boardOfDirectors.filter((_, idx) => idx !== index);
                                await onSaveConfig({ juntaDirectiva: copy });
                              }
                              triggerToast("Directivo removido de la Junta.");
                            } catch (err) {
                              console.error(err);
                              triggerToast("Error al remover de la Junta.");
                            }
                          }}
                          className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer"
                          title="Eliminar directivo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openBoardEdit(index)}
                          className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
                          title="Editar directivo"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Portrait Frame (Square box rounded-2xl so they are complete and small) */}
                    <div className="pt-4 pb-1.5 flex justify-center items-center select-none">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex-shrink-0 relative flex items-center justify-center">
                        {mbr.photoUrl ? (
                          <img 
                            src={mbr.photoUrl} 
                            alt={`${mbr.nombre} ${mbr.apellido || ""}`} 
                            referrerPolicy="no-referrer" 
                            className="h-full w-full object-contain group-hover/mbrCard:scale-105 transition-transform duration-500 relative z-10 p-0.5" 
                          />
                        ) : (
                          <UserIcon className="h-10 w-10 text-slate-300 stroke-1" />
                        )}
                      </div>
                    </div>

                    {/* Integrated Text block */}
                    <div className="p-2 pb-3 bg-white flex flex-col justify-start items-center text-center flex-grow gap-1 whitespace-normal">
                      <span className="inline-block text-[8px] sm:text-[9px] font-black text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded uppercase tracking-wider font-mono leading-none">
                        {mbr.cargo}
                      </span>
                      <h5 className="text-[10px] sm:text-xs font-bold text-slate-900 font-display mt-0.5 leading-tight break-words max-w-full px-1">
                        {mbr.nombre} {mbr.apellido || ""}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-400 font-semibold text-center md:text-right mt-auto bg-slate-50/40 p-2.5 rounded-xl border border-slate-100 leading-normal">
                Elegidos democráticamente mediante asamblea general de pastores constituidos.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Presbíteros de Zona Section (Optimización de Espacio) */}
      <section className="max-w-4xl mx-auto px-4 mt-8 pb-4">
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-xs space-y-4 text-left relative">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                Presbíteros de Zona
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wider font-mono">
                Supervisión administrativa y espiritual por distritos ministeriales
              </p>
            </div>
            
            {adminLoggedIn && (
              <button
                onClick={() => openPresbiteroAdd()}
                className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition shadow-xs self-start sm:self-auto"
                title="Registrar Presbítero"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Registrar Presbítero</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3.5">
            {Array.from({ length: 13 }, (_, i) => {
              const zonaName = `Zona ${i + 1}`;
              const presby = presbiteros.find((p) => p.zona === zonaName);
              
              return (
                <div
                  key={zonaName}
                  className={`flex flex-col bg-slate-50/50 hover:bg-slate-50 rounded-2xl border transition-all duration-300 relative group/pCard ${
                    presby ? "border-slate-150 p-1.5 sm:p-2.5" : "border-slate-100 border-dashed p-1.5 sm:p-3 justify-center items-center h-full min-h-[80px] sm:min-h-[90px]"
                  }`}
                >
                  {presby ? (
                    <>
                      {/* Admin action overlays */}
                      {adminLoggedIn && (
                        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/pCard:opacity-100 transition duration-200 z-10 bg-white/85 p-1 rounded-lg backdrop-blur-xs">
                          <button
                            onClick={() => openPresbiteroEdit(presby)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition cursor-pointer"
                            title="Editar Presbítero"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`¿Seguro de remover al presbítero de la ${zonaName}?`)) return;
                              try {
                                if (presby.id) {
                                  await onDeletePresbitero?.(presby.id);
                                  triggerToast("Presbítero retirado de la zona.");
                                }
                              } catch (err) {
                                console.error(err);
                                triggerToast("Error al remover presbítero.");
                              }
                            }}
                            className="p-1 text-rose-600 hover:text-rose-800 transition cursor-pointer"
                            title="Remover Presbítero"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {/* Photo or Fallback */}
                      <div className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
                        <div className="h-12 w-12 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center relative shadow-xs">
                          {presby.photoUrl ? (
                            <img
                              src={presby.photoUrl}
                              alt={`${presby.nombre} ${presby.apellido}`}
                              className="h-full w-full object-contain p-0.5"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 sm:h-10 sm:w-10 text-slate-300 stroke-1" />
                          )}
                        </div>
                        <div className="w-full">
                          <span className="block text-[7px] sm:text-[8px] font-black uppercase text-blue-600 font-mono tracking-widest leading-none mb-0.5 sm:mb-1">
                            {zonaName}
                          </span>
                          <h4 className="text-[9px] sm:text-[11px] font-extrabold text-slate-900 leading-tight font-display break-words">
                            {presby.nombre} {presby.apellido}
                          </h4>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center flex flex-col items-center">
                      <span className="text-[7.5px] sm:text-[9px] font-black text-slate-400 font-mono uppercase tracking-widest">{zonaName}</span>
                      <span className="text-[8px] sm:text-[9.5px] font-bold text-slate-400 mt-0.5 sm:mt-1">Por Asignar</span>
                      {adminLoggedIn && (
                        <button
                          onClick={() => openPresbiteroAdd(zonaName)}
                          className="mt-1 py-0.5 px-1.5 sm:py-1 sm:px-2.5 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-600 font-black rounded-lg text-[7px] sm:text-[8px] uppercase tracking-wider cursor-pointer transition"
                        >
                          Asignar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* ======================= GLOBAL EDIT MODALS RENDERER ==================== */}
      {/* ========================================================================= */}

      {/* Modal 1: Hero Titles */}
      {activeModal === "hero" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-sm">Editar Textos de Bienvenida</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Título Superior General</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white"
                  placeholder="Ej: BIENVENIDO A LA PÁGINA OFICIAL DE LA"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Nombre de la Federación o Slogan</label>
                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white"
                  placeholder="Ej: F.I.E.P. COLUMNA DE FUEGO"
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-dashed border-slate-200">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-600 font-mono">API Key de ImgBB (Tu Cuenta)</label>
                <input
                  type="text"
                  value={imgbbApiKey}
                  onChange={(e) => setImgbbApiKey(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-blue-50/50 border border-blue-200 rounded-xl focus:border-blue-500 focus:bg-white"
                  placeholder="Pega tu API Key de ImgBB para subir las fotos a tu cuenta"
                />
                <span className="block text-[10.5px] text-slate-500 font-medium leading-relaxed">
                  Configura tu API Key de <a href="https://imgbb.com/    " target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">imgbb.com</a> para que todas las fotos de la junta, directivos, hitos, presidente y publicaciones se guarden de manera duradera en tu propia cuenta.
                </span>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setActiveModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white transition cursor-pointer">Cancelar</button>
              <button
                disabled={saving}
                onClick={saveHeroTexts}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                {saving ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar Cambios</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 2: Milestones Add / Edit */}
      {(activeModal === "editMilestone" || activeModal === "addMilestone") && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-sm">
                {activeModal === "addMilestone" ? "Añadir Hito Histórico" : "Editar Hito Histórico"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Año / Fecha</label>
                  <input
                    type="text"
                    value={mileAno}
                    onChange={(e) => setMileAno(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Ej: 1985"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Título del Hito</label>
                  <input
                    type="text"
                    value={mileTitulo}
                    onChange={(e) => setMileTitulo(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Ej: Fundación de la Iglesia Central"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Descripción Reseña Histórica</label>
                <textarea
                  rows={4}
                  value={mileDesc}
                  onChange={(e) => setMileDesc(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Redacte la reseña histórica de este acontecimiento..."
                />
              </div>

              {/* ADVANCED MULTIMEDIA MANAGER (ILIMITADO - IMÁGENES Y VIDEOS) */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 font-mono">
                    Galería Multimedia del Hito (Ilimitada)
                  </label>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    {mileMediaList.length} Elementos
                  </span>
                </div>

                {/* Previews of active mediaList */}
                {mileMediaList.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto">
                    {mileMediaList.map((media, mIdx) => (
                      <div key={mIdx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative group/preview">
                        {media.type === "image" ? (
                          <img src={media.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-white p-1 bg-slate-900">
                            <Play className="h-5 w-5 text-blue-400 fill-blue-400 mb-1" />
                            <span className="text-[7px] font-extrabold uppercase tracking-widest text-center truncate w-full">Video</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setMileMediaList((prev) => prev.filter((_, i) => i !== mIdx))}
                          className="absolute inset-0 bg-red-600/90 text-white font-extrabold text-[9px] uppercase tracking-wider flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Upload Zone - Supports Drag & Drop and Multiple selects of image and video */}
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center py-4 px-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-400 transition cursor-pointer text-center group">
                    <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition mb-1" />
                    <span className="text-xs text-slate-700 font-bold">Seleccionar archivos (Fotos y Videos)</span>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">Puedes seleccionar múltiples fotos y videos a la vez</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMultipleFilesRead}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Manual Link Adder for larger files or external URLs */}
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/80 space-y-2">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                    ¿Agregar por Enlace o URL externa?
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={tempMediaType}
                      onChange={(e) => setTempMediaType(e.target.value as "image" | "video")}
                      className="text-xs font-semibold p-2.5 bg-white border border-slate-200 rounded-xl flex-shrink-0"
                    >
                      <option value="image">Imagen</option>
                      <option value="video">Video</option>
                    </select>
                    <input
                      type="url"
                      value={tempMediaUrl}
                      onChange={(e) => setTempMediaUrl(e.target.value)}
                      placeholder="https://ejemplo.com/video-o-foto.mp4"
                      className="flex-grow text-xs font-semibold p-2.5 bg-white border border-slate-200 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualMediaUrl}
                      className="px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center cursor-pointer transition shadow-3xs"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Legacy Main Image Support */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                      Foto de Portada Principal (Opcional)
                    </label>
                    {mileImgBase64 && (
                      <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-mono font-bold">Activa</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {mileImgBase64 && (
                      <div className="h-10 w-10 rounded-lg border object-cover overflow-hidden bg-slate-50 relative group flex-shrink-0">
                        <img src={mileImgBase64} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMileImgBase64("")}
                          className="absolute inset-0 bg-red-600/85 text-white font-extrabold text-[8px] uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    )}
                    <label className="flex-grow py-2 px-3 rounded-xl border border-dashed border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer hover:border-slate-300 transition text-[11px] text-slate-500 font-semibold">
                      <Upload className="h-3.5 w-3.5 text-slate-400" />
                      <span>{mileImgBase64 ? "Cambiar Portada" : "Subir Portada Principal"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocalFileRead(e, setMileImgBase64)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setActiveModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white transition cursor-pointer">Cancelar</button>
              <button
                disabled={saving}
                onClick={activeModal === "addMilestone" ? saveMilestoneAdd : saveMilestoneEdit}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                {saving ? "Guardando..." : <><Save className="h-4 w-4" /> Guardar Hito</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 3: President Details */}
      {activeModal === "president" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-sm">Editar Ficha del Presidente</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Nombre</label>
                  <input
                    type="text"
                    value={tempPresName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTempPresName(v);
                      onSaveConfig({ presidentName: v });
                    }}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Apellidos</label>
                  <input
                    type="text"
                    value={tempPresLastName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTempPresLastName(v);
                      onSaveConfig({ presidentLastName: v });
                    }}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Mensaje del Altar o Lema</label>
                <textarea
                  rows={3}
                  value={tempPresMsg}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTempPresMsg(v);
                    onSaveConfig({ presidentMessage: v });
                  }}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Foto de Rango Clerical (Resolución Original)</label>
                <div className="flex items-center gap-4">
                  {tempPresPhoto && (
                    <div className="h-16 w-16 rounded-full border object-cover overflow-hidden bg-slate-50 relative group">
                      <img src={tempPresPhoto} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  
                  <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer hover:border-slate-400 group">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-semibold">Subir Foto Original</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleLocalFileRead(e, (b64) => {
                          setTempPresPhoto(b64);
                          onSaveConfig({ presidentPhoto: b64 });
                        });
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setActiveModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white transition cursor-pointer">Cancelar</button>
              <button
                disabled={saving}
                onClick={savePresident}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
              >
                {saving ? "Guardando..." : "Guardar Presidente"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 4: Board Members Details */}
      {activeModal === "junta" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-sm">
                {selectedBoardIdx !== null ? "Editar Directivo de la Junta" : "Añadir Directivo de la Junta"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Cargo / Rol en la Junta</label>
                <input
                  type="text"
                  value={tempBoardCargo}
                  onChange={(e) => setTempBoardCargo(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder=""
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Nombre</label>
                  <input
                    type="text"
                    value={tempBoardNombre}
                    onChange={(e) => setTempBoardNombre(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Apellido</label>
                  <input
                    type="text"
                    value={tempBoardApellido}
                    onChange={(e) => setTempBoardApellido(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Foto de Perfil del Líder (Resolución Original)</label>
                <div className="flex items-center gap-4">
                  {tempBoardPhoto && (
                    <div className="h-16 w-16 rounded-full border object-cover overflow-hidden bg-slate-50">
                      <img src={tempBoardPhoto} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  
                  <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer hover:border-slate-400 group">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-semibold">Subir Foto Original</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLocalFileRead(e, setTempBoardPhoto)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-between gap-3.5">
              <div>
                {selectedBoardIdx !== null && (
                  <button
                    type="button"
                    onClick={deleteBoardMember}
                    className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Eliminar Directivo
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white transition cursor-pointer">Cancelar</button>
                <button
                  disabled={saving}
                  onClick={saveBoardEdit}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
                >
                  {saving ? "Guardando..." : "Guardar Directivo"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal 5: Add Publication */}
      {activeModal === "addPublication" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-sm">Nueva Publicación en Contexto</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              
              <div className="flex bg-slate-100 p-1.5 rounded-xl gap-2 font-black text-[10px] uppercase font-mono mb-2">
                <button
                  onClick={() => setPubTipo("imagen")}
                  className={`flex-1 py-2 text-center rounded-lg transition ${pubTipo === "imagen" ? "bg-white text-slate-900 shadow-3xs" : "text-slate-500"}`}
                >
                  Foto / Galería Oficial
                </button>
                <button
                  onClick={() => setPubTipo("video")}
                  className={`flex-1 py-2 text-center rounded-lg transition ${pubTipo === "video" ? "bg-white text-slate-900 shadow-3xs" : "text-slate-500"}`}
                >
                  Video o Sermón
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Texto / Mensaje / Novedad</label>
                <textarea
                  rows={4}
                  value={pubTexto}
                  onChange={(e) => setPubTexto(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white"
                  placeholder="Escriba el contenido pastoral, invitación o noticia eclesiástica..."
                />
              </div>

              {pubTipo === "video" && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Enlace Externo del Video (Opcional)</label>
                  <input
                    type="url"
                    value={pubVideoUrl}
                    onChange={(e) => setPubVideoUrl(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Ej: https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                  {pubTipo === "video" ? "Video local o Poster original (Resolución original)" : "Fotografía oficial de Iglesia (Resolución original)"}
                </label>
                <div className="flex items-center gap-4">
                  {(pubImg || pubVideoUrl.startsWith("data:video/")) && (
                    <div className="h-16 w-16 rounded-xl border object-cover overflow-hidden bg-slate-50">
                      {pubTipo === "video" && pubVideoUrl.startsWith("data:video/") ? (
                        <video src={pubVideoUrl} className="h-full w-full object-cover" />
                      ) : (
                        <img src={pubImg || pubVideoUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  )}
                  
                  <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer hover:border-slate-400 group">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-semibold">Subir Archivo Original</span>
                    <input
                      type="file"
                      accept={pubTipo === "video" ? "video/*,image/*" : "image/*"}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (file.type.startsWith("video/")) {
                              setPubVideoUrl(reader.result as string);
                            } else {
                              setPubImg(reader.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setActiveModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white transition cursor-pointer">Cancelar</button>
              <button
                disabled={saving}
                onClick={savePublicationAdd}
                className="py-2.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
              >
                {saving ? "Guardando..." : "Publicar Anuncio"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 6: Multimedia Gallery (Complete grid display) */}
      {activeModal === "galeria" && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-extrabold font-display uppercase tracking-tight text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                  Galería Multimedia Oficial
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Fotos y Videos Históricos • Avisos de Fe</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800 p-2 rounded-xl transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              {publications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic font-sans">
                  No hay publicaciones multimedia disponibles todavía.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                  {publications.map((pub) => {
                    const isVideo = pub.tipo === "video" || pub.videoUrl;
                    return (
                      <div key={pub.id} className="bg-slate-50 border p-5 rounded-3xl text-left space-y-4 shadow-3xs relative flex flex-col justify-between">
                        
                        {adminLoggedIn && (
                          <button
                            onClick={async () => {
                              if (window.confirm("¿Seguro de remover esta publicación permanentemente?")) {
                                await onDeletePublication(pub.id);
                              }
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-750 rounded-lg cursor-pointer transition z-10"
                            title="Eliminar Publicación"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 text-[8px] font-extrabold uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full ${isVideo ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                              {isVideo ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                              {isVideo ? "Video / Sermón" : "Actividad General"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">{formatPubDate(pub.fecha)}</span>
                          </div>

                          <p className="text-slate-700 text-xs font-semibold leading-relaxed font-sans whitespace-pre-wrap">{pub.texto}</p>

                          {isVideo ? (
                            <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex flex-col justify-center bg-black min-h-[200px] p-2 shadow-inner">
                              {pub.videoUrl && pub.videoUrl.startsWith("data:video/") ? (
                                <video 
                                  src={pub.videoUrl} 
                                  controls 
                                  className="w-full h-auto max-h-[300px] object-contain rounded-xl"
                                />
                              ) : (
                                <>
                                  {pub.imagenBase64 ? (
                                    <img src={pub.imagenBase64} alt="" className="absolute inset-0 h-full w-full object-contain opacity-40 filter brightness-50" />
                                  ) : (
                                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center opacity-40">
                                      <Video className="h-11 w-11 text-slate-600 stroke-1" />
                                    </div>
                                  )}
                                  
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <a
                                      href={pub.videoUrl || "#"}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="h-12 w-12 rounded-full bg-white text-slate-900 hover:bg-sky-500 hover:text-white flex items-center justify-center shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-110"
                                    >
                                      <Play className="h-5 w-5 fill-current ml-0.5" />
                                    </a>
                                  </div>
                                  
                                  <div className="relative z-10 text-[9px] bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-white truncate max-w-full font-mono mt-auto text-center">
                                    Enlace: {pub.videoUrl ? pub.videoUrl.substring(0, 45) + "..." : "Sermón Virtual"}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            pub.imagenBase64 && (
                              <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-3xs flex justify-center bg-slate-50">
                                <img
                                  src={pub.imagenBase64}
                                  alt="Anuncio Oficial FIEP"
                                  className="w-full h-auto object-contain max-h-[300px] animate-fadeIn"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end">
              <button 
                onClick={() => setActiveModal(null)} 
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Cerrar Galería
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal 7: Presbíteros de Zona */}
      {activeModal === "presbitero" && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold font-display uppercase tracking-tight text-sm">
                {selectedPresbiteroId ? "Editar Presbítero de Zona" : "Asignar Presbítero de Zona"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-grow text-slate-800">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Cargo</label>
                <input
                  type="text"
                  disabled
                  value={tempPresbiteroCargo}
                  className="w-full text-xs font-semibold p-3 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Nombre <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={tempPresbiteroNombre}
                    onChange={(e) => setTempPresbiteroNombre(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder=""
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Apellido <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    required
                    value={tempPresbiteroApellido}
                    onChange={(e) => setTempPresbiteroApellido(e.target.value)}
                    className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder=""
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Zona <span className="text-rose-600">*</span></label>
                <select
                  value={tempPresbiteroZona}
                  onChange={(e) => setTempPresbiteroZona(e.target.value)}
                  className="w-full text-xs font-semibold p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  {Array.from({ length: 13 }, (_, i) => `Zona ${i + 1}`).map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">Foto de Perfil del Presbítero</label>
                <div className="flex items-center gap-4">
                  {tempPresbiteroPhoto && (
                    <div className="h-16 w-16 rounded-full border object-cover overflow-hidden bg-slate-50">
                      <img src={tempPresbiteroPhoto} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  
                  <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 cursor-pointer hover:border-slate-400 group">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-semibold text-slate-600">Subir Foto Original</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLocalFileRead(e, setTempPresbiteroPhoto)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-end gap-3.5">
              <button onClick={() => setActiveModal(null)} className="py-2.5 px-6 border font-bold text-xs rounded-xl hover:bg-white transition cursor-pointer">Cancelar</button>
              <button
                disabled={saving}
                onClick={async () => {
                  if (!tempPresbiteroNombre.trim() || !tempPresbiteroApellido.trim()) {
                    triggerToast("Nombres y apellidos son requeridos.");
                    return;
                  }
                  setSaving(true);
                  try {
                    let finalPhotoUrl = tempPresbiteroPhoto;
                    if (tempPresbiteroPhoto && tempPresbiteroPhoto.startsWith("data:")) {
                      triggerToast("Subiendo foto a la nube...");
                      finalPhotoUrl = await uploadToImgBB(tempPresbiteroPhoto);
                    }

                    if (selectedPresbiteroId) {
                      await onUpdatePresbitero?.(
                        selectedPresbiteroId,
                        tempPresbiteroNombre,
                        tempPresbiteroApellido,
                        "Presbítero",
                        tempPresbiteroZona,
                        finalPhotoUrl
                      );
                      triggerToast("Presbítero de zona actualizado con éxito.");
                    } else {
                      await onCreatePresbitero?.(
                        tempPresbiteroNombre,
                        tempPresbiteroApellido,
                        "Presbítero",
                        tempPresbiteroZona,
                        finalPhotoUrl
                      );
                      triggerToast("Presbítero de zona registrado con éxito.");
                    }
                    setActiveModal(null);
                  } catch (err: any) {
                    console.error(err);
                    triggerToast("Error al procesar presbítero.");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition"
              >
                {saving ? "Guardando..." : "Guardar Presbítero"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Resolution Milestone Images */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer z-50 shadow-md"
            title="Cerrar vista"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div 
            className="max-w-5xl max-h-[85vh] relative flex flex-col items-center justify-center animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="Vista completa" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div className="mt-4 flex gap-4">
              <a 
                href={lightboxImage} 
                download="fiep_imagen.png" 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer border border-white/5 shadow-sm"
              >
                <Upload className="h-4 w-4 rotate-180" />
                <span>Abrir en nueva pestaña</span>
              </a>
              <button 
                onClick={() => setLightboxImage(null)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
