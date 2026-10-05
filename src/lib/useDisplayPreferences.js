import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'cr-conecta:preferencias-visual';

// El tamaño de texto usa rem y el atributo data-text-scale, sin ampliar el viewport.
export const TEXT_SCALES = [
  { id: 'S', value: 0.9 },
  { id: 'M', value: 1 },
  { id: 'L', value: 1.15 },
  { id: 'XL', value: 1.3 }
];

export const DEFAULT_TEXT_SCALE = 'M';

// Tipos de daltonismo soportados. Cada uno define la paleta que aplica al sitio.
export const COLOR_VISION_TYPES = [
  {
    id: 'deuteranopia',
    label: 'Deuteranopía',
    hint: 'No se distingue el verde. Es el tipo más común.',
    palette: {
      primary: '#0072b2',
      secondary: '#b36a00',
      success: '#00705c',
      warning: '#a35c00',
      danger: '#9b2335'
    }
  },
  {
    id: 'protanopia',
    label: 'Protanopía',
    hint: 'No se percibe el rojo, se ve más apagado.',
    palette: {
      primary: '#0076b8',
      secondary: '#c67b00',
      success: '#0a7b72',
      warning: '#b06a00',
      danger: '#8c1d2f'
    }
  },
  {
    id: 'tritanopia',
    label: 'Tritanopía',
    hint: 'No se percibe el azul, se ve verdoso.',
    palette: {
      primary: '#a8356a',
      secondary: '#b56400',
      success: '#2e7d32',
      warning: '#c2410c',
      danger: '#7a1fa2'
    }
  }
];

const DEFAULT_PREFERENCES = {
  theme: 'light',
  textScale: DEFAULT_TEXT_SCALE,
  colorVision: 'default',
  lastColorVision: 'deuteranopia'
};

function prefersDarkScheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function isKnownScale(value) {
  return TEXT_SCALES.some(scale => scale.id === value);
}

function isKnownVision(value) {
  return COLOR_VISION_TYPES.some(type => type.id === value);
}

function readPreferences() {
  let stored;
  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    stored = null;
  }

  const storedTheme = stored?.theme === 'dark' || stored?.theme === 'light' ? stored.theme : null;
  const storedVision = isKnownVision(stored?.colorVision) ? stored.colorVision : null;
  const storedLastVision = isKnownVision(stored?.lastColorVision) ? stored.lastColorVision : null;

  return {
    theme: storedTheme || (prefersDarkScheme() ? 'dark' : 'light'),
    textScale: isKnownScale(stored?.textScale) ? stored.textScale : DEFAULT_TEXT_SCALE,
    colorVision: storedVision || 'default',
    lastColorVision: storedLastVision || storedVision || DEFAULT_PREFERENCES.lastColorVision
  };
}

export function useDisplayPreferences() {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme;
    root.dataset.colorVision = preferences.colorVision;
    root.dataset.textScale = preferences.textScale;

    document.body.style.zoom = '';
    window.dispatchEvent(new CustomEvent('cr:display-preferences', { detail: preferences }));

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Navegación privada: la preferencia queda solo durante esta sesión.
    }
  }, [preferences]);

  useEffect(() => {
    const sync = event => setPreferences(current => JSON.stringify(current) === JSON.stringify(event.detail) ? current : event.detail);
    window.addEventListener('cr:display-preferences', sync);
    return () => window.removeEventListener('cr:display-preferences', sync);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferences(current => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const setTextScale = useCallback(textScale => {
    setPreferences(current => (current.textScale === textScale ? current : { ...current, textScale }));
  }, []);

  const toggleColorVision = useCallback(() => {
    setPreferences(current => (current.colorVision === 'default'
      ? { ...current, colorVision: current.lastColorVision }
      : { ...current, colorVision: 'default' }));
  }, []);

  const setColorVision = useCallback(colorVision => {
    setPreferences(current => (
      current.colorVision === colorVision
        ? current
        : { ...current, colorVision, lastColorVision: colorVision }
    ));
  }, []);

  return {
    ...preferences,
    isDark: preferences.theme === 'dark',
    isColorblind: preferences.colorVision !== 'default',
    toggleTheme,
    setTextScale,
    toggleColorVision,
    setColorVision
  };
}
