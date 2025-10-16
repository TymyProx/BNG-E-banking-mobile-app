/**
 * BNG Guinée - Palette de couleurs moderne et élégante
 * Inspirée du logo BNG avec un équilibre entre verts naturels et or
 */

// Couleurs primaires BNG - Or et verts équilibrés
const bngGold = "#FFD700" // Or principal du logo
const bngGoldLight = "#FFF8DC" // Or très clair
const bngGoldDark = "#B8860B" // Or foncé
const bngGreen = "#2D7A4F" // Vert du logo BNG
const bngGreenLight = "#32CD32" // Vert clair
const bngGreenDark = "#006400" // Vert foncé

// Couleurs secondaires - Tons chauds et naturels
const warmGold = "#F4A460" // Or sable chaud
const forestGreen = "#228B22" // Vert forêt
const emeraldGreen = "#50C878" // Vert émeraude
const darkGreen = "#013220" // Vert très foncé

// Couleurs neutres modernes
const slate50 = "#F8FAFC"
const slate100 = "#F1F5F9"
const slate200 = "#E2E8F0"
const slate300 = "#CBD5E1"
const slate400 = "#94A3B8"
const slate500 = "#64748B"
const slate600 = "#475569"
const slate700 = "#334155"
const slate800 = "#1E293B"
const slate900 = "#0F172A"

// Couleurs d'état modernes
const emerald = "#10B981" // Vert succès moderne
const emeraldLight = "#34D399"
const emeraldDark = "#059669"
const rose = "#F43F5E" // Rouge erreur moderne
const roseLight = "#FB7185"
const roseDark = "#E11D48"
const amber = "#F59E0B" // Ambre warning
const amberLight = "#FCD34D"
const amberDark = "#D97706"

const tintColorLight = "#FFD700" // Or comme couleur principale
const tintColorDark = "#FFF8DC"

export const Colors = {
  light: {
    // Textes
    text: slate900,
    textSecondary: slate600,
    textTertiary: slate500,

    // Arrière-plans - Principalement gris clair
    background: "#FAFAFA", // Gris très clair
    backgroundSecondary: slate100, // Gris clair
    surface: "#FFFFFF",
    surfaceSecondary: slate50,

    // Couleurs principales BNG - Vert mais utilisé avec parcimonie
    primary: bngGreen, // Vert comme couleur principale
    primaryLight: bngGreenLight,
    primaryDark: bngGreenDark,
    primaryBackground: `${bngGreen}08`, // Très léger

    // Couleurs secondaires - Gris neutre dominant
    secondary: slate400, // Gris comme couleur secondaire
    secondaryLight: slate300,
    secondaryDark: slate500,
    secondaryBackground: `${slate400}08`,

    // Couleurs d'accent - Jaune/Or avec parcimonie
    accent: bngGold, // Jaune pour les accents
    accentLight: bngGoldLight,
    accentBackground: `${bngGold}08`,

    // Couleurs d'état
    success: emerald,
    successLight: emeraldLight,
    successDark: emeraldDark,
    successBackground: `${emerald}08`,

    error: rose,
    errorLight: roseLight,
    errorDark: roseDark,
    errorBackground: `${rose}08`,

    warning: amber,
    warningLight: amberLight,
    warningDark: amberDark,
    warningBackground: `${amber}08`,

    // Interface - Gris clair dominant
    border: slate200,
    borderLight: slate100,
    borderDark: slate300,

    // Cartes et composants - Gris clair
    cardBackground: "#FFFFFF",
    cardShadow: "rgba(0, 0, 0, 0.04)", // Ombre très subtile
    card: "#FFFFFF",

    // Navigation - Gris avec vert pour sélection
    tabIconDefault: slate400,
    tabIconSelected: bngGreen, // Vert pour la sélection

    // Icônes - Principalement grises
    icon: slate500,
    iconActive: bngGreen, // Vert pour les icônes actives
    iconSecondary: slate400,

    // Gradients subtils - Gris dominant avec touches de vert
    gradientPrimary: `linear-gradient(135deg, ${bngGreen} 0%, ${bngGreenDark} 100%)`,
    gradientSecondary: `linear-gradient(135deg, ${slate100} 0%, ${slate200} 100%)`,
    gradientAccent: `linear-gradient(135deg, ${bngGold} 0%, ${warmGold} 100%)`,
    gradientNeutral: `linear-gradient(135deg, ${slate50} 0%, ${slate100} 100%)`,

    // Couleurs spécifiques BNG
    bngPrimary: bngGreen, // Vert comme couleur principale
    bngSecondary: slate400, // Gris comme couleur secondaire
    bngAccent: bngGold, // Jaune comme accent
    bngNeutral: slate500,

    // Nouvelles couleurs
    tint: bngGreen, // Vert pour le tint
    inputBackground: slate50, // Fond gris très clair
    shadow: slate300,
    gradient: {
      primary: [bngGreen, bngGreenDark],
      secondary: [slate100, slate200],
      accent: [bngGold, warmGold],
      card: [slate50, slate100],
    },
  },

  dark: {
    // Textes
    text: slate100,
    textSecondary: slate400,
    textTertiary: slate500,

    // Arrière-plans - Gris foncé
    background: slate900,
    backgroundSecondary: slate800,
    surface: slate800,
    surfaceSecondary: slate700,

    // Couleurs principales BNG - Vert mais utilisé avec parcimonie
    primary: bngGreenLight, // Vert clair pour le dark mode
    primaryLight: "#90EE90",
    primaryDark: bngGreen,
    primaryBackground: `${bngGreenLight}10`,

    // Couleurs secondaires - Gris neutre dominant
    secondary: slate500, // Gris comme couleur secondaire
    secondaryLight: slate400,
    secondaryDark: slate600,
    secondaryBackground: `${slate500}10`,

    // Couleurs d'accent - Jaune/Or avec parcimonie
    accent: bngGoldLight, // Jaune clair pour les accents
    accentLight: "#FFFACD",
    accentBackground: `${bngGoldLight}10`,

    // Couleurs d'état
    success: emeraldLight,
    successLight: "#6EE7B7",
    successDark: emerald,
    successBackground: `${emeraldLight}10`,

    error: roseLight,
    errorLight: "#FDA4AF",
    errorDark: rose,
    errorBackground: `${roseLight}10`,

    warning: amberLight,
    warningLight: "#FEF3C7",
    warningDark: amber,
    warningBackground: `${amberLight}10`,

    // Interface - Gris foncé
    border: slate700,
    borderLight: slate600,
    borderDark: slate800,

    // Cartes et composants - Gris foncé
    cardBackground: slate800,
    cardShadow: "rgba(0, 0, 0, 0.25)",

    // Navigation - Gris avec vert pour sélection
    tabIconDefault: slate500,
    tabIconSelected: bngGreenLight, // Vert clair pour la sélection

    // Icônes - Principalement grises
    icon: slate400,
    iconActive: bngGreenLight, // Vert clair pour les icônes actives
    iconSecondary: slate500,

    // Gradients subtils - Gris dominant avec touches de vert
    gradientPrimary: `linear-gradient(135deg, ${bngGreenLight} 0%, ${bngGreen} 100%)`,
    gradientSecondary: `linear-gradient(135deg, ${slate700} 0%, ${slate600} 100%)`,
    gradientAccent: `linear-gradient(135deg, ${bngGoldLight} 0%, ${warmGold} 100%)`,
    gradientNeutral: `linear-gradient(135deg, ${slate800} 0%, ${slate700} 100%)`,

    // Couleurs spécifiques BNG
    bngPrimary: bngGreenLight, // Vert clair comme couleur principale
    bngSecondary: slate500, // Gris comme couleur secondaire
    bngAccent: bngGoldLight, // Jaune clair comme accent
    bngNeutral: slate400,

    // Nouvelles couleurs
    tint: bngGreenLight, // Vert clair pour le tint
    inputBackground: slate800, // Fond gris foncé
    shadow: slate900,
    gradient: {
      primary: [bngGreenLight, bngGreen],
      secondary: [slate700, slate800],
      accent: [bngGoldLight, warmGold],
      card: [slate800, slate900],
    },
  },
}

// Export des couleurs pour usage direct
export const ModernColors = {
  // Couleurs principales BNG - Or en premier
  bngGold,
  bngGoldLight,
  bngGoldDark,
  bngGreen,
  bngGreenLight,
  bngGreenDark,

  // Couleurs secondaires
  warmGold,
  forestGreen,
  emeraldGreen,
  darkGreen,

  // Couleurs neutres
  slate: {
    50: slate50,
    100: slate100,
    200: slate200,
    300: slate300,
    400: slate400,
    500: slate500,
    600: slate600,
    700: slate700,
    800: slate800,
    900: slate900,
  },

  // Couleurs d'état
  emerald,
  emeraldLight,
  emeraldDark,
  rose,
  roseLight,
  roseDark,
  amber,
  amberLight,
  amberDark,
}
