import '../global.css';

import type { UiProviderProps } from '@/ui/contract';

import { useState, useEffect } from 'react';

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
      // The layouts fill the window (the sign-in split, the dashboard's sidebar).
      html: { height: '100%' },
      'body, #root': { display: 'flex', flex: '1 1 auto', minHeight: '100%', flexDirection: 'column' },
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
  // The theme marks <html> with its direction and colour scheme; take the marks off on unmount so the
  // pages outside this provider see <html> as it was.
  // Read during the first render: the theme's effects run before this component's and add the marks.
  const [had] = useState(() => ({
    dir: document.documentElement.hasAttribute('dir'),
    scheme: document.documentElement.hasAttribute('data-color-scheme'),
  }));
  useEffect(() => {
    const html = document.documentElement;
    return () => {
      if (!had.dir) html.removeAttribute('dir');
      if (!had.scheme) html.removeAttribute('data-color-scheme');
    };
  }, [had]);

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
