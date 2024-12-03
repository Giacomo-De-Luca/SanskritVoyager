import '@mantine/core/styles.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';


export default function App() {
  return (
    <>
    <ColorSchemeScript />
    <MantineProvider theme={theme} 
    
    // defaultColorScheme="light"
    >
      <Router />
    </MantineProvider>
  );
  </>
  );
}
