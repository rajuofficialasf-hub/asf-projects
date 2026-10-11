// ----------------------------------------------------------------------

import logoUrl from '@/assets/asf-logo.svg';

export type ConfigValue = {
  appName: string;
  /** The foundation's logo, the same file the public header shows. */
  logoUrl: string;
  /** Where the logo links: the start page of the screens this template draws. */
  homePath: string;
  appVersion: string;
  assetsDir: string;
};

// ----------------------------------------------------------------------

export const CONFIG: ConfigValue = {
  appName: 'আস-সুন্নাহ ফাউন্ডেশন',
  logoUrl,
  homePath: '/admin',
  appVersion: '0.16.0',
  assetsDir: '',
};
