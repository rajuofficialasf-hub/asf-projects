import '../global.css';

import type { UiProviderProps } from '@/ui/contract';

import { useEffect } from 'react';

import { themeConfig, ThemeProvider } from '../theme';
import { ToastProvider } from './toast';
import { MotionLazy } from './animate/motion-lazy';
import { defaultSettings, SettingsProvider } from './settings';

import GlobalStyles from '@mui/material/GlobalStyles';

// ----------------------------------------------------------------------

// The theme marks <html> with its direction and colour scheme. Leaving the admin must give the public
// pages <html> as it was, so the marks the page had before any provider mounted are read once, and the
// rest are taken off when the last provider unmounts. A language switch remounts the provider (the old
// one's cleanup runs before the new one's effects), which this survives.
let pageMarks: { dir: boolean; scheme: boolean } | null = null;
let mountedProviders = 0;

function useHtmlMarksCleanup() {
  pageMarks ??= {
    dir: document.documentElement.hasAttribute('dir'),
    scheme: document.documentElement.hasAttribute('data-color-scheme'),
  };
  useEffect(() => {
    mountedProviders += 1;
    return () => {
      mountedProviders -= 1;
      if (mountedProviders > 0 || !pageMarks) return;
      const html = document.documentElement;
      if (!pageMarks.dir) html.removeAttribute('dir');
      if (!pageMarks.scheme) html.removeAttribute('data-color-scheme');
    };
  }, []);
}

/**
 * The element baselines the starter put in global.css. They live here so Emotion removes them when the
 * provider unmounts and they never reach pages outside it.
 */
const baseline = (
  <GlobalStyles
    styles={{
      // The layouts fill the window (the sign-in split, the dashboard's sidebar).
      // A stable gutter keeps the layout from shifting sideways between short and long pages.
      html: { height: '100%', scrollbarGutter: 'stable' },
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
  useHtmlMarksCleanup();

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
