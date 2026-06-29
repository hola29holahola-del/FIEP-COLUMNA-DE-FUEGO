import React, { useState } from "react";
import { AppConfig, PresinscritoInstituto, IglesiaUsuario } from "../types";
import Logo from "./Logo";
import { downloadPlanillaPDF, getWhatsAppLink, downloadCredentialPDF, downloadAllCredentialsPDF } from "../lib/pdfHelper";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
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
  Eye,
  Upload,
  FileSpreadsheet,
  Download,
  QrCode,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Database,
  Filter
} from "lucide-react";

interface AdminDashboardProps {
  config: AppConfig | null;
  triggerToast: (msg: string) => void;
  currentUserEmail: string | null;
  onSignOut: () => void;
  onNavigateBack?: () => void;
  allEnrollments: PresinscritoInstituto[];
  onDeleteEnrollment: (id: string) => Promise<void>;
  allUsers: IglesiaUsuario[];
}

export default function AdminDashboard({
  config,
  triggerToast,
  currentUserEmail,
  onSignOut,
  onNavigateBack,
  allEnrollments = [],
  onDeleteEnrollment,
  allUsers = []
}: AdminDashboardProps) {

  const [activeTab, setActiveTab] = useState<"links" | "ibem" | "afiliados" | "importar">("links");
  
  // Link status copy helpers
  const [copiedSec, setCopiedSec] = useState(false);
  const [copiedMas, setCopiedMas] = useState(false);

  // Bible Institute states
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<string | null>(null);

  // Affiliate Directory states
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliateFilterDept, setAffiliateFilterDept] = useState<string>("all");
  const [affiliateFilterZone, setAffiliateFilterZone] = useState<string>("all");

  // Bulk Importer states
  const [csvText, setCsvText] = useState("");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [targetDeptMode, setTargetDeptMode] = useState<"auto" | "pastores" | "evangelismo" | "miembros">("auto");
  const [importing, setImporting] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

  // Filter affiliates directory
  const filteredAffiliates = allUsers.filter((user) => {
    const query = affiliateSearch.toLowerCase();
    const fullName = `${user.nombres} ${user.apellidos}`.toLowerCase();
    const cedula = (user.cedula || "").toLowerCase();
    const iglesia = (user.iglesia || "").toLowerCase();
    const minister = (user.ministerio || user.rol || "").toLowerCase();

    const matchesSearch = fullName.includes(query) || cedula.includes(query) || iglesia.includes(query) || minister.includes(query);
    const matchesDept = affiliateFilterDept === "all" || user.departamento === affiliateFilterDept;
    
    // Normalize user zone (e.g. "Zona 1" or "1" to match correctly)
    const userZoneClean = (user.zona || "").trim().toLowerCase().replace("zona", "").trim();
    const filterZoneClean = affiliateFilterZone.trim().toLowerCase().replace("zona", "").trim();
    const matchesZone = affiliateFilterZone === "all" || userZoneClean === filterZoneClean;

    return matchesSearch && matchesDept && matchesZone;
  });

  // Delete an affiliate from Firestore and trigger real-time reactive sync
  const handleDeleteMember = async (user: IglesiaUsuario) => {
    if (!window.confirm(`¿Está seguro de eliminar de forma permanente a ${user.nombres} ${user.apellidos}? Esta acción borrará su credencial digital de los servidores.`)) {
      return;
    }
    
    let collName = "miembros_generales";
    if (user.departamento === "pastores" || user.departamento === "gremio") {
      collName = "gremio";
    } else if (user.departamento === "evangelismo") {
      collName = "evangelismo";
    } else if (user.departamento === "general") {
      collName = "usuarios";
    }

    try {
      await deleteDoc(doc(db, collName, user.id));
      triggerToast("¡Afiliado eliminado correctamente de Firestore!");
    } catch (err) {
      console.error("Error deleting member:", err);
      triggerToast("Error al intentar eliminar el afiliado de Firestore.");
    }
  };

  // Helper function to convert Google Sheets edit URL into a published web CSV URL
  const parseGoogleSheetsUrl = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    }
    return url;
  };

  // Custom robust CSV parser that handles semi-colons, commas, tabs and wrapping quotes
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    let separator = ",";
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;

    if (semicolons > commas && semicolons > tabs) {
      separator = ";";
    } else if (tabs > commas && tabs > semicolons) {
      separator = "\t";
    }

    const result: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row: string[] = [];
      let insideQuote = false;
      let entry = "";

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === separator && !insideQuote) {
          row.push(entry.trim().replace(/^"|"$/g, ""));
          entry = "";
        } else {
          entry += char;
        }
      }
      row.push(entry.trim().replace(/^"|"$/g, ""));
      result.push(row);
    }

    return result;
  };

  // Core parsing method for CSV string values
  const handleParseCSV = (rawText: string) => {
    const rows = parseCSV(rawText);
    if (rows.length < 2) {
      setParsedPreview([]);
      triggerToast("El archivo o texto cargado no posee suficientes filas o datos.");
      return;
    }

    // Header normalization to lower sans accent marks
    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[áéíóú]/g, (match) => {
      if (match === 'á') return 'a';
      if (match === 'é') return 'e';
      if (match === 'í') return 'i';
      if (match === 'ó') return 'o';
      if (match === 'ú') return 'u';
      return match;
    }));

    const findHeaderIndex = (names: string[]) => {
      return headers.findIndex(h => names.some(n => h.includes(n)));
    };

    const nameIdx = findHeaderIndex(["nombre", "name", "first name", "nombres"]);
    const lastnameIdx = findHeaderIndex(["apellido", "last name", "apellidos"]);
    const cedulaIdx = findHeaderIndex(["cedula", "ci", "id", "cédula", "documento", "dni"]);
    const rolIdx = findHeaderIndex(["rol", "ministerio", "cargo", "role", "position", "puesto"]);
    const zonaIdx = findHeaderIndex(["zona", "zone", "seccion", "distrito"]);
    const iglesiaIdx = findHeaderIndex(["iglesia", "church", "congregacion", "templo", "donde se congrega"]);
    const pastorIdx = findHeaderIndex(["pastor", "pastora", "pastor de su congregacion"]);
    const ciudadIdx = findHeaderIndex(["ciudad", "city", "estado", "state"]);
    const puebloIdx = findHeaderIndex(["pueblo", "town", "poblacion"]);
    const caserioIdx = findHeaderIndex(["caserio", "village", "caserio", "caserio"]);
    const edadIdx = findHeaderIndex(["edad", "age"]);
    const nacimientoIdx = findHeaderIndex(["fecha", "nacimiento", "birth", "birthdate", "fechanacimiento", "fecha de nacimiento", "dob"]);
    const deptIdx = findHeaderIndex(["departamento", "dept", "seccion", "tipo", "collection"]);

    const parsed = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || !row[0]) continue;

      const nombres = nameIdx !== -1 ? row[nameIdx] || "" : "";
      const apellidos = lastnameIdx !== -1 ? row[lastnameIdx] || "" : "";
      const cedula = cedulaIdx !== -1 ? row[cedulaIdx] || "" : "";
      const rol = rolIdx !== -1 ? row[rolIdx] || "" : "";
      const zona = zonaIdx !== -1 ? row[zonaIdx] || "" : "";
      const iglesia = iglesiaIdx !== -1 ? row[iglesiaIdx] || "" : "";
      const pastor = pastorIdx !== -1 ? row[pastorIdx] || "" : "";
      const ciudad = ciudadIdx !== -1 ? row[ciudadIdx] || "" : "";
      const pueblo = puebloIdx !== -1 ? row[puebloIdx] || "" : "";
      const caserio = caserioIdx !== -1 ? row[caserioIdx] || "" : "";
      const edad = edadIdx !== -1 ? row[edadIdx] || "" : "";
      const fechaNacimiento = nacimientoIdx !== -1 ? row[nacimientoIdx] || "" : "";
      const rawDept = deptIdx !== -1 ? row[deptIdx] || "" : "";

      // Only push if there's at least a valid name
      if (nombres.trim()) {
        parsed.push({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          cedula: cedula.trim(),
          rol: rol.trim(),
          zona: zona.trim(),
          iglesia: iglesia.trim(),
          pastor: pastor.trim(),
          ciudad: ciudad.trim(),
          pueblo: pueblo.trim(),
          caserio: caserio.trim(),
          edad: edad.trim(),
          fechaNacimiento: fechaNacimiento.trim(),
          rawDept: rawDept.trim()
        });
      }
    }

    setParsedPreview(parsed);
    triggerToast(`¡Se detectaron ${parsed.length} registros listos para importación!`);
  };

  // Google Sheets integration logic
  const handleFetchGoogleSheets = async () => {
    if (!sheetsUrl.trim()) {
      triggerToast("Por favor introduzca la dirección URL de Google Sheets.");
      return;
    }

    const formattedUrl = parseGoogleSheetsUrl(sheetsUrl.trim());
    
    try {
      triggerToast("Conectando con Google Sheets...");
      const res = await fetch(formattedUrl);
      if (!res.ok) throw new Error("No se pudo obtener la hoja. Asegúrese de que esté compartida de forma pública.");
      const text = await res.text();
      handleParseCSV(text);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error de conexión CORS o de acceso. Recomendación: Descargue su hoja de cálculo como archivo CSV e impórtelo localmente.");
    }
  };

  // Firestore transaction processing for bulk loading
  const handleImportToFirestore = async () => {
    if (parsedPreview.length === 0) {
      triggerToast("No hay registros para procesar. Cargue un CSV o Sheets.");
      return;
    }

    if (!window.confirm(`¿Proceder con la inserción de ${parsedPreview.length} afiliados en las bases de datos de Firestore?`)) {
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of parsedPreview) {
      try {
        let finalDept = "miembros";
        let collName = "miembros_generales";

        if (targetDeptMode === "pastores") {
          finalDept = "pastores";
          collName = "gremio";
        } else if (targetDeptMode === "evangelismo") {
          finalDept = "evangelismo";
          collName = "evangelismo";
        } else if (targetDeptMode === "miembros") {
          finalDept = "miembros";
          collName = "miembros_generales";
        } else {
          // Auto-routing based on department column or user role keyword
          const rDept = (row.rawDept || "").toLowerCase();
          const rRol = (row.rol || "").toLowerCase();

          if (rDept.includes("pastor") || rDept.includes("gremio") || rRol.includes("pastor") || rRol.includes("presbitero") || rRol.includes("obispo")) {
            finalDept = "pastores";
            collName = "gremio";
          } else if (rDept.includes("evangel") || rDept.includes("mision") || rRol.includes("evangelista") || rRol.includes("misionera")) {
            finalDept = "evangelismo";
            collName = "evangelismo";
          } else {
            finalDept = "miembros";
            collName = "miembros_generales";
          }
        }

        // Clean and auto-prepend "Zona " prefix if missing
        let finalZona = row.zona.trim();
        if (finalZona) {
          if (!finalZona.toLowerCase().includes("zona")) {
            if (/^\d+$/.test(finalZona)) {
              finalZona = `Zona ${finalZona}`;
            }
          }
        } else {
          finalZona = "Zona 1";
        }

        // Auto-calculate age if missing but birthdate exists
        let computedEdad = row.edad || "";
        if (!computedEdad && row.fechaNacimiento) {
          const birthDate = new Date(row.fechaNacimiento);
          if (!isNaN(birthDate.getTime())) {
            const today = new Date();
            let calculated = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              calculated--;
            }
            computedEdad = calculated >= 0 ? calculated.toString() : "";
          }
        }

        await addDoc(collection(db, collName), {
          nombres: row.nombres,
          apellidos: row.apellidos,
          cedula: row.cedula,
          rol: row.rol || (finalDept === "pastores" ? "Pastor" : finalDept === "evangelismo" ? "Evangelista" : "Miembro"),
          ministerio: row.rol || (finalDept === "pastores" ? "Pastor" : finalDept === "evangelismo" ? "Evangelista" : "Miembro"),
          zona: finalZona,
          iglesia: row.iglesia || "FIEP Central",
          pastor: row.pastor || "No especificado",
          ciudad: row.ciudad || "",
          pueblo: row.pueblo || "",
          caserio: row.caserio || "",
          estado: `${row.ciudad || ""}, ${row.pueblo || ""}, ${row.caserio || ""}`.trim().replace(/^,|,$/g, "").trim(),
          edad: computedEdad,
          fechaNacimiento: row.fechaNacimiento || "",
          photoUrl: "", // placeholder icon active by default
          departamento: finalDept,
          status: "activo",
          secretToken: "FIEP_COLUMNA_DE_FUEGO_SECRET_TOKEN_2026",
          createdAt: new Date().toISOString()
        });

        successCount++;
      } catch (err) {
        console.error("Error inserting CSV row:", err);
        errorCount++;
      }
    }

    setImporting(false);
    setParsedPreview([]);
    setCsvText("");
    setSheetsUrl("");
    setCsvFile(null);
    triggerToast(`¡Proceso completado! Se han insertado ${successCount} afiliados correctamente. Errores: ${errorCount}`);
  };

  // Drag and drop events for file loading
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".csv")) {
        setCsvFile(file);
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            setCsvText(evt.target.result as string);
            handleParseCSV(evt.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        triggerToast("Por favor arrastre un archivo con extensión .csv válido.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCsvText(evt.target.result as string);
          handleParseCSV(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBulkPdfDownload = async () => {
    if (filteredAffiliates.length === 0) {
      triggerToast("No hay afiliados disponibles con el filtro actual.");
      return;
    }
    triggerToast(`Generando credenciales en lote para ${filteredAffiliates.length} afiliados...`);
    await downloadAllCredentialsPDF(filteredAffiliates);
  };

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
        
        {/* Navigation Tabs bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("links")}
            className={`py-2.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "links"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Enlaces de Registro
          </button>
          <button
            onClick={() => setActiveTab("ibem")}
            className={`py-2.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "ibem"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Alumnos IBEM ({allEnrollments.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("afiliados");
              setAffiliateSearch("");
              setAffiliateFilterDept("all");
              setAffiliateFilterZone("all");
            }}
            className={`py-2.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "afiliados"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Credenciales & Afiliados ({allUsers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("importar");
              setParsedPreview([]);
              setCsvText("");
              setSheetsUrl("");
              setCsvFile(null);
            }}
            className={`py-2.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "importar"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Carga Masiva (CSV / Sheets)
          </button>
        </div>

        {/* TAB 1: LINKS PANEL */}
        {activeTab === "links" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1 border-b pb-4">
              <h3 className="text-base font-black font-display text-slate-900 uppercase">Panel de Enlaces de Afiliación</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Como administrador para la FIEP, usted puede distribuir los siguientes formularios seguros. Los secretarios o líderes podrán registrar miembros sin comprometer las credenciales maestras.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        )}

        {/* TAB 2: BIBLE INSTITUTE */}
        {activeTab === "ibem" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1.5 border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-black font-display text-slate-900 uppercase flex items-center gap-2">
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
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Detalles</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          
                          <button
                            onClick={() => handleDownloadPDF(enr)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>

                          <button
                            onClick={() => handleSendWhatsApp(enr)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl shadow-3xs transition flex items-center gap-1.5 cursor-pointer"
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
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

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
        )}

        {/* TAB 3: MEMBERS DIRECTORY & QR CREDENTIALS */}
        {activeTab === "afiliados" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1.5 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-base font-black font-display text-slate-900 uppercase flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <span>Control de Afiliados & Credenciales QR</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Administre, busque y genere las credenciales oficiales impresas con código QR en lote o de forma individual.
                  </p>
                </div>

                <button
                  onClick={handleBulkPdfDownload}
                  disabled={filteredAffiliates.length === 0}
                  className="py-2.5 px-4.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-extrabold rounded-xl shadow-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir Lote ({filteredAffiliates.length})</span>
                </button>
              </div>

              {/* Filters grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={affiliateSearch}
                    onChange={(e) => setAffiliateSearch(e.target.value)}
                    placeholder="Buscar por nombre, cédula, iglesia..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-250 text-xs font-semibold rounded-xl shadow-3xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Filter className="h-3.5 w-3.5" />
                  </span>
                  <select
                    value={affiliateFilterDept}
                    onChange={(e) => setAffiliateFilterDept(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-250 text-xs font-semibold rounded-xl shadow-3xs focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option value="all">Todos los Departamentos</option>
                    <option value="pastores">Gremio Pastoral (Pastores)</option>
                    <option value="evangelismo">Evangelismo & Misiones</option>
                    <option value="miembros">Membresía General</option>
                  </select>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Database className="h-3.5 w-3.5" />
                  </span>
                  <select
                    value={affiliateFilterZone}
                    onChange={(e) => setAffiliateFilterZone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-250 text-xs font-semibold rounded-xl shadow-3xs focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option value="all">Todas las Zonas FIEP</option>
                    {Array.from({ length: 13 }, (_, i) => `Zona ${i + 1}`).map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filteredAffiliates.length === 0 ? (
              <div className="p-12 bg-slate-100 border border-dashed rounded-[2rem] text-center space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Ningún afiliado coincide con su búsqueda</p>
                <p className="text-[11px] text-slate-400">Modifique sus filtros de búsqueda o registre nuevos miembros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAffiliates.map((user) => {
                  let deptColor = "bg-blue-50 text-blue-700";
                  let deptName = "Membresía";
                  if (user.departamento === "pastores" || user.departamento === "gremio") {
                    deptColor = "bg-emerald-50 text-emerald-700";
                    deptName = "Pastor";
                  } else if (user.departamento === "evangelismo") {
                    deptColor = "bg-purple-50 text-purple-700";
                    deptName = "Evangelismo";
                  }

                  return (
                    <div
                      key={user.id}
                      className="bg-white border rounded-[1.75rem] p-5 shadow-3xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center text-slate-400 font-bold uppercase overflow-hidden flex-shrink-0 text-xs">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`
                          )}
                        </div>
                        <div className="text-left space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${deptColor}`}>
                              {deptName}
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                              {user.zona || "General"}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 truncate">
                            {user.nombres} {user.apellidos}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold font-mono">C.I: {user.cedula}</p>
                          <p className="text-[10px] text-slate-400 font-semibold truncate leading-none">
                            {user.iglesia || "FIEP Central"}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            const profileLink = `${window.location.origin}/ver-miembro/${user.id}`;
                            window.open(profileLink, "_blank");
                          }}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title="Ver Perfil de Verificación QR"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Perfil</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => downloadCredentialPDF(user)}
                            className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="h-3 w-3" />
                            <span>Credencial</span>
                          </button>

                          <button
                            onClick={() => handleDeleteMember(user)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar Afiliado"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BULK LOADER */}
        {activeTab === "importar" && (
          <div className="space-y-6 animate-fadeIn text-slate-700">
            <div className="space-y-1.5 border-b pb-4">
              <h3 className="text-base font-black font-display text-slate-900 uppercase flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-600" />
                <span>Carga Masiva de Afiliados (Importador Firestore)</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Importe bases de datos completas de afiliados en segundos. Cargue un archivo CSV o pegue datos de Google Sheets o Excel para poblar las colecciones de Firestore correspondientes de forma automatizada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              {/* Import configurations */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white border p-5 rounded-[1.75rem] shadow-3xs space-y-4 text-xs font-semibold">
                  <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b pb-2 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span>Configurar Destino</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400">Ruteo de Colección</label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="target_dept"
                          checked={targetDeptMode === "auto"}
                          onChange={() => setTargetDeptMode("auto")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Auto-detectar (Por columna o rol)</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="target_dept"
                          checked={targetDeptMode === "pastores"}
                          onChange={() => setTargetDeptMode("pastores")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Gremio Pastoral (gremio)</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="target_dept"
                          checked={targetDeptMode === "evangelismo"}
                          onChange={() => setTargetDeptMode("evangelismo")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Evangelismo y Misiones (evangelismo)</span>
                      </label>
                      <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                        <input
                          type="radio"
                          name="target_dept"
                          checked={targetDeptMode === "miembros"}
                          onChange={() => setTargetDeptMode("miembros")}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Membresía General (miembros)</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-[11px] text-slate-600 leading-relaxed font-medium space-y-2.5">
                    <div>
                      <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Columnas Requeridas por Sección:</p>
                      <p className="text-[10px] text-slate-500 mb-2 font-semibold">
                        Deben coincidir con los campos requeridos en el Formulario de Registro Oficial:
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9.5px] bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                        <div>• <strong className="text-slate-900">nombres</strong></div>
                        <div>• <strong className="text-slate-900">apellidos</strong></div>
                        <div>• <strong className="text-slate-900">cedula</strong></div>
                        <div>• <strong className="text-slate-900">fechaNacimiento</strong></div>
                        <div>• <strong className="text-slate-900">rol</strong> (cargo)</div>
                        <div>• <strong className="text-slate-900">zona</strong> (Zona 1 a 13)</div>
                        <div>• <strong className="text-slate-900">estado</strong> (o ciudad)</div>
                        <div>• <strong className="text-slate-900">pueblo</strong></div>
                        <div>• <strong className="text-slate-900">caserio</strong></div>
                        <div>• <strong className="text-slate-900">iglesia</strong> (templo)</div>
                        <div>• <strong className="text-slate-900">pastor</strong> (de la iglesia)</div>
                        <div>• <strong className="text-slate-900">edad</strong> (auto-calculada)</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-bold text-slate-700 text-[10px] uppercase">Ruteo Dinámico:</p>
                      <p className="text-[10px] text-slate-500">
                        Use la columna <code className="bg-slate-200 px-1 rounded text-slate-800 font-bold font-mono">departamento</code> con los valores <code className="text-blue-700 font-bold">pastores</code>, <code className="text-purple-700 font-bold">evangelismo</code> o <code className="text-indigo-700 font-bold">miembros</code> si prefiere auto-detectar la sección.
                      </p>
                    </div>
                    <p className="text-[9.5px] text-slate-450 font-semibold italic">
                      * Nota: El importador mapea sinónimos de forma inteligente (ej: la columna "Estado" se mapeará a la base de datos de manera correcta).
                    </p>
                  </div>
                </div>

                {/* Google Sheets quick connect */}
                <div className="bg-white border p-5 rounded-[1.75rem] shadow-3xs space-y-3.5 text-xs font-semibold">
                  <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b pb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Enlace Google Sheets</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Conecte directamente una hoja compartida. Asegúrese de que esté en modo 'Cualquiera con el enlace puede ver'.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Pegar dirección URL de Google Sheets..."
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border text-xs font-semibold rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleFetchGoogleSheets}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl transition cursor-pointer text-center text-[10px] uppercase tracking-wider block border border-emerald-150"
                    >
                      Conectar y Extraer Hoja
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload interface */}
              <div className="md:col-span-2 space-y-4">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-all ${
                    dragActive
                      ? "border-blue-500 bg-blue-50/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Upload className="h-6 w-6 animate-bounce" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        Arrastre su archivo CSV aquí
                      </p>
                      <p className="text-[11px] text-slate-450 font-semibold leading-normal">
                        O si prefiere, seleccione el archivo desde su explorador de archivos local.
                      </p>
                    </div>

                    <div>
                      <label className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition shadow-3xs cursor-pointer inline-block">
                        <span>Seleccionar CSV</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {csvFile && (
                      <div className="py-1.5 px-3 bg-blue-50 text-blue-800 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 w-fit mx-auto border border-blue-100">
                        <FileText className="h-4 w-4" />
                        <span>{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paste RAW Area */}
                <div className="bg-white border rounded-[2rem] p-5 shadow-3xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <Clipboard className="h-4 w-4 text-purple-600" />
                      <span>Copiar y Pegar Datos (Excel / Sheets / Texto)</span>
                    </h4>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase font-mono">
                      Muy Seguro
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    Copie las celdas directamente desde Microsoft Excel o Google Sheets y péguelas aquí abajo. El sistema detectará las columnas tabuladas y las ordenará automáticamente para evitar restricciones de CORS.
                  </p>

                  <textarea
                    rows={4}
                    value={csvText}
                    onChange={(e) => {
                      setCsvText(e.target.value);
                      handleParseCSV(e.target.value);
                    }}
                    placeholder="Nombres;Apellidos;Cédula;Fecha de Nacimiento;Rol;Zona;Estado;Pueblo;Caserío;Iglesia;Pastor;Departamento&#10;Richard;Calderon;12345678;1985-11-20;Pastor;Zona 5;Carabobo;Valencia;El Centro;Columna de Fuego;Juan Gomez;pastores"
                    className="w-full p-4 bg-slate-50 border text-xs font-mono font-semibold rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-y"
                  />
                </div>

                {/* Preview of Parsed Users */}
                {parsedPreview.length > 0 && (
                  <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm space-y-4 animate-fadeIn">
                    <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
                      <div>
                        <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                          <span>Previsualización de los Datos a Importar</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Se detectaron {parsedPreview.length} filas válidas. Verifique el orden de las columnas antes de guardar.
                        </p>
                      </div>

                      <button
                        onClick={handleImportToFirestore}
                        disabled={importing}
                        className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {importing ? (
                          <>
                            <Database className="h-4 w-4 animate-spin" />
                            <span>Procesando...</span>
                          </>
                        ) : (
                          <>
                            <Database className="h-4 w-4" />
                            <span>Importar a Firestore</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-[10.5px] font-semibold text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-600 uppercase font-mono tracking-wider text-[9px] border-b sticky top-0">
                          <tr>
                            <th className="py-2 px-4">Fila</th>
                            <th className="py-2 px-3">Afiliado</th>
                            <th className="py-2 px-3">Cédula</th>
                            <th className="py-2 px-3">Rol / Cargo</th>
                            <th className="py-2 px-3">Zona</th>
                            <th className="py-2 px-3">Congregación</th>
                            <th className="py-2 px-3">Ruteo Destino</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {parsedPreview.slice(0, 10).map((row, idx) => {
                            // Calculate preview routing target
                            let computedRouting = "Membresía";
                            if (targetDeptMode === "pastores") {
                              computedRouting = "Gremio Pastoral";
                            } else if (targetDeptMode === "evangelismo") {
                              computedRouting = "Evangelismo";
                            } else if (targetDeptMode === "miembros") {
                              computedRouting = "Membresía";
                            } else {
                              const rDept = (row.rawDept || "").toLowerCase();
                              const rRol = (row.rol || "").toLowerCase();
                              if (rDept.includes("pastor") || rDept.includes("gremio") || rRol.includes("pastor") || rRol.includes("presbitero") || rRol.includes("obispo")) {
                                computedRouting = "Gremio Pastoral";
                              } else if (rDept.includes("evangel") || rDept.includes("mision") || rRol.includes("evangelista") || rRol.includes("misionera")) {
                                computedRouting = "Evangelismo";
                              }
                            }

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2 px-4 font-mono text-slate-400">{idx + 1}</td>
                                <td className="py-2 px-3 text-slate-900 font-bold">{row.nombres} {row.apellidos}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{row.cedula}</td>
                                <td className="py-2 px-3 text-slate-600 font-sans">{row.rol || "Miembro Coadyuvante"}</td>
                                <td className="py-2 px-3 text-slate-600">{row.zona || "General"}</td>
                                <td className="py-2 px-3 text-slate-500 truncate max-w-[120px]">{row.iglesia || "FIEP Central"}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold ${
                                    computedRouting === "Gremio Pastoral"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : computedRouting === "Evangelismo"
                                      ? "bg-purple-50 text-purple-700"
                                      : "bg-blue-50 text-blue-700"
                                  }`}>
                                    {computedRouting}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {parsedPreview.length > 10 && (
                      <div className="p-3 bg-slate-50 text-center border-t text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        Ver {parsedPreview.length - 10} registros adicionales que serán procesados
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
