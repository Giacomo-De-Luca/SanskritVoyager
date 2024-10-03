import { MultiSelect } from '@mantine/core';

export function DictionarySelector() {
  return (
    <MultiSelect
      label="Dictionary"
      description="Select dictionaries"
      placeholder="Default dictionary is Monier-Williams"
      data={[
        {
          group: 'Sanskrit-English',
          items: [
            { value: 'MW', label: 'Monier-Williams' },
            { value: 'AP', label: 'Apte' }
          ]
        },
        {
          group: 'Sanskrit-Sanskrit',
          items: [
            { value: 'express', label: 'Express Dictionary' },
            { value: 'django', label: 'Django Dictionary' }
          ]
        },
        {
          group: 'English-Sanskrit',
          items: [
            { value: 'again', label: 'again' },
            { value: 'atest', label: 'A test' }
          ]
        }
      ]}
    />
  );
}