// localStorageColorSchemeManager.ts
import {
  isMantineColorScheme,
  MantineColorScheme,
  MantineColorSchemeManager,
} from '@mantine/core';

export interface LocalStorageColorSchemeManagerOptions {
  key?: string;
  defaultScheme?: MantineColorScheme;
}

export function localStorageColorSchemeManager({
  key = 'mantine-color-scheme',
  defaultScheme = 'light',
}: LocalStorageColorSchemeManagerOptions = {}): MantineColorSchemeManager {
  // We store the event handler to properly clean it up later
  let storageHandler: ((event: StorageEvent) => void) | null = null;
  
  // Helper to safely get system preference
  const getSystemPreference = (): MantineColorScheme => {
    if (typeof window === 'undefined') return defaultScheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  return {
    get: (defaultValue) => {
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      try {
        const stored = window.localStorage.getItem(key);
        // If no value is stored, get system preference
        if (!stored) {
          const systemPreference = getSystemPreference();
          window.localStorage.setItem(key, systemPreference);
          return systemPreference;
        }
        // Return stored value if valid, otherwise default
        return isMantineColorScheme(stored) ? stored : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    set: (value) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        console.warn(
          '[@mantine/core] Local storage color scheme manager was unable to save color scheme.',
          error
        );
      }
    },

    subscribe: (onUpdate) => {
      if (typeof window === 'undefined') return;

      storageHandler = (event) => {
        if (event.storageArea === window.localStorage && 
            event.key === key && 
            isMantineColorScheme(event.newValue)) {
          onUpdate(event.newValue);
        }
      };

      window.addEventListener('storage', storageHandler);
      
      // Handle system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only update if using system preference (no stored value)
        if (!window.localStorage.getItem(key)) {
          const newScheme = e.matches ? 'dark' : 'light';
          onUpdate(newScheme);
        }
      });
    },

    unsubscribe: () => {
      if (typeof window === 'undefined') return;
      
      if (storageHandler) {
        window.removeEventListener('storage', storageHandler);
        storageHandler = null;
      }
    },

    clear: () => {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
    }
  };
}