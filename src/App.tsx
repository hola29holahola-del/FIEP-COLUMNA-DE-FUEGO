import React, { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, handleFirestoreError, OperationType } from "./firebase";
import { AppConfig, IglesiaUsuario, PresinscritoInstituto, Publicacion, BoardMember, PresbiteroZona } from "./types";
import { DEFAULT_CONFIG } from "./constants";
import { uploadToImgBB } from "./utils/imgbb";

// Imports of newly created highly modularized polished sub-components
import Logo from "./components/Logo";
import LandingPage from "./components/LandingPage";
import AdminDashboard from "./components/AdminDashboard";
import Directories from "./components/Directories";
import PerfilDigital from "./components/PerfilDigital";
import RegistroSecreto from "./components/RegistroSecreto";
import AdminLogin from "./components/AdminLogin";
import PublicationDetail from "./components/PublicationDetail";
import SectionTitle from "./components/SectionTitle";

import {
  Menu,
  X,
  Compass,
  Briefcase,
  Users2,
  Users,
  Award,
  ExternalLink,
  Flame,
  BookOpen,
  Sliders,
  Sparkles,
  Home,
  MessageSquare,
  DollarSign,
  UserCheck,
  ArrowLeft,
  Layers,
  Calendar,
  Play,
  Video,
  Image as ImageIcon,
  Smartphone,
  PlusSquare
} from "lucide-react";

export default function App() {
  
  // Navigation Routing States
  const [currentTab, setCurrentTab] = useState<"inicio" | "pastores" | "evangelismo" | "miembros" | "instituto" | "publicaciones" | "admin">("inicio");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activePublicationId, setActivePublicationId] = useState<string | null>(null);
  const [isSecretRoute, setIsSecretRoute] = useState(false);
  const [isSecretOnlyMiembros, setIsSecretOnlyMiembros] = useState(false);
  const [isVerMiembroPath, setIsVerMiembroPath] = useState(false);
  const [registroPresetSection, setRegistroPresetSection] = useState<"pastor" | "evangelismo" | "miembro" | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Firestore Data state
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [allUsers, setAllUsers] = useState<IglesiaUsuario[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<PresinscritoInstituto[]>([]);
  const [publications, setPublications] = useState<Publicacion[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [presbiteros, setPresbiteros] = useState<PresbiteroZona[]>([]);
  const [evangelismoDirectivos, setEvangelismoDirectivos] = useState<BoardMember[]>([]);
  const [institutoDirectivos, setInstitutoDirectivos] = useState<BoardMember[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // PWA Install states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAlreadyStandalone, setIsAlreadyStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  (window as any).__triggerToast = triggerToast;

  // PWA Install Event Handler & Device Detection
  useEffect(() => {
    // Detect if already running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsAlreadyStandalone(isStandalone);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner if not already running standalone
      if (!isStandalone) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);
    
    // On iOS, show custom install banner if not standalone
    if (ios && !isStandalone) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    
    if (!deferredPrompt) {
      triggerToast("Por favor, usa el menú de tu navegador y selecciona 'Instalar' o 'Agregar a pantalla de inicio'.");
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Usuario decidió la instalación: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (err) {
      console.error("Error al gatillar prompt de PWA:", err);
      triggerToast("Usa el menú de tu navegador para agregar a pantalla de inicio.");
    }
  };

  // 1. Dual Route URL Param parser (supports external verification scans)
  useEffect(() => {
    const parseQuery = () => {
      const path = window.location.pathname;
      const verMiembroMatch = path.match(/^\/ver-miembro\/([a-zA-Z0-9_\-]+)/) || path.match(/^\/ficha\/([a-zA-Z0-9_\-]+)/);
      if (verMiembroMatch) {
        setProfileId(verMiembroMatch[1]);
        setIsVerMiembroPath(true);
        setIsSecretRoute(false);
        setActivePublicationId(null);
        return;
      }

      setIsVerMiembroPath(false);
      const pubMatch = path.match(/^\/publicacion\/([a-zA-Z0-9_\-]+)/);
      if (pubMatch) {
        setProfileId(null);
        setIsSecretRoute(false);
        setActivePublicationId(pubMatch[1]);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const idParam = params.get("id");
      const moduloParam = params.get("modulo");
      const pubIdParam = params.get("pubId");

      if (pubIdParam) {
        setActivePublicationId(pubIdParam);
        return;
      } else {
        setActivePublicationId(null);
      }

      if (idParam) {
        setProfileId(idParam);
      } else {
        setProfileId(null);
      }

      const isM = moduloParam === "registro_miembros";
      setIsSecretOnlyMiembros(isM);

      if (moduloParam === "registro_secreto" || isM) {
        setIsSecretRoute(true);
      } else {
        setIsSecretRoute(false);
        if (moduloParam && ["inicio", "pastores", "evangelismo", "miembros", "instituto", "publicaciones", "admin"].includes(moduloParam)) {
          setCurrentTab(moduloParam as any);
        }
      }
    };

    parseQuery();
    window.addEventListener("popstate", parseQuery);
    return () => window.removeEventListener("popstate", parseQuery);
  }, []);

  // Admin routing auto-redirect was removed to allow free navigation across the portal while logged in as administrator

  // 2. Real-time Firebase Auth tracking with whitelist security integration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingAdmin(true);
      try {
        if (user) {
          const userEmail = user.email?.toLowerCase().trim() || "";
          const defaultWhitelist = ["richard29cal@gmail.com"];
          let allowed = [...defaultWhitelist];
          
          try {
            const configDoc = await getDoc(doc(db, "configuracion", "global"));
            if (configDoc.exists()) {
              const data = configDoc.data();
              if (data && data.allowedAdminEmails && Array.isArray(data.allowedAdminEmails)) {
                allowed = Array.from(new Set([
                  ...allowed,
                  ...data.allowedAdminEmails.map((e: string) => e.toLowerCase().trim())
                ]));
              }
            }
          } catch (err) {
            console.warn("Could not check whitelist snapshot, fallback active:", err);
          }

          if (allowed.includes(userEmail)) {
            setCurrentUser(user);
            setAdminLoggedIn(true);
          } else {
            console.warn("Unauthorized user logged out:", userEmail);
            await signOut(auth);
            setCurrentUser(null);
            setAdminLoggedIn(false);
            triggerToast("Acceso denegado: Su correo electrónico no se encuentra registrado en la lista de administradores autorizados.");
          }
        } else {
          setCurrentUser(null);
          setAdminLoggedIn(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Real-time Config Sync from Firestore with robust DEFAULT_CONFIG fallbacks
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "configuracion", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppConfig;
        setConfig(data);
        if (data.imgbbApiKey) {
          (window as any).__imgbb_key = data.imgbbApiKey;
        }
        setConfigLoading(false);
      } else {
        console.log("No config document found on Firebase. Writing DEFAULT_CONFIG defaults...");
        setDoc(doc(db, "configuracion", "global"), DEFAULT_CONFIG)
          .then(() => {
            setConfig(DEFAULT_CONFIG);
            setConfigLoading(false);
          })
          .catch((err) => {
            console.error("Critical error building original configuracion doc:", err);
            setConfig(DEFAULT_CONFIG);
            setConfigLoading(false);
          });
      }
    }, (error) => {
      console.error(error);
      setConfig(DEFAULT_CONFIG);
      setConfigLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 4. Real-time Announcements/Publications sync
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "publicaciones"), (snapshot) => {
      const pubList: Publicacion[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        pubList.push({
          id: docSnap.id,
          texto: d.texto || "",
          imagenBase64: d.imagenBase64 || "",
          tipo: d.tipo || "imagen",
          videoUrl: d.videoUrl || "",
          fecha: d.fecha || null
        } as Publicacion);
      });

      // Sort descending by date
      pubList.sort((a, b) => {
        const timeA = a.fecha?.seconds ? a.fecha.seconds * 1000 : (a.fecha ? new Date(a.fecha).getTime() : 0);
        const timeB = b.fecha?.seconds ? b.fecha.seconds * 1000 : (b.fecha ? new Date(b.fecha).getTime() : 0);
        return timeB - timeA;
      });

      setPublications(pubList);
    }, (error) => {
      console.error("Error fetching publications:", error);
    });

    return () => unsubscribe();
  }, []);

  // 5. Real-time Registered Members sync (multi-collection aggregate)
  useEffect(() => {
    const mapDocData = (d: any, defaultDept: string) => {
      const raw = d.data();
      return {
        id: d.id,
        nombres: raw.nombres || "",
        apellidos: raw.apellidos || "",
        cedula: raw.cedula || "",
        edad: raw.edad || "",
        iglesia: raw.iglesia || "",
        zona: raw.zona || "",
        ministerio: raw.ministerio || raw.rol || "",
        photoUrl: raw.photoUrl || "",
        departamento: raw.departamento || defaultDept,
        status: raw.status || "activo",
        createdAt: raw.createdAt,
      } as IglesiaUsuario;
    };

    let usersLegacy: IglesiaUsuario[] = [];
    let usersGremio: IglesiaUsuario[] = [];
    let usersEvangelismo: IglesiaUsuario[] = [];
    let usersMiembros: IglesiaUsuario[] = [];

    const updateAllUsers = () => {
      const combined = [...usersLegacy, ...usersGremio, ...usersEvangelismo, ...usersMiembros];
      const unique: IglesiaUsuario[] = [];
      const ids = new Set<string>();
      for (const u of combined) {
        if (!ids.has(u.id)) {
          ids.add(u.id);
          unique.push(u);
        }
      }
      unique.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      setAllUsers(unique);
    };

    const unsubLegacy = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      usersLegacy = [];
      snapshot.forEach((d) => {
        usersLegacy.push(mapDocData(d, "general"));
      });
      updateAllUsers();
    }, (err) => console.error("Legacy sync error:", err));

    const unsubGremio = onSnapshot(collection(db, "gremio"), (snapshot) => {
      usersGremio = [];
      snapshot.forEach((d) => {
        usersGremio.push(mapDocData(d, "pastores"));
      });
      updateAllUsers();
    }, (err) => console.error("Gremio sync error:", err));

    const unsubEvangelismo = onSnapshot(collection(db, "evangelismo"), (snapshot) => {
      usersEvangelismo = [];
      snapshot.forEach((d) => {
        usersEvangelismo.push(mapDocData(d, "evangelismo"));
      });
      updateAllUsers();
    }, (err) => console.error("Evangelismo sync error:", err));

    const unsubMiembros = onSnapshot(collection(db, "miembros_generales"), (snapshot) => {
      usersMiembros = [];
      snapshot.forEach((d) => {
        usersMiembros.push(mapDocData(d, "miembros"));
      });
      updateAllUsers();
    }, (err) => console.error("Miembros sync error:", err));

    return () => {
      unsubLegacy();
      unsubGremio();
      unsubEvangelismo();
      unsubMiembros();
    };
  }, []);

  // 6. Real-time Pre-registrations for Bible Institute list
  useEffect(() => {
    if (!adminLoggedIn) return;
    const unsub = onSnapshot(collection(db, "inscritos_instituto"), (snapshot) => {
      const list: PresinscritoInstituto[] = [];
      snapshot.forEach((d) => {
        const raw = d.data();
        list.push({
          id: d.id,
          nombres: raw.nombres || "",
          apellidos: raw.apellidos || "",
          cedula: raw.cedula || "",
          edad: raw.edad || "",
          whatsapp: raw.whatsapp || "",
          motivo: raw.motivo || "",
          createdAt: raw.createdAt,
          fechaNacimiento: raw.fechaNacimiento || "",
          iglesia: raw.iglesia || "",
          iglesiaUbicacion: raw.iglesiaUbicacion || "",
          pastor: raw.pastor || "",
          pastorTelefono: raw.pastorTelefono || "",
          fechaInicio: raw.fechaInicio || "",
          celularHermano: raw.celularHermano || "",
          fechaInscripcion: raw.fechaInscripcion || "",
        } as PresinscritoInstituto);
      });
      setAllEnrollments(list);
    }, (err) => {
      console.error(err);
    });
    return () => unsub();
  }, [adminLoggedIn]);

  // 7. Real-time Junta Directiva sync with auto-healing migration
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "junta_directiva"), (snapshot) => {
      const list: BoardMember[] = [];
      snapshot.forEach((d) => {
        const raw = d.data();
        list.push({
          id: d.id,
          cargo: raw.cargo || "",
          nombre: raw.nombre || "",
          apellido: raw.apellido || "",
          photoUrl: raw.photoUrl || "",
          createdAt: raw.createdAt || "",
        } as BoardMember);
      });

      if (list.length === 0 && config?.juntaDirectiva && config.juntaDirectiva.length > 0) {
        console.log("Migrating existing board members to dedicated group collection...");
        // Non-blocking background migration of existing records
        Promise.all(
          config.juntaDirectiva.map((mbr, idx) => {
            return addDoc(collection(db, "junta_directiva"), {
              cargo: mbr.cargo || "",
              nombre: mbr.nombre || "",
              apellido: mbr.apellido || "",
              photoUrl: mbr.photoUrl || "",
              createdAt: new Date(Date.now() + idx * 1000).toISOString()
            }).catch(e => console.error("Migrate error", e));
          })
        ).catch(e => console.error(e));
        return;
      }

      // Sort by creation date ascending (oldest first)
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setBoardMembers(list);
    }, (err) => {
      console.error("Board sync failed: ", err);
    });
    return () => unsub();
  }, [config]);

  // Real-time directiva_evangelismo sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "directiva_evangelismo"), (snapshot) => {
      const list: BoardMember[] = [];
      snapshot.forEach((d) => {
        const raw = d.data();
        list.push({
          id: d.id,
          cargo: raw.cargo || "",
          nombre: raw.nombre || "",
          apellido: raw.apellido || "",
          photoUrl: raw.photoUrl || "",
          createdAt: raw.createdAt || "",
        } as BoardMember);
      });
      // Sort by creation date ascending (oldest first)
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setEvangelismoDirectivos(list);
    }, (err) => {
      console.error("Evangelismo directiva sync failed: ", err);
    });
    return () => unsub();
  }, [config]);

  // Real-time directiva_instituto sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "directiva_instituto"), (snapshot) => {
      const list: BoardMember[] = [];
      snapshot.forEach((d) => {
        const raw = d.data();
        list.push({
          id: d.id,
          cargo: raw.cargo || "",
          nombre: raw.nombre || "",
          apellido: raw.apellido || "",
          photoUrl: raw.photoUrl || "",
          createdAt: raw.createdAt || "",
        } as BoardMember);
      });
      // Sort by creation date ascending (oldest first)
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      setInstitutoDirectivos(list);
    }, (err) => {
      console.error("Instituto directiva sync failed: ", err);
    });
    return () => unsub();
  }, [config]);

  // 8. Real-time Presbiteros de Zona sync
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "presbiteros_zona"), (snapshot) => {
      const list: PresbiteroZona[] = [];
      snapshot.forEach((d) => {
        const raw = d.data();
        list.push({
          id: d.id,
          nombre: raw.nombre || "",
          apellido: raw.apellido || "",
          cargo: raw.cargo || "Presbítero",
          zona: raw.zona || "",
          photoUrl: raw.photoUrl || "",
          createdAt: raw.createdAt || "",
        } as PresbiteroZona);
      });
      setPresbiteros(list);
    }, (err) => {
      console.error("Presbiteros sync failed: ", err);
    });
    return () => unsub();
  }, []);

  // Operations: Logo updates
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const finalLogoUrl = await uploadToImgBB(file);

      await updateDoc(doc(db, "configuracion", "global"), {
        logoUrl: finalLogoUrl,
        logoBase64: finalLogoUrl
      });
      triggerToast("¡Logotipo de la federación actualizado correctamente!");
    } catch (err) {
      console.error("Logo upload failed: ", err);
      triggerToast("Se produjo un error al actualizar el logotipo.");
    } finally {
      setLogoUploading(false);
    }
  };

  // Operations: Create announcements publications
  const handleCreatePublication = async (texto: string, imgBase64: string, tipo: "imagen" | "video", videoUrl: string) => {
    try {
      let finalImgUrl = "";
      let finalVideoUrl = videoUrl || "";

      if (imgBase64 && imgBase64.startsWith("data:")) {
        // Upload image to ImgBB and get the hosted URL
        triggerToast("Subiendo imagen de la publicación a la red...");
        finalImgUrl = await uploadToImgBB(imgBase64);
      }

      if (videoUrl && videoUrl.startsWith("data:")) {
        // Upload video helper to ImgBB
        triggerToast("Subiendo archivo multimedia a la red...");
        finalVideoUrl = await uploadToImgBB(videoUrl);
      }

      await addDoc(collection(db, "publicaciones"), {
        texto,
        imagenBase64: finalImgUrl,
        tipo,
        videoUrl: finalVideoUrl,
        fecha: { seconds: Math.floor(Date.now() / 1000) }
      });
      triggerToast("Anuncio publicado correctamente en la federación.");
    } catch (err: any) {
      console.error("Publications error:", err);
      triggerToast(err?.message || "Error al publicar novedad.");
      throw err;
    }
  };

  // Operations: Submit dynamic teología pre-registration details from portal
  const handlePreinscripcion = async (
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
  ) => {
    try {
      await addDoc(collection(db, "inscritos_instituto"), {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cedula: cedula.trim(),
        whatsapp: whatsapp.trim(),
        edad: edad.trim(),
        motivo: motivo.trim(),
        ...extraFields,
        createdAt: new Date().toISOString()
      });
      triggerToast("¡Preinscripción subida con éxito! Nos comunicaremos con usted.");
    } catch (e) {
      console.error(e);
      triggerToast("Error al procesar inscripción escolar.");
    }
  };

  // Operations: global save config document updates
  const handleSaveConfig = async (updatedFields: Partial<AppConfig>) => {
    try {
      await updateDoc(doc(db, "configuracion", "global"), updatedFields);
      triggerToast("Configuraciones del sitio general actualizadas.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al actualizar configuración.");
    }
  };

  // Operations: Junta Directiva Firestore persist methods
  const handleCreateBoardMember = async (cargo: string, nombre: string, apellido: string, photoUrl: string) => {
    try {
      const docRef = await addDoc(collection(db, "junta_directiva"), {
        cargo: cargo.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        photoUrl: photoUrl,
        createdAt: new Date().toISOString()
      });
      triggerToast("Miembro añadido a la junta directiva.");
      return docRef.id;
    } catch (err) {
      console.error(err);
      triggerToast("Error al registrar directivo.");
      throw err;
    }
  };

  const handleUpdateBoardMember = async (id: string, cargo: string, nombre: string, apellido: string, photoUrl: string) => {
    try {
      await updateDoc(doc(db, "junta_directiva", id), {
        cargo: cargo.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        photoUrl: photoUrl
      });
      triggerToast("Miembro de la junta actualizado en el servidor.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al actualizar directivo.");
      throw err;
    }
  };

  const handleDeleteBoardMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, "junta_directiva", id));
      triggerToast("Miembro dado de baja de la junta.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al eliminar directivo.");
      throw err;
    }
  };

  const handleCreateEvangelismoDirectivo = async (cargo: string, nombre: string, apellido: string, photoUrl: string) => {
    try {
      const docRef = await addDoc(collection(db, "directiva_evangelismo"), {
        cargo: cargo.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        photoUrl: photoUrl,
        createdAt: new Date().toISOString()
      });
      triggerToast("Miembro añadido a la directiva de Evangelismo.");
      return docRef.id;
    } catch (err) {
      console.error(err);
      triggerToast("Error al registrar directivo de Evangelismo.");
      throw err;
    }
  };

  const handleUpdateEvangelismoDirectivo = async (id: string, cargo: string, nombre: string, apellido: string, photoUrl: string) => {
    try {
      await updateDoc(doc(db, "directiva_evangelismo", id), {
        cargo: cargo.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        photoUrl: photoUrl
      });
      triggerToast("Miembro de la directiva de Evangelismo actualizado.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al actualizar directivo de Evangelismo.");
      throw err;
    }
  };

  const handleDeleteEvangelismoDirectivo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "directiva_evangelismo", id));
      triggerToast("Miembro de la directiva de Evangelismo de baja.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al eliminar directivo de Evangelismo.");
      throw err;
    }
  };

  const handleCreateInstitutoDirectivo = async (cargo: string, nombre: string, apellido: string, photoUrl: string) => {
    try {
      const docRef = await addDoc(collection(db, "directiva_instituto"), {
        cargo: cargo.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        photoUrl: photoUrl,
        createdAt: new Date().toISOString()
      });
      triggerToast("Miembro añadido a la directiva del Instituto.");
      return docRef.id;
    } catch (err) {
      console.error(err);
      triggerToast("Error al registrar directivo del Instituto.");
      throw err;
    }
  };

  const handleUpdateInstitutoDirectivo = async (id: string, cargo: string, nombre: string, apellido: string, photoUrl: string) => {
    try {
      await updateDoc(doc(db, "directiva_instituto", id), {
        cargo: cargo.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        photoUrl: photoUrl
      });
      triggerToast("Miembro de la directiva del Instituto actualizado.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al actualizar directivo del Instituto.");
      throw err;
    }
  };

  const handleDeleteInstitutoDirectivo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "directiva_instituto", id));
      triggerToast("Miembro de la directiva del Instituto dado de baja.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al eliminar directivo del Instituto.");
      throw err;
    }
  };

  // Operations: Presbíteros de Zona Firestore CRUD methods
  const handleCreatePresbitero = async (nombre: string, apellido: string, cargo: string, zona: string, photoUrl: string) => {
    try {
      const docRef = await addDoc(collection(db, "presbiteros_zona"), {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        cargo: cargo.trim() || "Presbítero",
        zona: zona.trim(),
        photoUrl: photoUrl,
        createdAt: new Date().toISOString()
      });
      triggerToast(`Presbítero de ${zona} añadido con éxito.`);
      return docRef.id;
    } catch (err) {
      console.error(err);
      triggerToast("Error al registrar presbítero.");
      throw err;
    }
  };

  const handleUpdatePresbitero = async (id: string, nombre: string, apellido: string, cargo: string, zona: string, photoUrl: string) => {
    try {
      await updateDoc(doc(db, "presbiteros_zona", id), {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        cargo: cargo.trim() || "Presbítero",
        zona: zona.trim(),
        photoUrl: photoUrl
      });
      triggerToast(`Presbítero de ${zona} actualizado.`);
    } catch (err) {
      console.error(err);
      triggerToast("Error al actualizar presbítero.");
      throw err;
    }
  };

  const handleDeletePresbitero = async (id: string) => {
    try {
      await deleteDoc(doc(db, "presbiteros_zona", id));
      triggerToast("Presbítero retirado de la zona.");
    } catch (err) {
      console.error(err);
      triggerToast("Error al eliminar presbítero.");
      throw err;
    }
  };

  // Operations: Delete item documents
  const handleDeleteMember = async (id: string) => {
    if (!window.confirm("¿Confirma que desea eliminar la credencial de miembro permanentemente?")) return;
    try {
      // Find the user to know their collection
      const user = allUsers.find(u => u.id === id);
      if (user) {
        let collName = "usuarios";
        if (user.departamento === "pastores") collName = "gremio";
        else if (user.departamento === "evangelismo") collName = "evangelismo";
        else if (user.departamento === "miembros") collName = "miembros_generales";

        await deleteDoc(doc(db, collName, id));
        triggerToast("Miembro dado de baja del registro.");
      } else {
        // Fallback: try deleting from all possible collections
        const possibleColls = ["usuarios", "gremio", "evangelismo", "miembros_generales"];
        for (const coll of possibleColls) {
          try {
            await deleteDoc(doc(db, coll, id));
          } catch (e) {}
        }
        triggerToast("Miembro dado de baja del registro.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error al remover miembro.");
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!window.confirm("¿Seguro de remover este aplicante?")) return;
    try {
      await deleteDoc(doc(db, "inscritos_instituto", id));
      triggerToast("Inscrito removido.");
    } catch (e) {
      triggerToast("Error al remover.");
    }
  };

  const handleDeletePublication = async (id: string) => {
    if (!window.confirm("¿Confirma remover esta publicación?")) return;
    try {
      await deleteDoc(doc(db, "publicaciones", id));
      triggerToast("Publicación eliminada.");
    } catch (e) {
      triggerToast("Ocurrió un error.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAdminLoggedIn(false);
    setCurrentTab("inicio");
    triggerToast("Sesión de administrador cerrada con éxito.");
  };

  // Navigation controller helper
  const navigateToTab = (tab: typeof currentTab) => {
    setCurrentTab(tab);
    setActivePublicationId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileMenuOpen(false);
    
    // Sync query parameters to navigation state
    const params = new URLSearchParams(window.location.search);
    params.delete("id");
    params.delete("pubId");
    params.set("modulo", tab);
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  // NAVIGATION BAR ITEMS DIRECTLY CORRESPONDING TO CORE TABS
  const navigationItems = [
    { key: "inicio", label: "Inicio / Portada" },
    { key: "admin", label: adminLoggedIn ? "Panel Admin" : "Acceso de Administrador" }
  ];

  const getLogoForHeader = () => {
    switch (currentTab) {
      case "evangelismo":
        return "https://i.postimg.cc/JzdFxpKr/Chat-GPT-Image-19-may-2026-07-54-55-p-m.png";
      case "instituto":
        return "https://i.postimg.cc/8cMwkdrJ/Gemini-Generated-Image-62ha0f62ha0f62ha.png";
      case "pastores":
      case "miembros":
      default:
        return config?.logoBase64 || config?.logoUrl || "https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png";
    }
  };

  // ================= MAIN RENDER CONDITIONAL: LOADING COLD-START =================
  // Completely eliminated blocking screens in favor of immediate, lightweight interactive skeleton renderings

  // ================= RENDER PATHWAY 1: DYNAMIC VERIFICATION CREDENTIAL =================
  if (profileId) {
    if (isVerMiembroPath) {
      return (
        <div className="fondo-degradado-fief min-h-screen py-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <PerfilDigital userId={profileId} />
          </div>
        </div>
      );
    }

    return (
      <div className="fondo-degradado-fief min-h-screen py-10">
        <div className="max-w-md mx-auto px-4 text-center space-y-4">
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.delete("id");
              window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
              setProfileId(null);
            }}
            className="py-2.5 px-6 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase"
          >
            Volver a la Web Principal
          </button>
          <PerfilDigital userId={profileId} />
        </div>
      </div>
    );
  }

  // ================= RENDER PATHWAY 2: SECRET MEMBER REGISTRATION =================
  if (isSecretRoute) {
    return (
      <div className="fondo-degradado-fief min-h-screen py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-6">
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.delete("modulo");
                window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
                setIsSecretRoute(false);
                navigateToTab("inicio");
              }}
              className="py-2 px-5 bg-slate-900 text-white rounded-xl text-xs font-bold font-display"
            >
              Volver al Inicio
            </button>
          </div>
          <RegistroSecreto 
            isAdmin={adminLoggedIn} 
            isOnlyMiembro={isSecretOnlyMiembros} 
            preselectedSection={registroPresetSection}
            onRegisterSuccess={(cat) => {
              const mappedTab = cat === "pastor" ? "pastores" : cat === "evangelismo" ? "evangelismo" : "miembros";
              const params = new URLSearchParams(window.location.search);
              params.delete("modulo");
              window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
              setIsSecretRoute(false);
              navigateToTab(mappedTab);
            }}
          />
        </div>
      </div>
    );
  }

  // ================= RENDER PATHWAY 3: FULL ADMINISTRATIVE SIDEBAR PANEL =================
  if (currentTab === "admin" && adminLoggedIn) {
    return (
      <AdminDashboard
        config={config}
        triggerToast={triggerToast}
        currentUserEmail={currentUser?.email || null}
        onSignOut={handleSignOut}
        onNavigateBack={() => navigateToTab("inicio")}
        allEnrollments={allEnrollments}
        onDeleteEnrollment={handleDeleteEnrollment}
        allUsers={allUsers}
      />
    );
  }

  const isSpecificTab = ["pastores", "evangelismo", "instituto"].includes(currentTab);
  
  const getSectionTitleText = (tab: string): string => {
    if (tab === "pastores") return "Gremio Pastoral";
    if (tab === "evangelismo") return "Departamento de Evangelismo y Misiones";
    if (tab === "instituto") return "Instituto Bíblico IBEM";
    return "";
  };

  return (
    <div className="fondo-degradado-fief min-h-screen flex flex-col justify-between relative overflow-x-hidden font-sans">
      
      {/* PWA INSTALL FLOATING BANNER */}
      {showInstallBanner && !isAlreadyStandalone && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-800 z-40 animate-fade-in flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-xl flex-shrink-0 flex items-center justify-center p-1.5 shadow-md">
                <img 
                  src="https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png" 
                  alt="FIEP Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">Instalar Aplicación FIEP</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Agrega FIEP a tu pantalla principal para acceso instantáneo a tus credenciales y zonas.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="px-3 py-1.5 text-[10px] text-slate-400 hover:text-white uppercase font-extrabold tracking-wider transition cursor-pointer"
            >
              Quizás luego
            </button>
            <button
              onClick={handleInstallApp}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Instalar</span>
            </button>
          </div>
        </div>
      )}

      {/* iOS MANUAL PWA INSTALLATION INSTRUCTIONS MODAL */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-up">
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded-2xl mx-auto flex items-center justify-center p-2 shadow-xs">
                <img 
                  src="https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png" 
                  alt="FIEP Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Instalar en tu iPhone / iPad</h3>
                <p className="text-[11px] text-slate-500 font-medium">Sigue estas sencillas instrucciones para agregar la aplicación a tu pantalla principal:</p>
              </div>

              <div className="text-left space-y-3 pt-2 text-xs font-medium text-slate-700">
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 bg-blue-50 text-blue-600 font-extrabold font-mono rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">1</div>
                  <p className="leading-relaxed">
                    Abre esta página en <span className="font-extrabold text-blue-600">Safari</span> si estás usando otro navegador.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 bg-blue-50 text-blue-600 font-extrabold font-mono rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">2</div>
                  <p className="leading-relaxed">
                    Toca el botón de <span className="font-extrabold">Compartir</span> <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">📤</span> (el icono con una flecha hacia arriba) en la barra inferior de Safari.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 bg-blue-50 text-blue-600 font-extrabold font-mono rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">3</div>
                  <p className="leading-relaxed">
                    Desplázate hacia abajo en el menú de opciones y toca en <span className="font-extrabold text-slate-900">"Agregar a inicio"</span> (o <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1"><PlusSquare className="h-3 w-3 inline text-slate-500" /> Add to Home Screen</span>).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-5 w-5 bg-blue-50 text-blue-600 font-extrabold font-mono rounded-full flex items-center justify-center flex-shrink-0 text-[10px]">4</div>
                  <p className="leading-relaxed">
                    Presiona <span className="font-extrabold text-blue-600">"Agregar"</span> en la esquina superior derecha para confirmar.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ADMIN STATUS NOTIFICATION BAR */}
      {adminLoggedIn && (
        <div className="bg-slate-900 text-white text-xs font-bold py-3 px-6 flex flex-wrap justify-between items-center gap-4 border-b border-blue-900 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="inline-block py-0.5 px-2.5 bg-blue-600 text-white rounded-md font-mono text-[9px] uppercase tracking-wider animate-pulse">
              Modo Administrador
            </span>
            <span className="text-slate-200">
              Edición en contexto activada. Haz clic en los iconos <span className="inline-block bg-white/10 px-1 py-0.5 rounded text-white font-mono">✏️ Editar</span> para actualizar contenidos directamente.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab("admin")}
              className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm text-[10px] uppercase tracking-wider cursor-pointer transition"
            >
              Ir al Panel General
            </button>
            <button
              onClick={handleSignOut}
              className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg shadow-sm text-[10px] uppercase tracking-wider cursor-pointer transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL TOAST NOTIFIER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 border border-slate-800 text-white text-xs sm:text-xs font-bold leading-normal rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm animate-bounce">
          <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* GLOBAL HIGH-CONTRAST MASTER HEADER (Logo is the central protagonist) */}
      <header className="w-full bg-transparent pt-10 pb-6 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          {/* Logo como Protagonista Absoluto (max-width: 250px a 300px, centrado horizontalmente) */}
          <div 
            className="block text-center cursor-pointer group select-none max-w-[280px] sm:max-w-[290px] mx-auto mb-8"
            onClick={() => navigateToTab("inicio")}
          >
            <div className={`relative p-2 bg-white rounded-full border-4 border-sky-100 shadow-xl group-hover:border-blue-300 group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-103 ${configLoading ? "animate-pulse" : ""}`}>
              {configLoading ? (
                <div className="w-[260px] h-[260px] max-w-full rounded-full bg-slate-200" />
              ) : (
                <Logo 
                  url={getLogoForHeader()} 
                  className="w-full h-auto aspect-square rounded-full object-contain"
                />
              )}
            </div>
            
            {/* Elegant Institutional Headings with generous bottom margin */}
            {isSpecificTab ? (
              <SectionTitle title={getSectionTitleText(currentTab)} />
            ) : (
              <div className={`space-y-1.5 mt-5 ${configLoading ? "animate-pulse" : ""}`}>
                {configLoading ? (
                  <>
                    <div className="h-6 w-56 bg-slate-200 rounded mx-auto" />
                    <div className="h-3 w-72 bg-slate-200 rounded mx-auto mt-2" />
                  </>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 uppercase tracking-tight leading-none">
                      {config?.nombreFederacion || "F.I.E.P. Columna de Fuego"}
                    </h1>
                    <span className="block text-xs font-bold text-blue-600 uppercase tracking-widest leading-none">
                      Federación de Iglesias Evangélicas Pentecostales Nacional e Internacional
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Minimal, elegant and secondary Navigation Links to avoid any distraction */}
          <div className="w-full border-t border-sky-100/60 pt-6">
            
            {/* Desktop Navigation Links - Compact, minimal capsules */}
            <nav className="hidden lg:flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold w-full">
              {navigationItems.map((item) => {
                const active = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigateToTab(item.key as any)}
                    className={`px-4 py-2.5 rounded-xl transition cursor-pointer text-[11px] uppercase tracking-wider ${
                      active 
                        ? 'bg-blue-600 text-white shadow-xs font-black' 
                        : 'hover:bg-sky-50/80 hover:text-slate-950 bg-white/50 border border-slate-100/50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
              {!isAlreadyStandalone && (
                <button
                  onClick={handleInstallApp}
                  className="px-4 py-2.5 rounded-xl transition cursor-pointer text-[11px] uppercase tracking-wider text-slate-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/40 flex items-center gap-1.5 font-extrabold"
                  title="Instalar como Aplicación Móvil"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Instalar App</span>
                </button>
              )}
            </nav>

            {/* Mobile Hamburger burger and layout */}
            <div className="lg:hidden flex items-center justify-between px-2">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">Navegación</span>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="py-2 px-4 bg-white/80 border border-sky-100 text-slate-700 hover:bg-sky-50 active:bg-sky-100 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-3xs"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 font-sans">
                  {isMobileMenuOpen ? "Ocultar" : "Menú Sección"}
                </span>
                {isMobileMenuOpen ? <X className="h-3.5 w-3.5 text-slate-500" /> : <Menu className="h-3.5 w-3.5 text-slate-500" />}
              </button>
            </div>

          </div>

        </div>

        {/* Mobile menu dropdown list */}
        {isMobileMenuOpen && (
          <div className="lg:hidden max-w-md mx-auto mt-4 px-4">
            <div className="bg-white border border-sky-100 p-3.5 space-y-1.5 text-left flex flex-col text-xs font-bold text-slate-700 rounded-2xl shadow-lg">
              {navigationItems.map((item) => {
                const active = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigateToTab(item.key as any)}
                    className={`w-full text-left py-3 px-4 rounded-xl transition flex items-center justify-between ${
                      active 
                        ? 'bg-blue-50 text-blue-700 font-black' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {active && <div className="h-2 w-2 bg-blue-600 rounded-full" />}
                  </button>
                );
              })}
              {!isAlreadyStandalone && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleInstallApp();
                  }}
                  className="w-full text-left py-3 px-4 rounded-xl transition flex items-center justify-between bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-extrabold mt-1 border border-emerald-100/50"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    <span>Instalar Aplicación FIEP</span>
                  </span>
                  <span className="text-[8px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Gratis</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CORE DISPLAY ROUTE WORKSPACE */}
      <main className="flex-grow py-8 max-w-7xl mx-auto w-full px-4 md:px-6">
        
        {/* GLOBAL RETURN BUTTON FOR NON-HOME VIEWS */}
        {currentTab !== "inicio" && !activePublicationId && (
          <div className="mb-6 flex justify-start">
            <button
              onClick={() => navigateToTab("inicio")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-200 text-slate-700 hover:text-blue-700 font-extrabold uppercase tracking-widest text-[10px] sm:text-[11px] rounded-xl shadow-3xs cursor-pointer transition duration-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Regresar al Inicio
            </button>
          </div>
        )}

        {activePublicationId ? (
          (() => {
            const pub = publications.find(p => p.id === activePublicationId);
            if (!pub) {
              return (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
                  <p className="text-sm font-semibold text-slate-500">Buscando publicación en la red ministerial...</p>
                  <button
                    onClick={() => {
                      setActivePublicationId(null);
                      window.history.pushState({}, "", "/");
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Volver al Inicio
                  </button>
                </div>
              );
            }
            return (
              <PublicationDetail
                publication={pub}
                onClose={() => {
                  setActivePublicationId(null);
                  window.history.pushState({}, "", "/");
                }}
                adminLoggedIn={adminLoggedIn}
                onDelete={handleDeletePublication}
                triggerToast={triggerToast}
              />
            );
          })()
        ) : (
          <>
            {/* VIEW 1: HOME LANDING PAGE */}
            {currentTab === "inicio" && (
              <LandingPage
                config={config}
                configLoading={configLoading}
                publications={publications}
                boardMembers={boardMembers}
                presbiteros={presbiteros}
                onNavigate={navigateToTab}
                onOpenPublication={(id) => {
                  setActivePublicationId(id);
                  window.history.pushState({ pubId: id }, "", `/publicacion/${id}`);
                }}
                adminLoggedIn={adminLoggedIn}
                logoLoading={logoUploading}
                onSaveConfig={handleSaveConfig}
                onCreatePublication={handleCreatePublication}
                onDeletePublication={handleDeletePublication}
                onCreateBoardMember={handleCreateBoardMember}
                onUpdateBoardMember={handleUpdateBoardMember}
                onDeleteBoardMember={handleDeleteBoardMember}
                onCreatePresbitero={handleCreatePresbitero}
                onUpdatePresbitero={handleUpdatePresbitero}
                onDeletePresbitero={handleDeletePresbitero}
                triggerToast={triggerToast}
              />
            )}

            {/* VIEW 2: ALL DIRECTORY DEPARTMENTS (pastores, evangelistas, instituto, miembros) */}
            {["pastores", "evangelismo", "instituto", "miembros"].includes(currentTab) && (
              <Directories
                config={config}
                allUsers={allUsers}
                currentTab={currentTab as any}
                onPreinscripcion={handlePreinscripcion}
                onNavigateToSecretRegister={() => {
                  setRegistroPresetSection(undefined);
                  const params = new URLSearchParams(window.location.search);
                  params.set("modulo", "registro_secreto");
                  window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
                  setIsSecretRoute(true);
                }}
                onNavigateToSecretRegisterWithTab={(sect) => {
                  setRegistroPresetSection(sect);
                  const params = new URLSearchParams(window.location.search);
                  params.set("modulo", sect === "miembro" ? "registro_miembros" : "registro_secreto");
                  window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
                  setIsSecretRoute(true);
                  setIsSecretOnlyMiembros(sect === "miembro");
                }}
                adminLoggedIn={adminLoggedIn}
                onSaveConfig={handleSaveConfig}
                triggerToast={triggerToast}
                onDeleteMember={handleDeleteMember}
                evangelismoDirectivos={evangelismoDirectivos}
                onCreateEvangelismoDirectivo={handleCreateEvangelismoDirectivo}
                onUpdateEvangelismoDirectivo={handleUpdateEvangelismoDirectivo}
                onDeleteEvangelismoDirectivo={handleDeleteEvangelismoDirectivo}
                institutoDirectivos={institutoDirectivos}
                onCreateInstitutoDirectivo={handleCreateInstitutoDirectivo}
                onUpdateInstitutoDirectivo={handleUpdateInstitutoDirectivo}
                onDeleteInstitutoDirectivo={handleDeleteInstitutoDirectivo}
              />
            )}

            {/* VIEW 4: STANDALONE MULTIMEDIA GALLERY / PUBLICATIONS FEED */}
            {currentTab === "publicaciones" && (
              <div className="bg-white/70 backdrop-blur rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="border-b pb-3 flex items-center justify-between gap-2">
                  <div className="text-left">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight font-display flex items-center gap-2">
                      <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <Layers className="h-5 w-5" />
                      </span>
                      Galería de Publicaciones Oficiales
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold font-sans mt-0.5">Fotos instructivas, sermones pastorales y videos de unción de la Federación.</p>
                  </div>
                </div>

                {publications.length === 0 ? (
                  <div className="text-center py-16 text-slate-450 font-sans italic text-xs">
                    No hay publicaciones registradas por el momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {publications.map((pub) => {
                      const isVideo = pub.tipo === "video" || pub.videoUrl;
                      const itemImg = pub.imagenBase64 || pub.photoUrl || "";
                      return (
                        <div
                          key={pub.id}
                          onClick={() => {
                            setActivePublicationId(pub.id);
                            window.history.pushState({ pubId: pub.id }, "", `/publicacion/${pub.id}`);
                          }}
                          className={`relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-3xs cursor-pointer group hover:shadow-lg transition-all duration-350 ${isVideo ? 'aspect-[9/16]' : 'aspect-square'}`}
                        >
                          {itemImg && (
                            <img
                              src={itemImg}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover opacity-75 group-hover:scale-105 transition duration-500"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
                          {isVideo && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center backdrop-blur-xs transition group-hover:scale-110">
                              <Play className="h-4 w-4 fill-current ml-0.5" />
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 p-4 z-20 space-y-1 text-left">
                            <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md font-mono ${isVideo ? 'bg-sky-600 text-white' : 'bg-purple-600 text-white'}`}>
                              {isVideo ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                              {isVideo ? "Video / Sermón" : "Actividad General"}
                            </span>
                            <p className="text-white text-xs font-black line-clamp-3 leading-snug font-sans">
                              {pub.texto}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: SECURE ADMINISTRATIVE PORTAL LOGIN SCREEN */}
            {currentTab === "admin" && !adminLoggedIn && (
              <div className="max-w-md mx-auto">
                <AdminLogin
                  onSuccess={() => {
                    setAdminLoggedIn(true);
                    navigateToTab("inicio");
                  }}
                  currentUserEmail={currentUser?.email || null}
                  isAdminLoggedIn={adminLoggedIn}
                />
              </div>
            )}
          </>
        )}

      </main>

      {/* GLOBAL FOOTER BRAND INDICATORS */}
      <footer className="bg-slate-900 text-white py-12 mt-12 text-left border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-xs sm:text-xs">
          
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              <Logo url={config?.logoBase64 || config?.logoUrl || "https://i.postimg.cc/Hkw3jbLQ/Gemini-Generated-Image-l2ncmql2ncmql2nc.png"} className="h-10 w-10 p-0.5 bg-white rounded-lg" />
              <div>
                <h4 className="font-extrabold font-display leading-tight text-white tracking-widest text-[11px]">F.I.E.P. COLUMNA DE FUEGO</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Avivamiento y Doctrina Conciliar</p>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-w-xl">
              La Columna de Fuego es una Federación de fe que cree en el Padre, Hijo y Espíritu Santo. Tiene como único propósito predicar el evangelio de nuestro Señor Jesucristo a toda persona,
            </p>

            <p className="text-[11px] text-[#38bdf8] font-black font-sans uppercase tracking-wider">
              Sede Principal: San Fernando de Apure, Venezuela.
            </p>
          </div>

          <div className="md:col-span-4 md:text-right flex flex-col md:items-end gap-2.5">
            <p className="text-[10px] text-slate-500 font-medium font-sans">© {new Date().getFullYear()} FIEP Columna de Fuego. Todos los derechos reservados.</p>
            
            <a 
              href="https://richardcalderon.dev" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center md:justify-end gap-2 text-[10px] text-slate-500 hover:text-slate-400 transition-colors group"
              title="Visitar Richard Calderón Dev."
            >
              <div className="flex items-center gap-0.5 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800 text-[9px] font-black tracking-wider select-none group-hover:border-slate-700 group-hover:bg-slate-950 transition-all">
                <span className="text-amber-500">R</span>
                <span className="text-white">C</span>
              </div>
              <span className="font-sans leading-none">
                Desarrollado por <span className="font-semibold text-slate-400 group-hover:text-amber-400 group-hover:underline transition-all">Richard Calderón Dev.</span> | Soluciones Digitales
              </span>
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}
