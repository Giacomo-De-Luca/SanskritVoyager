import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';
import { localStorageColorSchemeManager } from './localStorageColorSchemeManager';
import { Analytics } from "@vercel/analytics/react";


const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

export default function App() {
  return (
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
    >
      <Router />
      <Analytics />

    </MantineProvider>
  );
}