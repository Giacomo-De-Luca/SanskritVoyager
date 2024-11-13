import { Autocomplete, Group, Burger, rem, OptionsFilter, ComboboxItem, Image, useMantineColorScheme } from '@mantine/core';
import { useDisclosure, useDebouncedState } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import classes from './HeaderSearch.module.css';
import { ActionToggle } from './ColorSchemeToggle/ColorSchemeToggle';
import { UiSwitch } from './UiSwitch';
export { UiSwitch } from './UiSwitch';
import React, { useState, useEffect } from 'react';
import faviconlight from '../faviconlight.svg';
import favicondark from '../favicondark.svg';


const links = [
  { link: '/documentation', label: 'Documentation' },
  { link: '/about', label: 'About' },
];

export function HeaderSearch({ onToggleNavbar, onSearch, isNavbarVisible  }: { onSearch: (query: string) => void, onToggleNavbar: () => void, isNavbarVisible: boolean }) {
  const [opened, { toggle }] = useDisclosure(isNavbarVisible);
  const [entries, setEntries] = useState([]);
  const [filteredData, setFilteredData] = useState<string[]>([]);
  const [value, setValue] = useDebouncedState('', 600);
  const { colorScheme } = useMantineColorScheme();



  useEffect(() => {
    // Fetch the JSON data
    fetch('/resources/MWKeysOnly.json')
      .then((response) => response.json())
      .then((data) => {
        setEntries(data);
        console.log('First 10 entries:', data.slice(0, 10));
      })    
  .catch((error) => console.error('Error fetching JSON data:', error));
  }, []);

  
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

  useEffect(() => {
    onSearch(value);
  }, [value, onSearch]);


  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <ActionToggle />
          <UiSwitch onToggle={onToggleNavbar} />
          <Image 
            src={colorScheme === 'dark' ? favicondark : faviconlight}
            alt="Logo" 
            width={30} 
            height={30} 
            className={classes.logo}
          />
          </Group>

        <Group>
          <Group grow preventGrowOverflow={false} wrap="nowrap" gap={5} className={classes.links} visibleFrom="sm">
            {items}
          </Group>
          <Autocomplete
            className={classes.search}
            placeholder="Search any word."
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            data={entries}
            //visibleFrom="xs"
            onChange={setValue}
            autoCapitalize="off"
            limit={50}
            withScrollArea={true}
            styles={{ dropdown: { maxHeight: 200, overflowY: 'auto' } }}

          />
        </Group>
      </div>
    </header>
  );
}