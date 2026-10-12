// The app's theme tokens: colours, spacing, typography and radius. This is the only theme surface
// pages see; the UI template maps these values onto its own theme. Change the brand here, never in
// the template.
import type { ThemeTokens } from "./contract";

export const tokens = {
  colors: {
    // The site's brand green (src/index.css --color-brand-100/400/600/800/950).
    primary: { lighter: "#dcf2e4", light: "#57b681", main: "#227c4e", dark: "#1a4f35", darker: "#0a2418", contrastText: "#FFFFFF" },
    secondary: { lighter: "#EFD6FF", light: "#C684FF", main: "#8E33FF", dark: "#5119B7", darker: "#27097A", contrastText: "#FFFFFF" },
    info: { lighter: "#CAFDF5", light: "#61F3F3", main: "#00B8D9", dark: "#006C9C", darker: "#003768", contrastText: "#FFFFFF" },
    success: { lighter: "#D3FCD2", light: "#77ED8B", main: "#22C55E", dark: "#118D57", darker: "#065E49", contrastText: "#FFFFFF" },
    warning: { lighter: "#FFF5CC", light: "#FFD666", main: "#FFAB00", dark: "#B76E00", darker: "#7A4100", contrastText: "#1C252E" },
    error: { lighter: "#FFE9D5", light: "#FFAC82", main: "#FF5630", dark: "#B71D18", darker: "#7A0916", contrastText: "#FFFFFF" },
    neutral: {
      "50": "#FCFDFD",
      "100": "#F9FAFB",
      "200": "#F4F6F8",
      "300": "#DFE3E8",
      "400": "#C4CDD5",
      "500": "#919EAB",
      "600": "#637381",
      "700": "#454F5B",
      "800": "#1C252E",
      "900": "#141A21",
    },
  },
  spacing: 8,
  radius: { small: 6, medium: 8, large: 16 },
  typography: {
    // Loaded by index.html for the whole site; Noto Sans Bengali draws the Bengali letters.
    fontFamily: '"Ubuntu Sans", "Noto Sans Bengali", sans-serif',
    headingFontFamily: '"Ubuntu Sans", "Noto Sans Bengali", sans-serif',
    fontSize: 14,
  },
} satisfies ThemeTokens;
