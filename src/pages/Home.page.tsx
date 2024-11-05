import { useState, useEffect } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea, Button, Loader } from '@mantine/core';
import { FileInput } from '@mantine/core';
import {  ComboboxItem, Container, lighten, darken } from '@mantine/core';
import { useDisclosure, useDebouncedState } from '@mantine/hooks';
import WordDataComponent from '@/components/WordDataComponent';
import { fetchWordData, transliterateText, handleTranslate } from './Api';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavbarSimple } from '@/components/NavbarSimple';
import { IconVocabularyOff } from '@tabler/icons-react';
import { IconClipboardCheck, IconCopy, IconClipboard} from '@tabler/icons-react';
import classes from './HomePage.module.css';
import { UiSwitch } from '@/components/HeaderSearch';
import { DictionarySelector } from '@/components/DictionarySelect';
import { ClickableBookWords } from '@/components/ClickableBookWords';
import Orientation from 'react-native-orientation-locker';

Orientation.lockToLandscape();

interface Translation {
  English: string;
  Sanskrit: string;
}

export function HomePage() {

  // input text into the textarea
  const [text, setText] = useState('');
  // output translitteration scheme
  const [value, setValue] = useState<ComboboxItem | null>({ value: 'IAST', label: 'IAST' });  
  const [scheme, setScheme] = useState('IAST');  

  // transliterated text
  const [textTranslit, setTextTranslit] = useDebouncedState('', 100);
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
    const selectedValue = newValue || scheme;
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
      {line.split(/\s+|\+/).map((word: string, wordIndex: number) => {
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
      <HeaderSearch
        onSearch={setSelectedWord}
        onToggleNavbar={toggleNavbar}
        isNavbarVisible={isNavbarVisible} // Add the missing isNavbarVisible prop
      />

    <div style={{ display: 'flex' }}>
      <div style={{ flex: '0 0 15%', minWidth: isNavbarVisible? '400px': '0px' }}>
      {isNavbarVisible && (
        <NavbarSimple>
          <Select
            data={['IAST', 'DEVANAGARI', 'ITRANS', 'HK', 'SLP1', 'WX', 'Kolkata'].map((item) => ({ value: item, label: item }))}
            value={value ? value.value : 'IAST'}
            label="Select Translitteration Scheme"
            placeholder="Pick Translitteration Scheme, default is IAST"
            onChange={(_value, option) => 
              {
                const tempscheme = value ? value.value : 'IAST';
                setScheme(tempscheme);
                setValue(option);
                console.log(option); 

                handleTransliteration(text, _value ?? undefined);
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
            autoCapitalize="off"
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

      <div style={{ flex: isNavbarVisible ? '1 1 80%' : '1 1 100%' }}>
        <Grid  gutter="lg" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'left', 
          // padding: '0 50px', 
          transition: 'padding-left 0.3s ease', // Add smooth transition
         }}>

          <Grid.Col span={6}
            className={classes.noScroll}
            style={{
              marginTop: '0px',
              paddingLeft: isNavbarVisible ? '150px' : '0px',
              paddingRight: '50px',
              transition: 'padding-left 0.3s ease',
              overflowY: 'auto',
              maxHeight: '100vh',
              whiteSpace: 'normal', // Allows text to wrap
              wordWrap: 'break-word', // Breaks long words if needed
            }}
            >
            <div
              className={classes.noScroll}
              style={{
                maxHeight: '100vh',
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap', // Ensures content wraps within the flex container
                justifyContent: 'left',
                wordWrap: 'break-word',
                maxWidth: '100%',
                whiteSpace: 'normal', // Ensures text wraps onto the next line
              }}
              
              >{clickable_words}</div>    
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
        {text !== '' ? (        
          <Grid.Col span={6} 
  
          className={classes.noScroll} 
          style={{ marginTop: '100px', 
                                      maxHeight: '100vh', 
                                      paddingLeft: isNavbarVisible ? '50px' : '0px', // Adjust based on navbar visibility
                                      paddingRight: isNavbarVisible ? '80px' : '120px',
                                      transition: 'padding-left 0.3s ease', // Add smooth transition
                                      // backgroundColor: darken('var(--mantine-color-body)', 0.1), // Makes background 10% lighter
                                      overflowY: 'auto' }}>
              <WordDataComponent wordData={wordData} setWordData={setWordData}/>
          </Grid.Col> ) : (
                    <Grid.Col span={12} 
  
                    className={classes.noScroll} 
                    style={{ marginTop: '100px', 
                                                maxHeight: '100vh', 
                                                paddingLeft: isNavbarVisible ? '0px' : '0px', // Adjust based on navbar visibility
                                                paddingRight: isNavbarVisible ? '80px' : '120px',
                                                transition: 'padding-left 0.3s ease', // Add smooth transition
                                                // backgroundColor: darken('var(--mantine-color-body)', 0.1), // Makes background 10% lighter
                                                overflowY: 'auto' }}>
                        <WordDataComponent wordData={wordData} setWordData={setWordData}/>
                    </Grid.Col>
        )}
       
        </Grid>
      </div>
    </div>
    </>
  );
}




