export interface SectionConfig {
  title: string;
  description: string;
  icon: string;
  image?: string; // Optional Base64 or URL custom image/photo for the directory card
}

export interface BoardMember {
  id?: string;
  cargo: string;
  nombre: string;
  apellido?: string;
  photoUrl?: string;
  createdAt?: string;
}

export interface PresbiteroZona {
  id?: string;
  nombre: string;
  apellido: string;
  cargo: string;
  zona: string;
  photoUrl?: string;
  createdAt?: string;
}

export interface AppConfig {
  logoUrl: string;
  logoBase64?: string;
  initialBgBase64?: string;
  quienesSomosText: string;
  misionText: string;
  visionText: string;
  valoresText: string;
  directorWhatsApp: string;
  institutoResena: string;
  institutoProfesores: string;
  institutoLugares: string;
  heroBgUrl?: string;
  heroBgOpacity?: number;
  presidentName?: string;
  presidentLastName?: string;
  presidentPhoto?: string;
  presidentMessage?: string;
  juntaDirectiva?: BoardMember[];
  sections: {
    pastores: SectionConfig;
    evangelismo: SectionConfig;
    miembros: SectionConfig;
    instituto: SectionConfig;
  };
  allowedAdminEmails?: string[];
  historyMilestones?: {
    id: string;
    ano: string;
    titulo: string;
    descripcion: string;
    imagen?: string;
    mediaList?: { type: "image" | "video"; url: string }[];
  }[];
  heroTitle?: string;
  heroSubtitle?: string;
  navInicioLabel?: string;
  navGremioLabel?: string;
  navEvangelismoLabel?: string;
  navMiembrosLabel?: string;
  navInstitutoLabel?: string;
  navAdminLabel?: string;
  juntaTitle?: string;
  juntaDesc?: string;
  presidentSectionTitle?: string;
  evangelismoHistoria?: string;
  institutoDescripcion?: string;
  imgbbApiKey?: string;
}

export interface IglesiaUsuario {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  fechaNacimiento?: string;
  edad: number | string;
  iglesia: string;
  zona: string;
  ciudad?: string;
  pueblo?: string;
  caserio?: string;
  ministerio: string;
  photoUrl: string;
  departamento: string; // 'evangelismo', 'pastores', 'miembros' o 'general'
  status: string; // 'activo' o 'inactivo'
  createdAt: any; // Firestore Timestamp o string
  rol?: string;
  estado?: string; // (for backward-compatibility, concatenation of location)
  pastor?: string;
}

export interface PresinscritoInstituto {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  edad: string;
  whatsapp: string;
  motivo?: string;
  createdAt: any;
  fechaNacimiento?: string;
  iglesia?: string;
  iglesiaUbicacion?: string;
  pastor?: string;
  pastorTelefono?: string;
  fechaInicio?: string;
  celularHermano?: string;
  fechaInscripcion?: string;
}

export interface Publicacion {
  id: string;
  texto: string;
  imagenBase64: string;
  fecha: any;
  tipo?: "imagen" | "video";
  videoUrl?: string;
}
