import { Switch, useMantineTheme, rem } from '@mantine/core';
import { IconEyeCheck, IconEyeClosed, IconSquareRoundedLetterX, IconX, IconMenu2, IconMenuOrder, IconChevronCompactLeft, IconChevronLeft, IconChevronCompactRight} from '@tabler/icons-react';
import classes from './UiSwitch.module.css';
import { useMediaQuery } from '@mantine/hooks';

export function UiSwitch({ onToggle: onToggle }: { onToggle: () => void }) {
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 755px)');

  const checkIcon = (
    <IconChevronCompactRight
      className={classes.iconEyeCheck}
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
    />
  );

  const closedIcon = (
    <IconChevronCompactLeft
      className={classes.iconEyeClosed}
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
    />
  );

  return <Switch 
          size= {isMobile ? 'sm' : 'md'}
          className={classes.switchBox}
          onLabel={checkIcon} 
          offLabel={closedIcon} 
          onChange={onToggle} 
          color="grey"
          />;
}
