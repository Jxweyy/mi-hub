export type Item = {
  id: string;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  codigo_barras: string;
  categoria: string | null;
  imagen_url: string | null;
  creado_en: string;
  actualizado_en: string;
};