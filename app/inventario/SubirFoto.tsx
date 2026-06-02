"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  fotoActualUrl: string | null;
  onCambiada: (nuevaUrl: string | null) => void;
};

export default function SubirFoto({ fotoActualUrl, onCambiada }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSubiendo(true);

    // Generar nombre único
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const nombreArchivo = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

    // Subir al bucket
    const { error: uploadError } = await supabase.storage
      .from("items")
      .upload(nombreArchivo, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setSubiendo(false);
      return;
    }

    // Obtener URL pública
    const { data } = supabase.storage.from("items").getPublicUrl(nombreArchivo);

    // Si había foto anterior, intentar borrarla
    if (fotoActualUrl) {
      await borrarFotoAnterior(fotoActualUrl);
    }

    onCambiada(data.publicUrl);
    setSubiendo(false);
  }

  async function borrarFotoAnterior(url: string) {
    try {
      const partes = url.split("/items/");
      if (partes.length < 2) return;
      const nombreArchivo = partes[1];
      await supabase.storage.from("items").remove([nombreArchivo]);
    } catch {
      // si falla no pasa nada
    }
  }

  async function quitarFoto() {
    if (fotoActualUrl) await borrarFotoAnterior(fotoActualUrl);
    onCambiada(null);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Foto
      </label>

      {fotoActualUrl ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoActualUrl}
            alt="Foto del item"
            className="w-32 h-32 object-cover rounded-xl border border-slate-300 dark:border-slate-600"
          />
          <button
            type="button"
            onClick={quitarFoto}
            disabled={subiendo}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-full shadow-md"
            title="Quitar foto"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="inline-flex items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={subiendo}
            className="hidden"
          />
          <div className="text-center text-slate-400">
            <div className="text-3xl mb-1">📷</div>
            <div className="text-xs">
              {subiendo ? "Subiendo..." : "Añadir foto"}
            </div>
          </div>
        </label>
      )}

      {error && (
        <p className="text-red-600 text-xs mt-2">Error: {error}</p>
      )}
    </div>
  );
}