import { createTheme, rem, virtualColor } from '@mantine/core';

import './Optima/Optima.css';

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
  },
  
  headings: { fontFamily: 'OptimaTest, serif' },


  /** Put your mantine theme override here */
});
