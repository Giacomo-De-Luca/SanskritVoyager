import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';
import { localStorageColorSchemeManager } from './localStorageColorSchemeManager';


const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});



export default function App() {
  return (
    <>
    
    <script  />
      
      <MantineProvider
        theme={theme}
        colorSchemeManager={colorSchemeManager}
        
      >
      <Router />
    </MantineProvider>
    </>
  );
}
