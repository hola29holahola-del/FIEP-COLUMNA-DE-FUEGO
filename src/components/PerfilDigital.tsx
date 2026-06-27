import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { IglesiaUsuario } from "../types";
import Logo from "./Logo";
import { Award, ShieldAlert, Calendar, MapPin, CheckCircle2, RefreshCw } from "lucide-react";

interface PerfilDigitalProps {
  userId: string;
}

export default function PerfilDigital({ userId }: PerfilDigitalProps) {
  const [member, setMember] = useState<IglesiaUsuario | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMember() {
      if (!userId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        // Prioritize loading custom logo
        try {
          const configDoc = await getDoc(doc(db, "configuracion", "global"));
          if (configDoc.exists()) {
            const data = configDoc.data();
            setLogoUrl(data.logoBase64 || data.logoUrl || "");
          }
        } catch (logoErr) {
          console.warn("Could not load custom logo:", logoErr);
        }

        // Query multiple collections to locate the registered member
        const collectionsToTry = ["usuarios", "gremio", "evangelismo", "miembros_generales"];
        let dataFound = null;
        let foundSnap = null;
        
        for (const colName of collectionsToTry) {
          try {
            const docSnap = await getDoc(doc(db, colName, userId));
            if (docSnap.exists()) {
              dataFound = docSnap.data();
              foundSnap = docSnap;
              break;
            }
          } catch (colErr) {
            console.warn(`Could not read from ${colName}:`, colErr);
          }
        }

        if (foundSnap && dataFound) {
          const data = dataFound;
          setMember({
            id: foundSnap.id,
            nombres: data.nombres || "",
            apellidos: data.apellidos || "",
            cedula: data.cedula || "",
            edad: data.edad || "",
            iglesia: data.iglesia || "",
            zona: data.zona || "",
            ministerio: data.ministerio || "",
            photoUrl: data.photoUrl || "",
            departamento: data.departamento || "general",
            status: data.status || "activo",
            createdAt: data.createdAt,
            pastor: data.pastor || "",
            ciudad: data.ciudad || "",
            pueblo: data.pueblo || "",
            caserio: data.caserio || "",
          } as IglesiaUsuario);
        } else {
          setErrorMsg("ID de credencial no encontrado en el registro nacional de la federación.");
        }
      } catch (error) {
        console.error(error);
        setErrorMsg("Error al conectar con la base de datos de credenciales FIEP.");
        // Capture under our strict handler for diagnostic logs
        try {
          handleFirestoreError(error, OperationType.GET, `usuarios/${userId}`);
        } catch (e) {
          // Prevent fatal crash in render
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMember();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Validando autenticidad en el Servidor FIEP...</p>
      </div>
    );
  }

  if (errorMsg || !member) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-rose-100 shadow-xl text-center">
        <div className="inline-flex p-4 bg-rose-50 rounded-full text-rose-600 mb-4 animate-bounce">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Credencial Incorriente o Inexistente</h3>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          {errorMsg || "La credencial solicitada no existe o ha sido dada de baja del sistema central."}
        </p>
        <button
          onClick={() => { window.location.href = window.location.origin; }}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm transition-all"
        >
          Volver al Inicio Catedral
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-6 px-4 animate-fadeIn">
      {/* Credential Card Container */}
      <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl transition-all duration-300 hover:shadow-blue-900/10 hover:border-blue-200">
        
        {/* Certificate Watermark in Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <Logo url={logoUrl} className="h-96 w-96" loading={loading} />
        </div>

        {/* Dynamic Color Badge Header bar */}
        <div className="h-4 bg-gradient-to-r from-blue-700 via-red-600 to-amber-500 w-full" />

        {/* Card Header */}
        <div className="p-6 pb-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo url={logoUrl} className="h-14 w-14" loading={loading} />
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-wider font-display leading-tight">
                FEDERACIÓN F.I.E.P.
              </h2>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
                Columna de Fuego
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-full tracking-wider py-1 border border-emerald-200 shadow-sm animate-pulse">
              <CheckCircle2 className="h-3 w-3" />
              Verificado
            </span>
          </div>
        </div>

        {/* Card Body with Photo & Meta */}
        <div className="p-6 flex flex-col items-center">
          {/* Main Portrait Frame with authentic golden/blue border */}
          <div className="relative group mb-5">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-500 to-blue-600 opacity-60 blur-sm group-hover:opacity-80 transition duration-300" />
            <div className="relative h-48 w-48 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={`${member.nombres} ${member.apellidos}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Award className="h-12 w-12 stroke-1" />
                  <span className="text-[10px] font-mono mt-1">Sin Foto</span>
                </div>
              )}
            </div>
          </div>

          {/* Member Name */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-950 font-display tracking-tight leading-none mb-1">
              {member.nombres} {member.apellidos}
            </h1>
            <p className="text-xs font-semibold tracking-wider text-blue-600 uppercase font-mono mt-1.5">
              {member.ministerio}
            </p>
            <div className="inline-block mt-3 px-6 py-1 bg-blue-600 text-white font-display text-sm tracking-widest font-bold uppercase rounded-lg shadow-md border border-blue-700">
              MINISTERIO ACTIVO
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="w-full bg-slate-50/80 rounded-2xl p-5 border border-slate-100 space-y-4 text-sm">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
              <span className="text-slate-500 text-xs font-medium">Nombre Completo:</span>
              <span className="text-slate-900 font-bold text-right">{member.nombres} {member.apellidos}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
              <span className="text-slate-500 text-xs font-medium">Cédula:</span>
              <span className="text-slate-900 font-mono font-bold tracking-wide">{member.cedula}</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
              <span className="text-slate-500 text-xs font-medium">Lugar de congregación:</span>
              <span className="text-slate-900 font-semibold text-right">{member.iglesia}</span>
            </div>

            {member.pastor && (
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-500 text-xs font-medium">Pastor:</span>
                <span className="text-slate-900 font-semibold text-right">{member.pastor}</span>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
              <span className="text-slate-500 text-xs font-medium">Zona / Distrito:</span>
              <span className="text-slate-900 font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {member.zona || "General"}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
              <span className="text-slate-500 text-xs font-medium">Edad:</span>
              <span className="text-slate-900 font-semibold">{member.edad ? `${member.edad} años` : "N/C"}</span>
            </div>

            {member.ciudad && (
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-500 text-xs font-medium">Estado:</span>
                <span className="text-slate-900 font-semibold">{member.ciudad}</span>
              </div>
            )}

            {member.pueblo && (
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-500 text-xs font-medium">Pueblo / Barrio:</span>
                <span className="text-slate-900 font-semibold">{member.pueblo}</span>
              </div>
            )}

            {member.caserio && (
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                <span className="text-slate-500 text-xs font-medium">Caserío:</span>
                <span className="text-slate-900 font-semibold">{member.caserio}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-xs font-medium">Departamento:</span>
              <span className="text-slate-900 font-semibold capitalize text-xs text-right">
                {member.departamento === 'evangelismo' ? 'Departamento de Evangelismo y Misiones' : member.departamento === 'pastores' ? 'Gremio Pastoral' : 'Miembros de la Federación'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer with verification stamp & QR watermark decoration */}
        <div className="px-6 py-4 bg-slate-950 text-white flex justify-between items-center text-[10px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400">Credencial Oficial FIEP</span>
            <span className="text-amber-500 font-mono">Registro: #{member.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div className="font-mono text-slate-400 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-red-500" />
            Válida de por Vida ({new Date().getFullYear()})
          </div>
        </div>
      </div>

      {/* Auxiliary Help Info */}
      <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
        Esta credencial digital cuenta con validez legal según las actas constitucionales del concilio general "FIEP Columna de Fuego".
      </p>
    </div>
  );
}
