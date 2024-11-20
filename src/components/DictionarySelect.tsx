import { MultiSelect } from '@mantine/core';
import { useState } from 'react';

interface DictionarySelectProps {
  selectedDictionaries: string[];
  setSelectedDictionaries: React.Dispatch<React.SetStateAction<string[]>>;
}

const DictionarySelectComponent = ({
  selectedDictionaries,
  setSelectedDictionaries,
}: DictionarySelectProps) => {
  const handleChange = (values: string[]) => {
    setSelectedDictionaries(values); // Directly update the parent state
    console.log(values)

  };

  return (
    <MultiSelect
      label="Dictionary"
      description="Select dictionaries"
      placeholder="Select dictionaries"
      data={[
        {
          group: 'Sanskrit-English',
          items: [
            { value: 'mw', label: 'Monier-Williams' },
            { value: 'ap90', label: 'Apte' }
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
      value={selectedDictionaries} // Bind the parent state
      onChange={handleChange} // Update state on change
    />
  );
};

export default DictionarySelectComponent;