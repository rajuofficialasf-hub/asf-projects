import '../global.css';

import type { UiProviderProps } from '@/ui/contract';

import { themeConfig, ThemeProvider } from '../theme';
import { ToastProvider } from './toast';
import { MotionLazy } from './animate/motion-lazy';
import { defaultSettings, SettingsProvider } from './settings';

import GlobalStyles from '@mui/material/GlobalStyles';

// ----------------------------------------------------------------------

/**
 * The element baselines the starter put in global.css. They live here so Emotion removes them when the
 * provider unmounts and they never reach pages outside it.
 */
const baseline = (
  <GlobalStyles
    styles={{
      'input[type=number]': { MozAppearance: 'textfield', appearance: 'none' },
      'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
        margin: 0,
        WebkitAppearance: 'none',
      },
    }}
  />
);

/**
 * The starter's app.tsx providers, without its auth provider and progress bar. One light theme and
 * no settings drawer, so the settings stay at their defaults.
 */
export function UiProvider({ children }: UiProviderProps) {
  return (
    <SettingsProvider defaultSettings={defaultSettings}>
      <ThemeProvider
        modeStorageKey={themeConfig.modeStorageKey}
        defaultMode={themeConfig.defaultMode}
      >
        <MotionLazy>
          <ToastProvider>
            {baseline}
            {children}
          </ToastProvider>
        </MotionLazy>
      </ThemeProvider>
    </SettingsProvider>
  );
}
