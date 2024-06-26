import { useState, useEffect } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea } from '@mantine/core';
import { FileInput } from '@mantine/core';
import {  ComboboxItem, Container } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import WordDataComponent from '@/components/worddataworkingwithprops';
import { fetchWordData, transliterateText } from './Api';


export function HomePage() {

  const [text, setText] = useState('');
  const [value, setValue] = useState<ComboboxItem | null>({ value: 'IAST', label: 'IAST' });  
  const [textTranslit, setTextTranslit] = useState('');

  const [selectedWord, setSelectedWord] = useState('');


  const handleTransliteration = async (inputText: string, newValue?: any) => {
    const selectedValue = newValue || value;
    const processedText = await transliterateText(inputText, selectedValue);
    setTextTranslit(processedText);
    console.log(processedText);
  };
  
  const words = textTranslit ? textTranslit.split(/\s+|\+/) : [];
  const lines = textTranslit ? textTranslit.split('\n') : [];
  const clickable_words = lines.map((line, lineIndex) => (
    <p key={lineIndex}>
      {line.split(/\s+/).map((word, wordIndex) => {
        const trimmedWord = word.trim();
        return (
          <span
            key={wordIndex}
            onClick={() => setSelectedWord(trimmedWord)}
            style={{ color: selectedWord === trimmedWord ? 'orange' : 'inherit' }}          >
            {word + ' '}
          </span>
        );
      })}
    </p>
  ));

  // If there is only one word, set it as the selected word
  useEffect(() => {
    if (words.length === 1) {
      setSelectedWord(words[0].trim());
    }
  }, [words]);

  const [wordData, setWordData] = useState<any[][]>([]);

  const wordDataObjects = wordData.map(entry => {

      if (entry.length === 3) {
        return {
          title: entry[0],
          title_constituent: entry[1],
          vocabularyEntries: entry[2],
        };
      } else if (entry.length === 7) {
        return {
          title: entry[0],
          title_constituent: entry[5],
          original_word: entry[4],
          description: entry[1],
          inflections: entry[2],
          inflection_wordsIAST: entry[3],
          vocabularyEntries: entry[6],
        };
      }
  });

  interface Entry {
    title: string;
    description: string;
    inflections: Inflection[];
    inflection_wordsIAST: string[];
    from: string;
    alternativeTitle: string;
    vocabularyEntries: string[];
  }

  useEffect(() => {
    if (selectedWord) {
      fetchWordData(selectedWord).then(data => {
        setWordData(data);
        console.log(data);  // Log the data here
      });
    }
  }, [selectedWord]);


  return (
    <Container size="lg" style={{ paddingTop: '20px' }}>
      <Grid gutter="lg">
        <Grid.Col span={2} style={{ position: 'absolute', left: 0 }}>
          <ActionToggle />
  
          <Select
            data={['IAST', 'DEVANAGARI', 'ITRANS', 'HK', 'SLP1', 'WX', 'Kolkata'].map((item) => ({ value: item, label: item }))}
            value={value ? value.value : 'IAST'}
            label="Select Translitteration Scheme"
            placeholder="Pick Translitteration Scheme, default is IAST"
            onChange={(_value, option) => 
              {
                setValue(option);
                console.log(option); 
                handleTransliteration(text, option);
              }}
            style={{ width: 400 }}
          />
  
          <Textarea 
            value={text}
            onChange={(event) => {
              const newText = event.currentTarget.value;
              setText(newText);
              handleTransliteration(newText);
            }}
            onPaste={(event) => {
              // Prevent the default paste action
              event.preventDefault();
  
              // Get the pasted data from the clipboard
              const pastedData = event.clipboardData.getData('text');
          
              // Update the text state and call transliterateText
              setText(pastedData);
              handleTransliteration(pastedData);
            }}
            label="Write Text Here"
            description="Copy and paste text here to transliterate it."
            placeholder="Write text here to transliterate it."
            style={{ width: 400 }}
            autosize
            minRows={2}
            maxRows={6}
          />
        </Grid.Col>
  
        <Grid.Col span={6} style={{ marginTop: '50px',  overflow: 'auto',  whiteSpace: 'normal' }}>
          <div>{clickable_words}</div>
        </Grid.Col>
        <Grid.Col span={6} style={{ maxHeight: '100vh', overflowY: 'auto' }}>
        {wordDataObjects.map((entry, index) => (
  entry.title && entry.title_constituent && entry.vocabularyEntries && (
    <WordDataComponent key={index} {...entry} />
  )
))}
        </Grid.Col>
      </Grid>
    </Container>
  );
}


