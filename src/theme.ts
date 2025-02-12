import { createTheme, rem, virtualColor } from '@mantine/core';

import './Optima/Optima.css';
import './LinuxBiolinum/LinuxBiolinum.css';
import './LibertinusSans/LibertinusSans.css';

export const theme = createTheme({


  fontFamily: 'Palatino, serif',


  fontSizes: {
    xs: rem(11),
    sm: rem(12),
    //default is 14
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
  },
  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.6',
    lg: '1.6',
    xl: '1.65',
  },
  colors: {
    primary: virtualColor({
      name: 'primary',
      dark: 'pink',
      light: 'cyan',
    }),

  lightscale: [

          '#ffffff', // white
          '#fefdfc', // 0: lightest
          '#f8f8f7',
          '#f5f4ee',
          '#f3f3f0', // 4: your main color
          '#f0eee5',
          '#e2e0d3',
          '#eeece2',
          '#dd8c71',
          '#c05f3b', // 9: darkest
    ],
    palette: [

      '#2c5282', // blue
      '#ac3e3e', // red
      '#008080', // teal
      '#f5f4ee',
      '#f3f3f0', // 4: your main color
      '#f0eee5',// used
      '#4C8EE0', // lighter blue1
      '#91B0D7', // lighter blue2
      '#D6E9FF',  // lightest blue
      '#c05f3b', // 9: darkest
  ],
      
  },

  
  
  headings: { fontFamily: 'LibertinusSans, sans serif' },


  /** Put your mantine theme override here */
});
