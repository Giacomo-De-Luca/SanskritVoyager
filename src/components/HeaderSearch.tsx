import { Autocomplete, Group, Burger, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import classes from './HeaderSearch.module.css';
import { ActionToggle } from './ColorSchemeToggle/ColorSchemeToggle';
import { UiSwitch } from './UiSwitch';
export { UiSwitch } from './UiSwitch';

const links = [
  { link: '/documentation', label: 'Documentation' },
  { link: '/about', label: 'About' },
];

export function HeaderSearch({ onToggleNavbar, onSearch, isNavbarVisible  }: { onSearch: (query: string) => void, onToggleNavbar: () => void, isNavbarVisible: boolean }) {
  const [opened, { toggle }] = useDisclosure(isNavbarVisible);

  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      className={classes.link}
      onClick={(event) => event.preventDefault()}
    >
      {link.label}
    </a>
  ));

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
        <Burger opened={opened} onClick={() => { toggle(); onToggleNavbar(); }} size="sm" hiddenFrom="sm" />
          <ActionToggle />
          <UiSwitch onToggle={onToggleNavbar} />
        </Group>

        <Group>
          <Group ml={50} gap={5} className={classes.links} visibleFrom="sm">
            {items}
          </Group>
          <Autocomplete
            className={classes.search}
            placeholder="Search"
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            data={['yoga', 'yogena', 'deva', 'pratiprasava']}
            //visibleFrom="xs"
            onChange={(value) => onSearch(value)}
            autoCapitalize="off"

          />
        </Group>
      </div>
    </header>
  );
}