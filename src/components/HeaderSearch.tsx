import { Autocomplete, ActionIcon, Group, Burger, rem, OptionsFilter, ComboboxItem, Image, useMantineColorScheme, Tooltip } from '@mantine/core';
import { useDisclosure, useDebouncedState } from '@mantine/hooks';
import { IconSearch, IconListSearch } from '@tabler/icons-react';
import classes from './HeaderSearch.module.css';
import { ActionToggle } from './ColorSchemeToggle/ColorSchemeToggle';
import { UiSwitch } from './UiSwitch';
export { UiSwitch } from './UiSwitch';
import React, { useState, useEffect, useRef } from 'react';
import faviconlight from '../faviconlight.svg';
import favicondark from '../favicondark.svg';
import Logo from './logo'
import SearchToggle from './AdvancedSearchToggle';



const removeDiacritics = (str: string | null) => {
  if (str === null) {
    return '';
  }
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const optionsFilter: OptionsFilter = ({ options, search }) => {
  const normalizedSearch = removeDiacritics(search.toLowerCase().trim());
  return (options as ComboboxItem[]).filter((option) => {
    const normalizedValue = removeDiacritics(option.value.toLowerCase().trim());
    return normalizedValue.includes(normalizedSearch);
  });
};


const links = [
  { link: '/docs/', label: 'Documentation' },
  { link: '/docs/about', label: 'About' },
];

export function HeaderSearch({ onToggleNavbar, onSearch, isNavbarVisible, isMobile, handleAdvancedSearch  }: { onSearch: (query: string) => void, onToggleNavbar: () => void, isNavbarVisible: boolean, isMobile: boolean | undefined,
  handleAdvancedSearch: {
    open: () => void;
    close: () => void;
    toggle: () => void;
  }
 }) {
  const [opened, { toggle }] = useDisclosure(isNavbarVisible);
  const [entries, setEntries] = useState([]);
  const [filteredData, setFilteredData] = useState<string[]>([]);
  const [value, setValue] = useDebouncedState('', 600);
  const { colorScheme } = useMantineColorScheme();
  const [decomposedWordList, setDecomposedWordList] = useState<{ value: string, label: string }[]>([]);

  



  useEffect(() => {
    // Fetch the JSON data
    fetch('/resources/MWKeysOnly.json')
      .then((response) => response.json())
      .then((data) => {
        setEntries(data);
        const no_diacritics = data.map((entry: string) => ({
          value: removeDiacritics(entry),
          label: entry,
        }));
        setDecomposedWordList(no_diacritics);
        
        console.log('First 10 entries:', data.slice(0, 10));
      })
      .catch((error) => console.error('Error fetching JSON data:', error));
  }, []);

  
  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      className={classes.link}
      // onClick={(event) => event.preventDefault()}
    >
      {link.label}
    </a>
  ));

  useEffect(() => {
    onSearch(value);
  }, [value, onSearch]);

  const inputRef = useRef<HTMLInputElement>(null);


  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && isNavbarVisible && isMobile || event.keyCode === 13 && isNavbarVisible && isMobile) {
      setTimeout(() => {
        onToggleNavbar();
        if (inputRef.current) {
          inputRef.current.blur(); // Blur the input field
        }
      }, 400); // Adjust the delay time (in milliseconds) as needed
    }
  };

  const selectEntries = (value: string ) => {
    let selectedEntries = decomposedWordList.filter(entry => entry.value === value);

      // If no entries are found and value contains "sh", replace "sh" with "s" and filter again
    if (selectedEntries.length === 0 && value.includes('sh')) {
      const modifiedValue = value.replace(/sh/g, 's');
      selectedEntries = decomposedWordList.filter(entry => entry.value === modifiedValue);
    }

    const originalValue = selectedEntries.length > 0 ? selectedEntries.map(entry => entry.label).join(' | ') : value;
    setValue(originalValue); // Directly update the parent state with the concatenated original values
    console.log('Selected nondecomposedquery:', originalValue); // Debugging statement
  };

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
  
        <Group>
          

          <Burger 
            opened={isNavbarVisible} 
            onClick={() => { toggle(); onToggleNavbar(); }} 
            size={isMobile ? "sm" : "md" } 
            classNames={{ 
                          root: classes.burgerRoot,
                          burger: classes.burgerBurger,
             }}
            />


          <Tooltip label="Open documentation" position="bottom">
            <a 
              href="/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                textDecoration: 'none',
                display: 'flex',         // Add this
                alignItems: 'center',    // Add this
                height: '100%',          // Add this for consistent height 
                lineHeight: 0,           // Remove any line-height issues
                padding: 0               // Remove any default padding
              }}
            >
              <Logo className={classes.logoSanskrit} />
            </a>
          </Tooltip>

          <ActionToggle />
          <SearchToggle
          handleAdvancedSearch={handleAdvancedSearch}
          isMobile={isMobile}
          />



                  
          </Group>

        <Group grow preventGrowOverflow={false} wrap="nowrap" className={classes.groupContainer}>
          <Group grow preventGrowOverflow={false} wrap="nowrap" gap={5} className={classes.links} visibleFrom="sm">
            {items}
          </Group>
          <Autocomplete
            className={classes.search}
            placeholder="Search Sanskrit words."
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
            data={entries}
            onChange={selectEntries}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false} 
            limit={50}
            withScrollArea={true}
            styles={{ dropdown: { maxHeight: 200, overflowY: 'auto' } }}
            onKeyDown={handleKeyDown} // Add the onKeyDown event handler


          />
        </Group>
      </div>
    </header>
  );
}