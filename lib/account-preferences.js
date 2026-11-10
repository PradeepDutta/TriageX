export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', speechLocale: 'en-IN' },
  { code: 'hi', name: 'Hindi', speechLocale: 'hi-IN' },
  { code: 'od', name: 'Odia', speechLocale: 'or-IN' },
  { code: 'bn', name: 'Bengali', speechLocale: 'bn-IN' },
  { code: 'te', name: 'Telugu', speechLocale: 'te-IN' },
  { code: 'ta', name: 'Tamil', speechLocale: 'ta-IN' },
  { code: 'mr', name: 'Marathi', speechLocale: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', speechLocale: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', speechLocale: 'pa-IN' },
  { code: 'ur', name: 'Urdu', speechLocale: 'ur-IN' },
  { code: 'kn', name: 'Kannada', speechLocale: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', speechLocale: 'ml-IN' },
  { code: 'as', name: 'Assamese', speechLocale: 'as-IN' },
];

export const DEFAULT_PREFERENCES = {
  appearance: 'system',
  language: 'en',
  notifications: {
    healthReminders: false,
    appointmentUpdates: false,
    triageUpdates: true,
  },
  fontSize: 'standard',
  highContrast: false,
  reducedMotion: false,
  speechLanguage: 'en',
};

const isBoolean = (value) => typeof value === 'boolean';

export function validatePreferencePatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return { valid: false, error: 'Preferences must be sent as an object.' };
  }

  const allowedKeys = new Set(Object.keys(DEFAULT_PREFERENCES));
  if (Object.keys(patch).some((key) => !allowedKeys.has(key))) {
    return { valid: false, error: 'One or more preference fields are not supported.' };
  }

  const result = {};
  if ('appearance' in patch) {
    if (!['light', 'dark', 'system'].includes(patch.appearance)) {
      return { valid: false, error: 'Choose light, dark, or system appearance.' };
    }
    result.appearance = patch.appearance;
  }

  if ('language' in patch) {
    if (!SUPPORTED_LANGUAGES.some(({ code }) => code === patch.language)) {
      return { valid: false, error: 'Choose a supported language.' };
    }
    result.language = patch.language;
  }

  if ('speechLanguage' in patch) {
    if (!SUPPORTED_LANGUAGES.some(({ code }) => code === patch.speechLanguage)) {
      return { valid: false, error: 'Choose a supported voice input language.' };
    }
    result.speechLanguage = patch.speechLanguage;
  }

  if ('fontSize' in patch) {
    if (!['standard', 'large'].includes(patch.fontSize)) {
      return { valid: false, error: 'Choose standard or large text.' };
    }
    result.fontSize = patch.fontSize;
  }

  for (const key of ['highContrast', 'reducedMotion']) {
    if (key in patch) {
      if (!isBoolean(patch[key])) {
        return { valid: false, error: `${key} must be enabled or disabled.` };
      }
      result[key] = patch[key];
    }
  }

  if ('notifications' in patch) {
    const notifications = patch.notifications;
    const notificationKeys = Object.keys(DEFAULT_PREFERENCES.notifications);
    if (
      !notifications ||
      typeof notifications !== 'object' ||
      Array.isArray(notifications) ||
      Object.keys(notifications).some((key) => !notificationKeys.includes(key)) ||
      notificationKeys.some((key) => key in notifications && !isBoolean(notifications[key]))
    ) {
      return { valid: false, error: 'Notification preferences must be boolean options.' };
    }
    result.notifications = notifications;
  }

  return { valid: true, data: result };
}

export function normalizePreferences(row) {
  return {
    ...DEFAULT_PREFERENCES,
    ...row,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(row?.notifications || {}),
    },
  };
}
