"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { supabase } from "@/lib/supabase";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [estado, setEstado] = useState<"iniciando" | "escaneando" | "buscando" | "error" | "no-encontrado">("iniciando");
  const [mensaje, setMensaje] = useState<string>("");
  const [ultimoCodigo, setUltimoCodigo] = useState<string>("");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelado = false;

    async function iniciar() {
      try {
        // Pedir cámara trasera preferentemente
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
            },
          },
          videoRef.current!,
          async (result) => {
            if (!result || cancelado) return;
            const codigo = result.getText();
            if (codigo === ultimoCodigo) return; // evitar lecturas duplicadas
            setUltimoCodigo(codigo);
            setEstado("buscando");

            // Vibrar el móvil si soporta
            if (navigator.vibrate) navigator.vibrate(100);

            // Buscar en Supabase
            const { data, error } = await supabase
              .from("items")
              .select("id")
              .eq("codigo_barras", codigo)
              .maybeSingle();

            if (cancelado) return;

            if (error) {
              setMensaje("Error al buscar: " + error.message);
              setEstado("error");
              return;
            }

            if (!data) {
              setMensaje(codigo);
              setEstado("no-encontrado");
              return;
            }

            // Encontrado: parar cámara y navegar
            controlsRef.current?.stop();
            router.push(`/inventario/${data.id}`);
          }
        );
        controlsRef.current = controls;
        if (!cancelado) setEstado("escaneando");
      } catch (err) {
        if (cancelado) return;
        setMensaje(
          "No se pudo acceder a la cámara. Asegúrate de dar permisos al navegador."
        );
        setEstado("error");
        console.error(err);
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      controlsRef.current?.stop();
    };
  }, [router, ultimoCodigo]);

  function reintentar() {
    setUltimoCodigo("");
    setEstado("escaneando");
    setMensaje("");
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Barra superior */}
      <div className="flex items-center justify-between p-4 text-white">
        <Link
          href="/inventario"
          className="text-sm hover:opacity-80 transition-opacity"
        >
          ← Cancelar
        </Link>
        <p className="text-sm font-medium">📷 Escanear código</p>
        <div className="w-16" />
      </div>

      {/* Vídeo + overlay */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Marco visual */}
        <div className="relative z-10 w-72 h-44 border-4 border-white/80 rounded-2xl shadow-2xl">
          <div className="absolute -inset-1 border-2 border-blue-400/60 rounded-2xl animate-pulse" />
        </div>
      </div>

      {/* Pie de estado */}
      <div className="p-6 text-center text-white bg-black/60 min-h-[140px] flex flex-col items-center justify-center gap-3">
        {estado === "iniciando" && <p>Activando cámara...</p>}
        {estado === "escaneando" && (
          <p className="text-sm opacity-80">
            Apunta al código de barras del item
          </p>
        )}
        {estado === "buscando" && <p>Buscando en tu inventario...</p>}
        {estado === "no-encontrado" && (
          <>
            <p className="text-amber-300 font-medium">
              ⚠️ Código no registrado
            </p>
            <p className="text-xs opacity-70 font-mono">{mensaje}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={reintentar}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl"
              >
                Escanear otro
              </button>
              <Link
                href={`/inventario/nuevo?codigo=${encodeURIComponent(mensaje)}`}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl"
              >
                Crear item con este código
              </Link>
            </div>
          </>
        )}
        {estado === "error" && (
          <>
            <p className="text-red-400 font-medium">❌ {mensaje}</p>
            <button
              onClick={reintentar}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl"
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </main>
  );
}