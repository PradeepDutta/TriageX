export function applyPreferencesToDocument(preferences) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const appearance = preferences?.appearance || 'system';
  const systemDark = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = appearance === 'system'
    ? systemDark ? 'dark' : 'light'
    : appearance;
  root.dataset.appearance = appearance;
  root.dataset.fontSize = preferences?.fontSize || 'standard';
  root.dataset.contrast = preferences?.highContrast ? 'high' : 'standard';
  root.dataset.reducedMotion = preferences?.reducedMotion ? 'true' : 'false';
  window.dispatchEvent(new Event('triagex-theme-change'));
}
