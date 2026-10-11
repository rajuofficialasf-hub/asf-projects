import type { Theme, Direction, CommonColors, ThemeProviderProps } from '@mui/material/styles';
import type { ThemeCssVariables } from './types';
import type { PaletteColorKey, PaletteColorNoChannels } from './core/palette';

import { tokens } from '@/ui/tokens';

// ----------------------------------------------------------------------

export type ThemeConfig = {
  direction: Direction;
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  defaultMode: ThemeProviderProps<Theme>['defaultMode'];
  modeStorageKey: ThemeProviderProps<Theme>['modeStorageKey'];
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<PaletteColorKey, PaletteColorNoChannels> & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: {
      [K in 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 as `${K}`]: string;
    };
  };
};

// Colours and fonts come from the app's theme tokens (src/ui/tokens.ts), the only theme surface
// pages see.
export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  defaultMode: 'light',
  modeStorageKey: 'theme-mode',
  direction: 'ltr',
  classesPrefix: 'minimal',
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: tokens.typography.fontFamily,
    secondary: tokens.typography.headingFontFamily,
  },
  /** **************************************
   * Palette
   *************************************** */
  palette: {
    primary: tokens.colors.primary,
    secondary: tokens.colors.secondary,
    info: tokens.colors.info,
    success: tokens.colors.success,
    warning: tokens.colors.warning,
    error: tokens.colors.error,
    grey: tokens.colors.neutral,
    common: {
      black: '#000000',
      white: '#FFFFFF',
    },
  },
};
