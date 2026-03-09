/**
 * Compresse et redimensionne une image côté client avant upload.
 * Utilise le Canvas API pour convertir en JPEG compressé.
 */
export function useImageCompress() {
  /**
   * Compresse une image File.
   * @param file - Le fichier image original
   * @param maxWidth - Largeur max en px (default: 512)
   * @param maxHeight - Hauteur max en px (default: 512)
   * @param quality - Qualité JPEG entre 0 et 1 (default: 0.8)
   * @returns Un nouveau File compressé en JPEG
   */
  async function compressImage(
    file: File,
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.8,
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // Calcul des nouvelles dimensions en gardant le ratio
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Dessin sur canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible de créer le contexte canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Conversion en blob JPEG compressé
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Échec de la compression"));
              return;
            }
            const compressed = new File(
              [blob],
              file.name.replace(/\.\w+$/, ".jpg"),
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              },
            );
            resolve(compressed);
          },
          "image/jpeg",
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Impossible de charger l'image"));
      };

      img.src = url;
    });
  }

  return { compressImage };
}
