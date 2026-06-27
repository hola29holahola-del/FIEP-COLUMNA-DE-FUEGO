import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Lock, Mail, LogOut, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";

interface AdminLoginProps {
  onSuccess?: () => void;
  isAdminLoggedIn: boolean;
  currentUserEmail: string | null;
}

export default function AdminLogin({ onSuccess, isAdminLoggedIn, currentUserEmail }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Ingrese correo y contraseña.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      const userEmail = user.email?.toLowerCase().trim() || "";

      // Whitelist check
      const defaultWhitelist = ["richard29cal@gmail.com"];
      let allowedAdminEmails = [...defaultWhitelist];
      
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../firebase");
        const configSnap = await getDoc(doc(db, "configuracion", "global"));
        if (configSnap.exists()) {
          const data = configSnap.data();
          if (data && data.allowedAdminEmails && Array.isArray(data.allowedAdminEmails)) {
            const dbEmails = data.allowedAdminEmails.map((e: string) => e.toLowerCase().trim());
            allowedAdminEmails = Array.from(new Set([...allowedAdminEmails, ...dbEmails]));
          }
        }
      } catch (dbErr) {
        console.warn("Could not check whitelist from Firestore, falling back to local list:", dbErr);
      }

      if (!allowedAdminEmails.includes(userEmail)) {
        await signOut(auth);
        setErrorMsg("Acceso denegado: Su dirección de correo no se encuentra registrada en la lista de administradores autorizados en Firebase.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Inicio de sesión administrativo autorizado.");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found") {
        setErrorMsg("El correo ingresado no pertenece a ningún administrador registrado.");
      } else if (err.code === "auth/wrong-password") {
        setErrorMsg("Contraseña incorrecta.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("La contraseña debe tener un mínimo de 6 caracteres.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Este correo ya está registrado como administrador.");
      } else {
        setErrorMsg("Error de autenticación: " + (err.message || "Credenciales incorrectas"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setSuccessMsg("Sesión administrativa cerrada correctamente.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isAdminLoggedIn) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 max-w-md mx-auto text-center animate-fadeIn">
        <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full mb-4">
          <Sparkles className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold font-display text-slate-900 leading-none mb-1">Sesión Administrativa Activa</h3>
        <p className="text-xs font-mono text-blue-600 font-semibold mb-6">{currentUserEmail}</p>

        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-6 text-sm text-slate-600 text-left space-y-2 leading-relaxed">
          <div className="flex gap-2 items-center text-slate-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Herramientas del Editor Activadas:</span>
          </div>
          <p className="text-xs">
            Ahora puede editar textos directamente en la página de bienvenida, cambiar los iconos de cada bloque principal o subir fotos de miembros y logos institucionales directamente desde los apartados correspondientes.
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4" /> Cerrar Sesión Administrador
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden max-w-md mx-auto animate-fadeIn">
      {/* Header bar */}
      <div className="bg-slate-900 text-white px-8 py-6 text-center border-b border-slate-800">
        <div className="inline-flex p-3 bg-slate-800 rounded-full mb-3 text-amber-400 border border-slate-700">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold font-display tracking-tight">Consola Administrativa FIEP</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Acceso exclusivo para el personal de administración</p>
      </div>

      <form onSubmit={handleLogin} className="p-8 space-y-4">
        {errorMsg && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl text-rose-800 flex items-start gap-2 text-xs font-semibold">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl text-emerald-850 text-xs font-semibold">
            <div>{successMsg}</div>
          </div>
        )}

        <div>
          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Correo del Administrador</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@columnadefuego.org"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Iniciar Sesión</span>
            </>
          )}
        </button>

        <div className="pt-4 border-t border-slate-100 text-center">
          <span className="text-xs text-slate-500 font-medium leading-relaxed block">
            Acceso restringido. Los administradores son autorizados manualmente mediante el panel central de autenticación de Firebase.
          </span>
        </div>
      </form>
    </div>
  );
}
