// The Minimal implementation of the UI contract (src/ui/contract.ts). Everything that imports MUI,
// Emotion or minimal-shared lives in this folder; the rest of the app imports "@/ui" only.
import type { UiTemplate } from '@/ui/contract';

import * as components from './components';

// A component missing from ./components, or one whose props differ from the contract, fails the
// type check on this line.
export const minimalTemplate = components satisfies UiTemplate;

export * from './components';
