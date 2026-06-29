import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { IglesiaUsuario } from "../types";

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

// Draw a beautiful FIEP credential card on a specific page position
export async function drawCredentialOnPage(doc: jsPDF, user: IglesiaUsuario, qrDataUrl: string, startX: number, startY: number) {
  const w = 140; // width of card
  const h = 85;  // height of card

  // 1. Draw outer shadow/border of card
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(1.5);
  doc.roundedRect(startX, startY, w, h, 4, 4, "FD");

  // Inside border
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.6);
  doc.roundedRect(startX + 2, startY + 2, w - 4, h - 4, 3, 3, "S");

  // Header banner background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(startX + 2.5, startY + 2.5, w - 5, 20, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("FEDERACIÓN DE IGLESIAS EVANGÉLICAS DE PENTECOSTÉS", startX + w / 2, startY + 7.5, { align: "center" });

  doc.setFontSize(11);
  doc.text("FIEP - COLUMNA DE FUEGO", startX + w / 2, startY + 13.5, { align: "center" });

  // Accent line
  doc.setDrawColor(234, 179, 8); // yellow-500
  doc.setLineWidth(0.8);
  doc.line(startX + 10, startY + 16, startX + w - 10, startY + 16);

  // Credential title text
  doc.setTextColor(234, 179, 8); // yellow-500
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CREDENCIAL OFICIAL DE AFILIACIÓN", startX + w / 2, startY + 20, { align: "center" });

  // Reset colors
  doc.setTextColor(15, 23, 42);

  // 2. Avatar Photo Placeholder (left column)
  const photoX = startX + 7;
  const photoY = startY + 27;
  const photoW = 26;
  const photoH = 32;

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setLineWidth(0.3);
  doc.rect(photoX, photoY, photoW, photoH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("FOTO", photoX + photoW / 2, photoY + 14, { align: "center" });
  doc.text("REGISTRADA", photoX + photoW / 2, photoY + 18, { align: "center" });

  // Mini decorative ribbon for Status under photo
  doc.setFillColor(240, 253, 244); // light green bg
  doc.roundedRect(photoX, photoY + photoH + 2.5, photoW, 5.5, 1, 1, "F");
  doc.setDrawColor(74, 222, 128); // green border
  doc.setLineWidth(0.2);
  doc.roundedRect(photoX, photoY + photoH + 2.5, photoW, 5.5, 1, 1, "S");
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52); // deep green text
  doc.text("ACTIVO", photoX + photoW / 2, photoY + photoH + 6.5, { align: "center" });

  // 3. User information (middle column)
  const infoX = startX + 38;
  const infoY = startY + 29;
  const lineGap = 4.8;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("AFILIADO:", infoX, infoY);
  doc.setFont("helvetica", "normal");
  const fullNombre = `${(user.nombres || "").toUpperCase()} ${(user.apellidos || "").toUpperCase()}`;
  const truncatedNombre = fullNombre.length > 25 ? fullNombre.substring(0, 25) + "..." : fullNombre;
  doc.text(truncatedNombre, infoX + 18, infoY);

  doc.setFont("helvetica", "bold");
  doc.text("CÉDULA:", infoX, infoY + lineGap);
  doc.setFont("helvetica", "normal");
  doc.text(`${user.cedula || "No especificada"}`, infoX + 18, infoY + lineGap);

  // Department Label formatting
  let deptLabel = "MEMBRESÍA";
  let deptColor = [59, 130, 246]; // blue
  if (user.departamento === "pastores" || user.departamento === "gremio") {
    deptLabel = "GREMIO PASTORAL";
    deptColor = [22, 163, 74]; // green (to align with the pastores green theme)
  } else if (user.departamento === "evangelismo") {
    deptLabel = "EVANGELISMO Y MISIONES";
    deptColor = [147, 51, 234]; // purple
  }

  doc.setFont("helvetica", "bold");
  doc.text("SECCIÓN:", infoX, infoY + lineGap * 2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(deptColor[0], deptColor[1], deptColor[2]);
  doc.text(deptLabel, infoX + 18, infoY + lineGap * 2);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("MINISTERIO:", infoX, infoY + lineGap * 3);
  doc.setFont("helvetica", "normal");
  const minText = user.ministerio || user.rol || "Miembro Coadyuvante";
  const truncatedMin = minText.length > 25 ? minText.substring(0, 25) + "..." : minText;
  doc.text(truncatedMin, infoX + 20, infoY + lineGap * 3);

  doc.setFont("helvetica", "bold");
  doc.text("ZONA FIEP:", infoX, infoY + lineGap * 4);
  doc.setFont("helvetica", "normal");
  doc.text(`${user.zona || "General"}`, infoX + 20, infoY + lineGap * 4);

  doc.setFont("helvetica", "bold");
  doc.text("CONGREGACIÓN:", infoX, infoY + lineGap * 5);
  doc.setFont("helvetica", "normal");
  const iglesiaText = user.iglesia || "FIEP Central";
  const truncatedIglesia = iglesiaText.length > 25 ? iglesiaText.substring(0, 25) + "..." : iglesiaText;
  doc.text(truncatedIglesia, infoX + 27, infoY + lineGap * 5);

  // 4. QR Code & Verification (right column)
  const qrX = startX + 110;
  const qrY = startY + 28;
  const qrSize = 23;

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    // Draw fine border around QR code
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, "S");
  }

  // QR Caption
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.text("ESCANEAR", qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });
  doc.text("VERIFICACIÓN DIGITAL", qrX + qrSize / 2, qrY + qrSize + 6.5, { align: "center" });

  // 5. Signature and seal watermark
  doc.setFont("helvetica", "italic");
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Sello Digital FIEP Columna de Fuego 2026", startX + w / 2, startY + h - 5, { align: "center" });

  // Security Verification notice in footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(148, 163, 184);
  doc.text("La falsificación de esta credencial constituye delito civil y eclesial.", startX + w / 2, startY + h - 2, { align: "center" });
}

// Downloads a single beautiful landscape credential PDF
export async function downloadCredentialPDF(user: IglesiaUsuario) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const profileLink = `${window.location.origin}/ver-miembro/${user.id}`;
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(profileLink, {
      width: 250,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    });
  } catch (err) {
    console.error("Error generating QR", err);
  }

  // Draw credential nicely centered on the A4 portrait page
  // A4 portrait width is 210mm, height is 297mm
  // Card width is 140mm, height is 85mm
  const startX = (210 - 140) / 2; // 35mm
  const startY = (297 - 85) / 2;  // 106mm

  // Draw a guide title at the top of the printout page
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("CREDENCIAL DE AFILIACIÓN MINISTERIAL", 105, 45, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text("FIEP Columna de Fuego • Formato Oficial de Impresión", 105, 52, { align: "center" });

  // Draw the credential card
  await drawCredentialOnPage(doc, user, qrDataUrl, startX, startY);

  // Instructions at the bottom
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(20, 220, 190, 220);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("INSTRUCCIONES DE USO E IMPRESIÓN:", 20, 228);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("1. Imprima este documento en cartulina opalina blanca, papel fotográfico o material de PVC de alta calidad.", 22, 234);
  doc.text("2. Recorte por la línea de borde gris exterior (140mm x 85mm).", 22, 239);
  doc.text("3. Platifique (lamine) la credencial para protegerla contra el desgaste y prolongar su durabilidad.", 22, 244);
  doc.text("4. El código QR permite la validación inmediata del estatus activo del afiliado mediante cualquier celular inteligente.", 22, 249);

  // Save the document
  const fileName = `Credencial_FIEP_${(user.nombres || "afiliado").replace(/\s+/g, "_")}_${(user.apellidos || "general").replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}

// Downloads a single multi-page PDF document containing credentials for all selected users
export async function downloadAllCredentialsPDF(users: IglesiaUsuario[]) {
  if (!users || users.length === 0) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  for (let i = 0; i < users.length; i++) {
    if (i > 0) {
      doc.addPage();
    }
    const user = users[i];
    const profileLink = `${window.location.origin}/ver-miembro/${user.id}`;
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(profileLink, {
        width: 250,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
    } catch (err) {
      console.error("Error generating QR for " + user.id, err);
    }

    const startX = (210 - 140) / 2; // 35mm
    const startY = (297 - 85) / 2;  // 106mm

    // Header label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("CREDENCIAL DE AFILIACIÓN MINISTERIAL", 105, 45, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Afiliado ${i + 1} de ${users.length} • FIEP Columna de Fuego`, 105, 52, { align: "center" });

    // Draw card
    await drawCredentialOnPage(doc, user, qrDataUrl, startX, startY);

    // Instructions
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(20, 220, 190, 220);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("INSTRUCCIONES DE USO E IMPRESIÓN:", 20, 228);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("1. Imprima este lote en cartulina opalina blanca, papel fotográfico o material de PVC.", 22, 234);
    doc.text("2. Recorte por la línea de borde exterior de cada credencial.", 22, 239);
    doc.text("3. El código QR impreso verificará en tiempo real el estatus del afiliado frente a la base de datos de la FIEP.", 22, 244);
  }

  doc.save(`Lote_Credenciales_FIEP_${users.length}_Afiliados.pdf`);
}
