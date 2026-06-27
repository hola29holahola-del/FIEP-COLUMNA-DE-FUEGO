import React, { useState, useRef, useEffect } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import QRCode from "qrcode";
import { 
  User, 
  ShieldCheck, 
  Download, 
  FileImage, 
  Clipboard, 
  Printer, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle, 
  Home, 
  MapPin, 
  Church, 
  HeartHandshake, 
  UserCheck, 
  Flame, 
  Users, 
  Calendar 
} from "lucide-react";
import ImageCropperModal from "./ImageCropperModal";
import { uploadToImgBB } from "../utils/imgbb";

interface RegistroSecretoProps {
  isAdmin?: boolean;
  isOnlyMiembro?: boolean;
  preselectedSection?: "pastor" | "evangelismo" | "miembro";
  onRegisterSuccess?: (category: "pastor" | "evangelismo" | "miembro") => void;
}

export default function RegistroSecreto({ 
  isAdmin = false, 
  isOnlyMiembro = false,
  preselectedSection,
  onRegisterSuccess
}: RegistroSecretoProps) {
  // Classification Section active Tab
  const [seccionRegistro, setSeccionRegistro] = useState<"pastor" | "evangelismo" | "miembro">(
    preselectedSection || (isOnlyMiembro ? "miembro" : "pastor")
  );

  // Force section selection if isOnlyMiembro or preselectedSection changes
  useEffect(() => {
    if (preselectedSection) {
      setSeccionRegistro(preselectedSection);
      if (preselectedSection === "pastor") {
        setRol("Pastor");
      } else if (preselectedSection === "miembro") {
        setRol("Miembro");
      }
    } else if (isOnlyMiembro) {
      setSeccionRegistro("miembro");
      setRol("Miembro");
    }
  }, [isOnlyMiembro, preselectedSection]);

  // Maestro Form Elements states
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edad, setEdad] = useState<number | string>("");
  const [rol, setRol] = useState("Pastor");
  const [zona, setZona] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pueblo, setPueblo] = useState("");
  const [caserio, setCaserio] = useState("");
  const [iglesia, setIglesia] = useState("");
  const [pastor, setPastor] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // File loading configuration
  const [subirSinRecortar, setSubirSinRecortar] = useState(true);

  // Cropper states
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState("");
  const [croppedImageBase64, setCroppedImageBase64] = useState<string | null>(null);

  // Operation States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [qrBase64, setQrBase64] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock or preset role depending on the selected category tab
  useEffect(() => {
    if (seccionRegistro === "pastor") {
      setRol("Pastor");
    } else if (seccionRegistro === "miembro") {
      setRol("Miembro");
    } else {
      setRol(""); // manual fill for department evangelismo
    }
  }, [seccionRegistro]);

  // Real-time dynamic age calculation logic based on Date of Birth
  useEffect(() => {
    if (fechaNacimiento) {
      const birthDate = new Date(fechaNacimiento);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let calculated = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculated--;
        }
        setEdad(calculated >= 0 ? calculated : 0);
      } else {
        setEdad("");
      }
    } else {
      setEdad("");
    }
  }, [fechaNacimiento]);

  const handleSeccionSelect = (seccion: "pastor" | "evangelismo" | "miembro") => {
    setSeccionRegistro(seccion);
    if (seccion === "pastor") {
      setRol("Pastor");
    } else if (seccion === "miembro") {
      setRol("Miembro");
    } else {
      setRol(""); // manual entry
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        if (subirSinRecortar) {
          // Preserve original file size and resolution (avoiding cropping tools)
          setCroppedImageBase64(base64Str);
          setImagePreview(base64Str);
        } else {
          // Open crop modal
          setPendingImageSrc(base64Str);
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (base64Result: string) => {
    setCroppedImageBase64(base64Result);
    setImagePreview(base64Result);
  };

  const resetForm = () => {
    setNombres("");
    setApellidos("");
    setCedula("");
    setFechaNacimiento("");
    setEdad("");
    setRol(seccionRegistro === "pastor" ? "Pastor" : seccionRegistro === "miembro" ? "Miembro" : "");
    setZona("");
    setCiudad("");
    setPueblo("");
    setCaserio("");
    setIglesia("");
    setPastor("");
    setImagePreview(null);
    setCroppedImageBase64(null);
    setSuccess(false);
    setNewUserId(null);
    setGeneratedUrl("");
    setQrBase64("");
    setErrorMsg(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombres || !apellidos || !cedula || !rol || !zona || !ciudad || !pueblo || !caserio || !iglesia || !pastor) {
      setErrorMsg("Por favor complete todos los campos obligatorios del Formulario Maestro (*).");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      // Auto-categorize Departamento based on selected category tab
      let calculatedDept = "general";
      let collName = "usuarios";
      if (seccionRegistro === "pastor") {
        calculatedDept = "pastores";
        collName = "gremio";
      } else if (seccionRegistro === "evangelismo") {
        calculatedDept = "evangelismo";
        collName = "evangelismo";
      } else {
        calculatedDept = "miembros";
        collName = "miembros_generales";
      }

      let photoUrl = "";
      if (croppedImageBase64) {
        photoUrl = await uploadToImgBB(croppedImageBase64);
      }

      // 1. Create document in Firestore (contextual collection)
      const userRef = await addDoc(collection(db, collName), {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cedula: cedula.trim(),
        fechaNacimiento: fechaNacimiento,
        type: seccionRegistro,
        edad: edad,
        rol: rol.trim(),
        zona: zona.trim(),
        ciudad: ciudad.trim(),
        pueblo: pueblo.trim(),
        caserio: caserio.trim(),
        estado: `${ciudad.trim()}, ${pueblo.trim()}, ${caserio.trim()}`, // locations concat
        iglesia: iglesia.trim(),
        pastor: pastor.trim(),
        photoUrl: photoUrl, // Set the uploaded ImgBB hosted URL here
        ministerio: rol.trim(), // Keep congruent for legacy queries
        departamento: calculatedDept,
        status: "activo",
        secretToken: "FIEP_COLUMNA_DE_FUEGO_SECRET_TOKEN_2026",
        createdAt: new Date().toISOString()
      });

      const docId = userRef.id;

      // 3. Compute dynamic QR profile URL link pointing to verification page
      const profileLink = `${window.location.origin}/ver-miembro/${docId}`;
      const qrDataUrl = await QRCode.toDataURL(profileLink, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });

      setNewUserId(docId);
      setGeneratedUrl(profileLink);
      setQrBase64(qrDataUrl);
      setSuccess(true);
    } catch (error) {
      console.error("Error during member registration:", error);
      setErrorMsg("Ocurrió un error al registrar el afiliado en los servidores FIEP.");
      try {
        handleFirestoreError(error, OperationType.CREATE, "usuarios");
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrBase64;
    link.download = `QR_FIEP_${nombres.replace(/\s+/g, "_")}_${apellidos.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir QR de Credencial - FIEP Columna de Fuego</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; color: #0f172a; }
              .card { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 30px; display: inline-block; max-width: 400px; }
              h1 { margin-bottom: 5px; font-size: 22px; }
              p { font-size: 14px; color: #64748b; margin-top: 0; }
              img { margin: 20px auto; width: 220px; height: 220px; display: block; }
              .member-info { font-weight: bold; font-size: 18px; margin-top: 15px; }
              .ministerio { color: #2563eb; font-size: 14px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>CREDENTIAL QR CODE</h1>
              <p>FIEP COLUMNA DE FUEGO</p>
              <img src="${qrBase64}" alt="QR" />
              <div class="member-info">${nombres} ${apellidos}</div>
              <div class="ministerio">${rol}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 20px; font-family: monospace;">FIEP ID: ${newUserId?.substring(0,8).toUpperCase()}</div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-6 px-4">
      
      {/* Informational Alert Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-150 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-3xs">
        <div className="p-3 bg-blue-600 rounded-xl text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900 font-display text-base uppercase">
            SISTEMA DE REGISTRO
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
            Complete minuciosamente el formulario a continuación. El sistema guardará la información ministerial, calculará la edad del usuario y generará un código QR único para verificar la información.
          </p>
        </div>
      </div>

      {!success ? (
        <div className="space-y-6">
          
          {/* Categorized Registration Tab selectors */}
          {!isOnlyMiembro && (
            <div className="bg-white/65 p-1.5 rounded-2xl border flex flex-col sm:flex-row gap-1">
              <button
                type="button"
                onClick={() => handleSeccionSelect("pastor")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition text-xs uppercase tracking-wider ${
                  seccionRegistro === "pastor"
                    ? "bg-blue-600 text-white shadow-md font-black"
                    : "hover:bg-white text-slate-600 bg-slate-50/20"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                1. Registrar Pastor
              </button>
              <button
                type="button"
                onClick={() => handleSeccionSelect("evangelismo")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition text-xs uppercase tracking-wider ${
                  seccionRegistro === "evangelismo"
                    ? "bg-purple-600 text-white shadow-md font-black"
                    : "hover:bg-white text-slate-600 bg-slate-50/20"
                }`}
              >
                <Flame className="h-4 w-4" />
                2. Depto. Evangelismo
              </button>
              <button
                type="button"
                onClick={() => handleSeccionSelect("miembro")}
                className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition text-xs uppercase tracking-wider ${
                  seccionRegistro === "miembro"
                    ? "bg-indigo-600 text-white shadow-md font-black"
                    : "hover:bg-white text-slate-600 bg-slate-50/20"
                }`}
              >
                <Users className="h-4 w-4" />
                3. Registrar Miembro
              </button>
            </div>
          )}

          <form onSubmit={handleRegister} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
            
            {/* Form Header */}
            <div className={`text-white px-8 py-6 flex items-center justify-between border-b ${
              seccionRegistro === "pastor" ? "bg-blue-900 border-blue-950" :
              seccionRegistro === "evangelismo" ? "bg-[#581c87] border-[#3b0764]" : "bg-indigo-900 border-indigo-950"
            }`}>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight uppercase">
                  {seccionRegistro === "pastor" && "Ficha Oficial: Gremio Pastoral"}
                  {seccionRegistro === "evangelismo" && "Ficha Oficial: Departamento de Evangelismo"}
                  {seccionRegistro === "miembro" && "Ficha Oficial: Membresía General"}
                </h2>
                <p className="text-xs text-slate-200 mt-0.5">Todos los datos introducidos se integrarán en formato digital consolidado</p>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono tracking-wider bg-white/10 text-amber-300 px-3 py-1 rounded-full border border-white/20 uppercase font-black">
                <Sparkles className="h-3.5 w-3.5" /> 
                {seccionRegistro === "pastor" && "pastores"}
                {seccionRegistro === "evangelismo" && "evangelistas"}
                {seccionRegistro === "miembro" && "membresía"}
              </div>
            </div>

            <div className="p-8 space-y-6">
              {errorMsg && (
                <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl text-rose-800 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-rose-600 flex-shrink-0" />
                  <div className="text-xs font-bold leading-normal">{errorMsg}</div>
                </div>
              )}

              {/* Master Form Section: Nombres & Apellidos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    Nombres del Postulante <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    Apellidos <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Cédula, Fecha Nacimiento, Edad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    Cédula o Identificación <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    Fecha de Nacimiento <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={fechaNacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    Edad <span className="text-slate-400 font-normal lowercase">(calculada)</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={edad !== "" ? `${edad} años` : "Por favor elija fecha"}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-blue-700 cursor-not-allowed text-center font-mono"
                  />
                </div>
              </div>

              {/* Rol/Ministerio Section */}
              <div>
                <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                  Ministerio o Rol Eclesiástico <span className="text-rose-600">*</span>
                </label>
                {seccionRegistro === "pastor" ? (
                  <input
                    type="text"
                    disabled
                    value="Pastor"
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-500 cursor-not-allowed"
                  />
                ) : seccionRegistro === "miembro" ? (
                  <input
                    type="text"
                    disabled
                    value="Miembro"
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-500 cursor-not-allowed"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                  />
                )}
              </div>

              {/* Location Matrix Block (Zona, Ciudad, Pueblo, Caserío) */}
              <div className="bg-slate-50/50 p-5 rounded-2.5 border border-slate-150 space-y-4">
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono border-b pb-1">Dirección y Localidad</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-700 text-[9px] font-black uppercase tracking-wider mb-1.5 font-display">
                      Zona / Distrito <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <select
                        required
                        value={zona}
                        onChange={(e) => setZona(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer"
                      >
                        <option value="">-- Seleccione Zona --</option>
                        {Array.from({ length: 13 }, (_, i) => `Zona ${i + 1}`).map((z) => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-500 w-0 h-0" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[9px] font-black uppercase tracking-wider mb-1.5 font-display">
                      Estado <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[9px] font-black uppercase tracking-wider mb-1.5 font-display">
                      Pueblo <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={pueblo}
                      onChange={(e) => setPueblo(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[9px] font-black uppercase tracking-wider mb-1.5 font-display">
                      Caserío <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={caserio}
                      onChange={(e) => setCaserio(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Congregation & Pastor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    ¿Dónde se congrega? (Iglesia Local) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Church className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={iglesia}
                      onChange={(e) => setIglesia(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider mb-2 font-display">
                    Pastor de su congregación <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <HeartHandshake className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={pastor}
                      onChange={(e) => setPastor(e.target.value)}
                      placeholder=""
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload with original size & crop option selection */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-700 text-[10px] font-black uppercase tracking-wider font-display">
                    Foto de Perfil Oficial <span className="text-slate-400 font-normal lowercase">(Fondo blanco recomendado)</span>
                  </label>
                  
                  {/* Resolution selection checkbox */}
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-900 select-none">
                    <input
                      type="checkbox"
                      checked={subirSinRecortar}
                      onChange={(e) => setSubirSinRecortar(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>Subir foto original (Sin recortes / Resolución nativa)</span>
                  </label>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-slate-50/40 transition-all flex flex-col items-center justify-center min-h-[140px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-28 w-28 object-contain rounded-2xl border-4 border-white shadow-xl bg-white"
                      />
                      <span className="text-xs text-blue-600 font-bold">
                        {subirSinRecortar ? "¡Foto cargada en tamaño original!" : "¡Recorte completado!"} Haz clic para cambiar.
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500">
                      <FileImage className="h-10 w-10 stroke-1 text-slate-400 mb-2" />
                      <p className="text-sm font-bold text-slate-700 mb-1">Arrastra la fotografía o haz clic aquí</p>
                      <p className="text-xs text-slate-400">
                        {subirSinRecortar ? "Se mantendrá el tamaño de origen sin alterar la resolución." : "Se iniciará la herramienta de recorte Cropper.js"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form actions and resets */}
            <div className="bg-slate-50 border-t border-slate-100 px-8 py-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="py-2.5 px-6 font-semibold text-xs uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-all bg-transparent"
              >
                Borrar Formulario
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`py-3 px-8 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  seccionRegistro === "pastor" ? "bg-blue-600 hover:bg-blue-700" :
                  seccionRegistro === "evangelismo" ? "bg-[#9333ea] hover:bg-[#7c3aed]" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando Registro...
                  </>
                ) : (
                  `Guardar y Registrar ${seccionRegistro === "pastor" ? "Pastor" : seccionRegistro === "evangelismo" ? "Evangelista" : "Miembro"}`
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* SUCCESS INTERACTIVE PORTAL WITH DYNAMIC REAL-TIME QR & ACTIONS */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn text-center p-8 max-w-xl mx-auto">
          <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-black font-display text-slate-950 mb-1 leading-tight">¡RECOPILACION INTEGRADA EXITOSAMENTE!</h2>
          <p className="text-xs text-slate-500 mb-6 font-semibold lowercase">La credencial ha sido oficializada en la base central FIEP en tiempo real.</p>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-150 inline-block mb-6 shadow-inner">
            {qrBase64 && (
              <img
                src={qrBase64}
                alt="Código QR de Credencial"
                className="w-48 h-48 mx-auto object-contain rounded-xl border border-white shadow-md mb-2 bg-white"
              />
            )}
            <p className="text-slate-900 text-sm font-black font-display mt-3 leading-none">
              {nombres} {apellidos}
            </p>
            <p className="text-blue-600 font-mono text-xs font-bold uppercase tracking-wider mt-1.5">
              {rol}
            </p>
          </div>

          {/* Verification link */}
          <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Enlace Oficial de Validación:</div>
            <div className="flex bg-slate-100 rounded-xl border border-slate-200 p-2 items-center justify-between gap-2 overflow-hidden">
              <span className="text-xs text-slate-600 font-mono truncate select-all">{generatedUrl}</span>
              <button
                onClick={copyToClipboard}
                className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 transition flex-shrink-0 cursor-pointer font-bold text-xs"
                title="Copiar Enlace"
              >
                {isCopied ? "Copiado" : <Clipboard className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={downloadQR}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
            >
              <Download className="h-4 w-4" /> Guardar Código QR (.png)
            </button>
            <button
              onClick={printQR}
              className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
            >
              <Printer className="h-4 w-4" /> Imprimir QR
            </button>
            {onRegisterSuccess && (
              <button
                onClick={() => onRegisterSuccess(seccionRegistro)}
                className="py-2.5 px-6 bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle className="h-4 w-4" /> Finalizar y Volver
              </button>
            )}
            <button
              onClick={resetForm}
              className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Nuevo Registro
            </button>
          </div>
        </div>
      )}

      {/* Embedded Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={pendingImageSrc}
        aspectRatio={1}
        onCropComplete={handleCropComplete}
        title="Ajustar y Recortar Foto"
      />
    </div>
  );
}
