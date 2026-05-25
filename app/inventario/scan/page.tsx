"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { supabase } from "@/lib/supabase";

type Estado = "iniciando" | "escaneando" | "buscando" | "error" | "no-encontrado";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const procesandoRef = useRef(false); // bloquea lecturas mientras procesa una
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [mensaje, setMensaje] = useState<string>("");
  const [codigoLeido, setCodigoLeido] = useState<string>("");

  // Iniciar la cámara SOLO una vez al montar
  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelado = false;

    async function iniciar() {
      try {
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
            },
          },
          videoRef.current!,
          async (result) => {
            if (!result || cancelado) return;
            if (procesandoRef.current) return; // ya estamos procesando otra lectura

            const codigo = result.getText();
            procesandoRef.current = true;

            if (navigator.vibrate) navigator.vibrate(100);

            setCodigoLeido(codigo);
            setEstado("buscando");

            const { data, error } = await supabase
              .from("items")
              .select("id")
              .eq("codigo_barras", codigo)
              .maybeSingle();

            if (cancelado) return;

            if (error) {
              setMensaje(error.message);
              setEstado("error");
              procesandoRef.current = false;
              return;
            }

            if (!data) {
              setEstado("no-encontrado");
              // Paramos la cámara para liberarla; reintentar volverá a montar la página
              controlsRef.current?.stop();
              return;
            }

            // Encontrado: paramos cámara y navegamos al item
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
  }, [router]); // <-- SIN ultimoCodigo; solo se monta una vez

  function reintentar() {
    // Recarga la página entera para reiniciar la cámara limpiamente
    window.location.reload();
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
        {(estado === "iniciando" || estado === "escaneando") && (
          <div className="relative z-10 w-72 h-44 border-4 border-white/80 rounded-2xl shadow-2xl">
            <div className="absolute -inset-1 border-2 border-blue-400/60 rounded-2xl animate-pulse" />
          </div>
        )}
      </div>

      {/* Pie de estado */}
      <div className="p-6 text-center text-white bg-black/70 min-h-[180px] flex flex-col items-center justify-center gap-3">
        {estado === "iniciando" && <p>Activando cámara...</p>}

        {estado === "escaneando" && (
          <p className="text-sm opacity-80">
            Apunta al código de barras del item
          </p>
        )}

        {estado === "buscando" && (
          <>
            <p className="font-medium">🔎 Buscando en tu inventario...</p>
            <p className="text-xs opacity-70 font-mono">{codigoLeido}</p>
          </>
        )}

        {estado === "no-encontrado" && (
          <>
            <p className="text-amber-300 font-medium">
              ⚠️ Código no registrado
            </p>
            <p className="text-xs opacity-70 font-mono">{codigoLeido}</p>
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              <button
                onClick={reintentar}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl"
              >
                Escanear otro
              </button>
              <Link
                href={`/inventario/nuevo?codigo=${encodeURIComponent(codigoLeido)}`}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl"
              >
                ➕ Crear item con este código
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