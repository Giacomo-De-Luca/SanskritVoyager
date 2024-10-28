import { useState, useEffect } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea, Button, Loader } from '@mantine/core';
import { FileInput } from '@mantine/core';
import {  ComboboxItem, Container } from '@mantine/core';
import { useDisclosure, useDebouncedState } from '@mantine/hooks';
import WordDataComponent from '@/components/WordDataComponent';
import { fetchWordData, transliterateText, handleTranslate } from './Api';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavbarSimple } from '@/components/NavbarSimple';
import { IconVocabularyOff } from '@tabler/icons-react';
import { IconClipboardCheck, IconCopy, IconClipboard} from '@tabler/icons-react';
import classes from './Home.module.css';
import { UiSwitch } from '@/components/HeaderSearch';
import { DictionarySelector } from '@/components/DictionarySelect';
import { ClickableBookWords } from '@/components/ClickableBookWords';

interface Translation {
  English: string;
  Sanskrit: string;
}

export function HomePage() {

  // input text into the textarea
  const [text, setText] = useState('');
  // output translitteration scheme
  const [value, setValue] = useState<ComboboxItem | null>({ value: 'IAST', label: 'IAST' });  
  // transliterated text
  const [textTranslit, setTextTranslit] = useDebouncedState('', 200);
  // translated text
  const [translatedText, setTranslatedText] = useState<Translation[]>([]);
  // loading state for the translation 
  const [loading, setLoading] = useState(false);
  // selected word to analyse
  const [ selectedWord, setSelectedWord] = useState('');
  // selected book title in the combobox
  const [ bookTitle, setBookTitle ] = useState<ComboboxItem | null>({ value: '', label: '' });
  // retrieved book text
  const [ bookText, setBookText ] = useState({});
  // navbar visibility
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // toggle navbar visibility
  const toggleNavbar = () => {
    setIsNavbarVisible(prevState => !prevState);
  };

  // transliterate the input text using the API 
  const handleTransliteration = async (inputText: string, newValue?: string) => {
    const selectedValue = newValue || value;
    const transliteratedText = await transliterateText(inputText, selectedValue);
    setTextTranslit(transliteratedText);
    console.log(transliteratedText);
  };

  // update the translated text using the API
  const updateTranslate = async (inputText: string) => {
    setLoading(true);
    const response = await handleTranslate(inputText);
    setTranslatedText(response.translation);
    setLoading(false);
  };

  // split the text into words
  const words = textTranslit ? textTranslit.split(/\s+|\\+/) : [];

  // should split correctly the text into lines after '|' characters or newlines, while keeping the '|' characters. In case of '||' it should add an empty line.
  const lines = textTranslit ? textTranslit.split(/(\|)|\n/).reduce((acc, part) => {
    if (part === '|') {
      if (acc[acc.length - 1].endsWith('|')) {
        acc.push('');
      } else {
        acc[acc.length - 1] += '|';
      }
    } else if (part !== undefined && part !== '') {
      acc.push(part);
    }
    return acc;
  }, ['']) : [];

  
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

  useEffect(() => {

    const fetchData = async () => {
      try {
        const response = await import(`../books/${bookTitle?.value}.json`);
        setBookText(response.default);
        console.log(response.default);
      } catch (error) {
        console.error("Error loading JSON file:", error);
      }
    };

    fetchData();
  }, [bookTitle?.value]);


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
      <HeaderSearch onSearch={setSelectedWord} onToggleNavbar={toggleNavbar} />

    <div style={{ display: 'flex' }}>
    <div style={{ flex: '0 0 15%', minWidth: '300px' }}>
    {isNavbarVisible && (
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
        
      <DictionarySelector />

        <Select 
          data={['Goraksataka', 'Ratnavali', 'Boja'].map((item) => ({ value: item, label: item }))}
          value={value ? value.value : ''}
          label="Select a book to import"
          placeholder="Pick a book to import"
          onChange={(_value, option) => 
            {
              setBookTitle(option);
              console.log(option); 
            }}
          style={{ width: '100%', paddingTop: 5, paddingBottom: 16, }}
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
          placeholder={"Write text here to transliterate it." + '\n' + "A single word is automatically searched."}
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
          color: 'light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-10)',
        }}      
        >
          {loading ? 'Loading...' : 'Translate'}
        </Button>

      </NavbarSimple>
    )}
    </div>

    <div style={{ flex: '1 1 80%' }}>
      <Grid  gutter="lg" style={{ }}>
        <Grid.Col span={6} style={{ marginTop: '100px', paddingLeft: '200px', paddingRight: '50px' , overflow: 'auto',  whiteSpace: 'normal' }}>
          <div>{clickable_words}</div>    
          <ClickableBookWords
            bookText={bookText}
            selectedWord={selectedWord}
            setSelectedWord={setSelectedWord}
          />
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

