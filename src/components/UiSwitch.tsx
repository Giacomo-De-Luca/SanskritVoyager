import { Switch, useMantineTheme, rem } from '@mantine/core';
import { IconEyeCheck, IconEyeClosed} from '@tabler/icons-react';

export function UiSwitch({ onToggle: onToggle }: { onToggle: () => void }) {
  const theme = useMantineTheme();

  const checkIcon = (
    <IconEyeCheck
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
      color={theme.colors.yellow[4]}
    />
  );

  const closedIcon = (
    <IconEyeClosed
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
      color={theme.colors.blue[6]}
    />
  );

  return <Switch size="md" color="dark.1" onLabel={checkIcon} offLabel={closedIcon} onChange={onToggle}  visibleFrom="m"/>;
}
