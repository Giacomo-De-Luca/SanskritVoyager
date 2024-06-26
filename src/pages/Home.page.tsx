import { useState, useEffect } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea, Button, Loader } from '@mantine/core';
import { FileInput } from '@mantine/core';
import {  ComboboxItem, Container } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import WordDataComponent from '@/components/WordDataComponent';
import { fetchWordData, transliterateText, handleTranslate } from './Api';
import { HeaderSimple } from '@/components/HeaderSimple';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavbarSimple } from '@/components/NavbarSimple';
import { IconVocabularyOff } from '@tabler/icons-react';


interface Translation {
  English: string;
  Sanskrit: string;
}


export function HomePage() {

  const [text, setText] = useState('');
  const [value, setValue] = useState<ComboboxItem | null>({ value: 'IAST', label: 'IAST' });  
  const [textTranslit, setTextTranslit] = useState('');
  const [translatedText, setTranslatedText] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);


  const [selectedWord, setSelectedWord] = useState('');


  const handleTransliteration = async (inputText: string, newValue?: any) => {
    const selectedValue = newValue || value;
    const processedText = await transliterateText(inputText, selectedValue);
    setTextTranslit(processedText);
    console.log(processedText);
  };

  const updateTranslate = async (inputText: string) => {
    setLoading(true);
    const response = await handleTranslate(inputText);
    setTranslatedText(response.translation);
    setLoading(false);
  };

  
  const words = textTranslit ? textTranslit.split(/\s+|\\+/) : [];
  const lines = textTranslit ? textTranslit.split('\n') : [];
  const clickable_words = lines.map((line, lineIndex) => (
    <p key={lineIndex}>
      {line.split(/\s+|\+/).map((word, wordIndex) => {
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

  const [wordData, setWordData] = useState<any[][][]>([]);

  useEffect(() => {
    if (selectedWord) {
      fetchWordData(selectedWord).then(data => {
        setWordData(data);
        console.log(data);  // Log the data here
      });
    }
  }, [selectedWord]);


  return (
    <>
    <HeaderSearch />

    <div style={{ display: 'flex' }}>
    <div style={{ flex: '0 0 15%', minWidth: '300px' }}>
    <NavbarSimple>
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
        style={{ width: '100%', paddingTop: 50, paddingBottom: 16, }}
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
        style={{ width: '100%', paddingBottom: 16, }}
        autosize
        minRows={4}
        maxRows={6}
      />

      <Button 
      leftSection={<IconVocabularyOff size={14} />}
      onClick={() => updateTranslate(text)} 
      loading={loading} 
      loaderProps={{ type: 'dots' }}
      style={{
        width: '100%',
        backgroundColor: 'transparent',    
      }}      
      >
        {loading ? 'Loading...' : 'Translate'}
      </Button>

    </NavbarSimple>
    </div>

    <div style={{ flex: '1 1 80%' }}>
      <Grid  gutter="lg" style={{ }}>
        <Grid.Col span={6} style={{ marginTop: '100px', paddingLeft: '200px', paddingRight: '50px' , overflow: 'auto',  whiteSpace: 'normal' }}>
          <div>{clickable_words}</div>         
          <div>
          {translatedText.length > 0 &&translatedText.map((item, index) => (
            <div key={index}>
              <p style={{ color: 'darkgrey' }}>
                {item.Sanskrit.split(/\s+|\+/).map((word, wordIndex) => {
                  const trimmedWord = word.trim();
                  return (
                    <span
                      key={wordIndex}
                      onClick={() => setSelectedWord(trimmedWord)}
                      style={{ color: selectedWord === trimmedWord ? 'orange' : 'inherit' }}
                    >
                      {word + ' '}
                    </span>
                  );
                })}
              </p>
              <p> {item.English}</p>
            </div>
          ))}
          </div>

        </Grid.Col>
  
        <Grid.Col span={6} style={{ marginTop: '100px', maxHeight: '100vh', paddingLeft: '50px', paddingRight: '80px', overflowY: 'auto' }}>
             <WordDataComponent wordData={wordData} setWordData={setWordData}/>
        </Grid.Col>
      </Grid>
    </div>
    </div>
    </>
  );
}

