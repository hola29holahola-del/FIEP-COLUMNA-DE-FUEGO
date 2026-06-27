import { jsPDF } from "jspdf";

export interface PlanillaData {
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
}

export function downloadPlanillaPDF(data: PlanillaData) {
  if (!data) return;
  
  const doc = new jsPDF();
  
  // Header Style (REPÚBLICA BOLIVARIANA DE VENEZUELA / INSTITUTO BÍBLICO "COLUMNA DE FUEGO")
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("REPÚBLICA BOLIVARIANA DE VENEZUELA", 105, 18, { align: "center" });
  doc.setFontSize(14);
  doc.text("INSTITUTO BÍBLICO \"COLUMNA DE FUEGO\"", 105, 25, { align: "center" });
  
  doc.setFontSize(12);
  doc.text("INSCRIPCIÓN Y COMPROMISO", 105, 34, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  let startY = 48;
  const lineSpacing = 8.5;
  
  // Yo, (nombres y apellidos) ____________________
  doc.setFont("helvetica", "bold");
  doc.text("Yo, (nombres y apellidos)", 20, startY);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.nombre} ${data.apellido}`, 68, startY);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(66, startY + 1, 190, startY + 1);
  
  // Documento de Identidad No. _________ nacido(a) el ____/____/____
  startY += lineSpacing;
  doc.setFont("helvetica", "bold");
  doc.text("Documento de Identidad No.", 20, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.cedula, 72, startY);
  doc.line(70, startY + 1, 120, startY + 1);
  
  doc.setFont("helvetica", "bold");
  doc.text("nacido(a) el", 123, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.fechaNacimiento, 145, startY);
  doc.line(143, startY + 1, 190, startY + 1);
  
  // De ____ años de edad, miembro de la Iglesia _________________
  startY += lineSpacing;
  doc.setFont("helvetica", "bold");
  doc.text("De", 20, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.edad, 27, startY);
  doc.line(25, startY + 1, 42, startY + 1);
  
  doc.setFont("helvetica", "bold");
  doc.text("años de edad, miembro de la Iglesia", 44, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.iglesia, 108, startY);
  doc.line(106, startY + 1, 190, startY + 1);
  
  // Ubicada en _______________ cuyo pastor(a) es ________________
  startY += lineSpacing;
  doc.setFont("helvetica", "bold");
  doc.text("Ubicada en", 20, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.iglesiaUbicacion, 42, startY);
  doc.line(40, startY + 1, 105, startY + 1);
  
  doc.setFont("helvetica", "bold");
  doc.text("cuyo pastor(a) es", 108, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.pastor, 140, startY);
  doc.line(138, startY + 1, 190, startY + 1);
  
  // teléfonos del Pastor ____________________
  startY += lineSpacing;
  doc.setFont("helvetica", "bold");
  doc.text("teléfonos del Pastor", 20, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.pastorTelefono, 58, startY);
  doc.line(56, startY + 1, 190, startY + 1);
  
  // Prose block
  startY += 7;
  const prose = `El cual con su firma avala mi inscripción; mediante la presente solicito mi inscripción en el curso que inicia en la fecha ${data.fechaInicio}. Manifestando mi compromiso personal a someterme a seguir la metodología y normas de estudio de la Institución, así como al cumplimiento cabal de mis obligaciones y asignaciones que deriven de dicho estudio.`;
  doc.setFont("helvetica", "normal");
  const splitProse = doc.splitTextToSize(prose, 170);
  doc.text(splitProse, 20, startY);
  
  startY += (splitProse.length * 5) + 3;
  
  // Mi número de teléfono es __________ y el de un hermano ___________
  doc.setFont("helvetica", "bold");
  doc.text("Mi número de teléfono es", 20, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.celular, 66, startY);
  doc.line(64, startY + 1, 115, startY + 1);
  
  doc.setFont("helvetica", "bold");
  doc.text("y el de un hermano", 118, startY);
  doc.setFont("helvetica", "normal");
  doc.text(data.celularHermano, 153, startY);
  doc.line(151, startY + 1, 190, startY + 1);
  
  // TABLE: Materias a Inscribir 1er Trimestre
  startY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Materias a Inscribir 1er Trimestre:", 20, startY);
  
  startY += 3;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  
  const rowH = 6.5;
  
  // Header Row Background
  doc.setFillColor(245, 245, 245);
  doc.rect(20, startY, 170, rowH, "F");
  doc.rect(20, startY, 170, rowH, "S");
  
  // Divider lines
  doc.line(40, startY, 40, startY + rowH);
  doc.line(125, startY, 125, startY + rowH);
  doc.line(160, startY, 160, startY + rowH);
  doc.line(175, startY, 175, startY + rowH);
  
  doc.setFontSize(8.5);
  doc.text("Cod", 30, startY + 4.5, { align: "center" });
  doc.text("MATERIA", 82.5, startY + 4.5, { align: "center" });
  doc.text("Duración", 142.5, startY + 4.5, { align: "center" });
  doc.text("Calif.", 167.5, startY + 4.5, { align: "center" });
  doc.text("X", 182.5, startY + 4.5, { align: "center" });
  
  const subjects = [
    { cod: "NB01", name: "Introducción a la Teología", duration: "2 Horas" },
    { cod: "NB02", name: "Lenguaje y Comunicación I", duration: "4 Horas" },
    { cod: "NB03", name: "Hermenéutica I", duration: "6 Horas" },
    { cod: "TS01", name: "Bibliología", duration: "8 Horas" },
    { cod: "TS02", name: "Teología Propia (Dios y su Revelación)", duration: "8 Horas" },
  ];
  
  let currentY = startY + rowH;
  subjects.forEach((subj) => {
    doc.rect(20, currentY, 170, rowH, "S");
    doc.line(40, currentY, 40, currentY + rowH);
    doc.line(125, currentY, 125, currentY + rowH);
    doc.line(160, currentY, 160, currentY + rowH);
    doc.line(175, currentY, 175, currentY + rowH);
    
    doc.setFont("helvetica", "normal");
    doc.text(subj.cod, 30, currentY + 4.5, { align: "center" });
    doc.text(subj.name, 43, currentY + 4.5);
    doc.text(subj.duration, 142.5, currentY + 4.5, { align: "center" });
    doc.text("", 167.5, currentY + 4.5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text("X", 182.5, currentY + 4.5, { align: "center" });
    
    currentY += rowH;
  });
  
  // Totals Row
  doc.rect(20, currentY, 170, rowH, "S");
  doc.line(40, currentY, 40, currentY + rowH);
  doc.line(125, currentY, 125, currentY + rowH);
  doc.line(160, currentY, 160, currentY + rowH);
  doc.line(175, currentY, 175, currentY + rowH);
  
  doc.setFont("helvetica", "bold");
  doc.text("Totales......................................................", 43, currentY + 4.5);
  doc.text("28 Horas", 142.5, currentY + 4.5, { align: "center" });
  
  currentY += rowH + 6;
  
  // ADJUNTAR
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("ADJUNTAR:", 20, currentY);
  
  doc.setFont("helvetica", "normal");
  currentY += 4.5;
  doc.text("• COPIA DE DOCUMENTO DE IDENTIDAD", 22, currentY);
  currentY += 4;
  doc.text("• UNA FOTO TIPO CARNET", 22, currentY);
  currentY += 4;
  doc.text("• COPIA DEL TÍTULO DE BACHILLER O DE CONSTANCIAS DEL GRADO DE INSTRUCCIÓN QUE TIENE", 22, currentY);
  
  // Signatures
  currentY += 16;
  doc.line(20, currentY, 80, currentY);
  doc.text("PARTICIPANTE", 50, currentY + 4, { align: "center" });
  
  doc.line(130, currentY, 190, currentY);
  doc.text("INSTITUCION", 160, currentY + 4, { align: "center" });
  
  currentY += 12;
  doc.line(75, currentY, 135, currentY);
  doc.text("V. Bno.", 105, currentY + 4, { align: "center" });
  doc.text("PASTOR DEL PARTICIPANTE", 105, currentY + 8, { align: "center" });
  
  // Date footer (no canton/location: only the date, as per request)
  currentY += 14;
  doc.setFont("helvetica", "bold");
  doc.text(`Fecha: ${data.fechaInscripcion}`, 20, currentY);
  
  // Page Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Inscripción Oficial FIEP • Generado desde Portal Web • Fecha: ${new Date().toLocaleDateString()}`, 105, 288, { align: "center" });
  
  // Save Document
  doc.save(`Inscripcion_IBEM_${data.nombre}_${data.apellido}.pdf`);
}

export function getWhatsAppLink(data: PlanillaData) {
  if (!data) return "";
  const text = `*INSCRIPCIÓN Y COMPROMISO - INSTITUTO BÍBLICO IBEM*
--------------------------------------------------
*Yo:* ${data.nombre} ${data.apellido}
*Cédula:* ${data.cedula}
*Nacido(a) el:* ${data.fechaNacimiento}
*Edad:* ${data.edad}
*Miembro de la Iglesia:* ${data.iglesia}
*Ubicada en:* ${data.iglesiaUbicacion}
*Pastor(a):* ${data.pastor}
*Teléfono del Pastor:* ${data.pastorTelefono}
*Curso que inicia el:* ${data.fechaInicio}
*Mi Teléfono:* ${data.celular}
*Teléfono de Hermano:* ${data.celularHermano}
*Fecha de Inscripción:* ${data.fechaInscripcion}

*Materias inscritas para el 1er Trimestre:*
- NB01: Introducción a la Teología (2 Horas)
- NB02: Lenguaje y Comunicación I (4 Horas)
- NB03: Hermenéutica I (6 Horas)
- TS01: Bibliología (8 Horas)
- TS02: Teología Propia (Dios y su Revelación) (8 Horas)
*Total:* 28 Horas

*DOCUMENTOS COMPROMETIDOS A ADJUNTAR:*
- Copia de Documento de Identidad
- Una Foto Tipo Carnet
- Copia del Título de Bachiller o Constancia de Grado de Instrucción

_Solicito formalmente mi inscripción. Adjunto mi planilla PDF de preinscripción._`;

  return `https://wa.me/584166735964?text=${encodeURIComponent(text)}`;
}
