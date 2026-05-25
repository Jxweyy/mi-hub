// Genera un código único tipo MIHUB-A7K2M9X3
export function generarCodigoBarras(): string {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0, O, 1, I para evitar confusiones
  let codigo = "MIHUB-";
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}