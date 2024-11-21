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
            { value: 'mw', label: '	Monier-Williams Sanskrit-English Dictionary' },
            { value: 'ap90', label: 'Apte Practical Sanskrit-English Dictionary' }
          ]
        },
        {
          group: 'Sanskrit-German',
          items: [
            { value: 'gra', label: 'Grassmann Wörterbuch zum Rig Veda' },

          ]
        },
        {
          group: 'Specialized Dictionaries',
          items: [
            { value: 'bhs', label: 'Edgerton Buddhist Hybrid Sanskrit Dictionary' },

          ]
        },
        
      ]}
      value={selectedDictionaries} // Bind the parent state
      onChange={handleChange} // Update state on change
    />
  );
};

export default DictionarySelectComponent;