import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';
import { localStorageColorSchemeManager } from './localStorageColorSchemeManager';


const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

const colorSchemeScript = `
  try {
    var colorScheme = localStorage.getItem('mantine-color-scheme');
    if (colorScheme) {
      document.documentElement.setAttribute('data-mantine-color-scheme', colorScheme);
    }
  } catch (e) {}
`;


export default function App() {
  return (
    <>
    
    <script dangerouslySetInnerHTML={{ __html: colorSchemeScript }} />
      
      <MantineProvider
        theme={theme}
        defaultColorScheme="light"
        colorSchemeManager={localStorageColorSchemeManager({
          key: 'mantine-color-scheme'

        })}
        
      >
      <Router />
    </MantineProvider>
    </>
  );
}
