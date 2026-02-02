/**
 * Composable pour les utilitaires liés aux stades de la plante
 * Extrait de profile.vue pour une réutilisation dans profile, progress, etc.
 */

export type PlantStage =
  | "Graine"
  | "Pousse"
  | "Jeune plante"
  | "Plante"
  | "Plante florissante"
  | "Arbre majestueux";

export function usePlantStage() {
  /**
   * Retourne le nom du stade de la plante basé sur le streak
   */
  function getStageName(streak: number): PlantStage {
    if (streak === 0) return "Graine";
    if (streak <= 3) return "Pousse";
    if (streak <= 7) return "Jeune plante";
    if (streak <= 14) return "Plante";
    if (streak <= 30) return "Plante florissante";
    return "Arbre majestueux";
  }

  /**
   * Retourne les classes CSS pour le dégradé de bordure selon le streak
   */
  function getBorderGradient(streak: number): string {
    if (streak === 0) return "from-amber-700 to-amber-900";
    if (streak <= 3) return "from-lime-400 to-green-500";
    if (streak <= 7) return "from-green-500 to-emerald-600";
    if (streak <= 14) return "from-emerald-500 to-teal-600";
    if (streak <= 30) return "from-teal-500 to-green-600";
    return "from-green-500 to-teal-500";
  }

  /**
   * Retourne les classes CSS pour le badge du stade
   */
  function getBadgeClasses(streak: number): string {
    if (streak === 0) return "bg-amber-100 text-amber-800";
    if (streak <= 3) return "bg-lime-100 text-lime-800";
    if (streak <= 7) return "bg-green-100 text-green-800";
    if (streak <= 14) return "bg-emerald-100 text-emerald-800";
    if (streak <= 30) return "bg-teal-100 text-teal-800";
    return "bg-green-100 text-green-800";
  }

  /**
   * Retourne les couleurs primaires pour le stade actuel
   */
  function getStageColors(streak: number): {
    primary: string;
    secondary: string;
  } {
    if (streak === 0) return { primary: "amber-700", secondary: "amber-900" };
    if (streak <= 3) return { primary: "lime-500", secondary: "green-500" };
    if (streak <= 7) return { primary: "green-500", secondary: "emerald-600" };
    if (streak <= 14) return { primary: "emerald-500", secondary: "teal-600" };
    if (streak <= 30) return { primary: "teal-500", secondary: "green-600" };
    return { primary: "green-500", secondary: "teal-500" };
  }

  /**
   * Calcule la progression vers le prochain stade (0-100)
   */
  function getProgressToNextStage(streak: number): number {
    if (streak === 0) return 0;
    if (streak <= 3) return Math.round((streak / 3) * 100);
    if (streak <= 7) return Math.round(((streak - 3) / 4) * 100);
    if (streak <= 14) return Math.round(((streak - 7) / 7) * 100);
    if (streak <= 30) return Math.round(((streak - 14) / 16) * 100);
    return 100;
  }

  return {
    getStageName,
    getBorderGradient,
    getBadgeClasses,
    getStageColors,
    getProgressToNextStage,
  };
}
