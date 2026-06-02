"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { supabase } from "@/lib/supabase";
import { buscarEnOpenFoodFacts, ProductoOFF } from "@/lib/openFoodFacts";

type Estado =
  | "iniciando"
  | "escaneando"
  | "buscando"
  | "buscandoEnOFF"
  | "encontradoEnOFF"
  | "error"
  | "no-encontrado";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const procesandoRef = useRef(false);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [mensaje, setMensaje] = useState<string>("");
  const [codigoLeido, setCodigoLeido] = useState<string>("");
  const [productoOFF, setProductoOFF] = useState<ProductoOFF | null>(null);

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
            if (procesandoRef.current) return;

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

            if (data) {
              // Encontrado en inventario: ir directo al item
              controlsRef.current?.stop();
              router.push(`/inventario/${data.id}`);
              return;
            }

            // No está en inventario → buscar en Open Food Facts
            setEstado("buscandoEnOFF");
            const producto = await buscarEnOpenFoodFacts(codigo);

            if (cancelado) return;

            controlsRef.current?.stop();

            if (producto) {
              setProductoOFF(producto);
              setEstado("encontradoEnOFF");
            } else {
              setEstado("no-encontrado");
            }
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
  }, [router]);

  function reintentar() {
    window.location.reload();
  }

  function urlCrearItem(): string {
    const params = new URLSearchParams();
    params.set("codigo", codigoLeido);
    if (productoOFF) {
      params.set("nombre", productoOFF.nombre);
      if (productoOFF.categoria) params.set("categoria", productoOFF.categoria);
      if (productoOFF.imagenUrl) params.set("imagen", productoOFF.imagenUrl);
    }
    return `/inventario/nuevo?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Barra superior */}
      <div className="flex items-center justify-between p-4 text-white">
        <Link href="/inventario" className="text-sm hover:opacity-80 transition-opacity">
          ← Cancelar
        </Link>
        <p className="text-sm font-medium">📷 Escanear código</p>
        <div className="w-16" />
      </div>

      {/* Vídeo + overlay */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

        {(estado === "iniciando" || estado === "escaneando") && (
          <div className="relative z-10 w-72 h-44 border-4 border-white/80 rounded-2xl shadow-2xl">
            <div className="absolute -inset-1 border-2 border-blue-400/60 rounded-2xl animate-pulse" />
          </div>
        )}
      </div>

      {/* Pie de estado */}
      <div className="p-6 text-center text-white bg-black/70 min-h-[200px] flex flex-col items-center justify-center gap-3">
        {estado === "iniciando" && <p>Activando cámara...</p>}

        {estado === "escaneando" && (
          <p className="text-sm opacity-80">Apunta al código de barras del item</p>
        )}

        {estado === "buscando" && (
          <>
            <p className="font-medium">🔎 Buscando en tu inventario...</p>
            <p className="text-xs opacity-70 font-mono">{codigoLeido}</p>
          </>
        )}

        {estado === "buscandoEnOFF" && (
          <>
            <p className="font-medium">🌍 No está en tu inventario.</p>
            <p className="text-sm opacity-80">Buscando en Open Food Facts...</p>
            <p className="text-xs opacity-70 font-mono">{codigoLeido}</p>
          </>
        )}

        {estado === "encontradoEnOFF" && productoOFF && (
          <>
            <p className="text-emerald-300 font-medium">✅ Producto reconocido</p>
            {productoOFF.imagenUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={productoOFF.imagenUrl}
                alt={productoOFF.nombre}
                className="w-20 h-20 object-contain rounded-lg bg-white/10 mb-1"
              />
            )}
            <p className="font-medium">{productoOFF.nombre}</p>
            {productoOFF.categoria && (
              <p className="text-xs opacity-70">{productoOFF.categoria}</p>
            )}
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              <button
                onClick={reintentar}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl"
              >
                Escanear otro
              </button>
              <Link
                href={urlCrearItem()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl"
              >
                ➕ Añadir a inventario
              </Link>
            </div>
          </>
        )}

        {estado === "no-encontrado" && (
          <>
            <p className="text-amber-300 font-medium">⚠️ Código no registrado</p>
            <p className="text-xs opacity-70 font-mono">{codigoLeido}</p>
            <p className="text-xs opacity-60">No se encontró en Open Food Facts</p>
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
                ➕ Crear item manual
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