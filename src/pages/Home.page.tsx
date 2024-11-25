import { useState, useEffect } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea, Button, Loader, Text } from '@mantine/core';
import { FileInput } from '@mantine/core';
import {  ComboboxItem, Container, lighten, darken } from '@mantine/core';
import { useDisclosure, useDebouncedState, useMediaQuery } from '@mantine/hooks';
import WordDataComponent from '@/components/WordDataComponent';
import { fetchWordData, fetchMultidictData, transliterateText, handleTranslate } from './Api';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavbarSimple } from '@/components/NavbarSimple';
import { IconVocabularyOff } from '@tabler/icons-react';
import { IconClipboardCheck, IconCopy, IconClipboard} from '@tabler/icons-react';
import classes from './HomePage.module.css';
import { UiSwitch } from '@/components/HeaderSearch';
import DictionarySelectComponent from '@/components/DictionarySelect';
import Orientation from 'react-native-orientation-locker';
import BookSelect from '@/components/BookSelect';
import  ClickableSimpleBooks  from '@/components/ClickableSimpleBooks';


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
  // translitteration scheme
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
  const [ bookTitle, setBookTitle ] = useState<string | null>(null);

  // retrieved book text
  interface BookText {
    title?: string;
    body?: string;
  }
  
  const [bookText, setBookText] = useState<BookText>({});
  
  // dictionary selected
  const [ selectedDictionaries, setSelectedDictionaries ] = useState<string[]>([]);
  
  const isTextEmpty = text === "" && Object.keys(bookText).length === 0;
  console.log('isTextEmpty:', isTextEmpty);


  // reduce array for the clickable links to wordData
  type GroupedEntries = {
    [key: string]: WordEntry[];
  };
  
  // Add loading state
  const [isLoadingWordData, setIsLoadingWordData] = useState(false);
  

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1040px)');

  console.log('isMobile:', isMobile);
  console.log('isTablet:', isTablet);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  // navbar visibility
  const [isNavbarVisible, setIsNavbarVisible] = useState(!isMobile);
  console.log('isNavbarVisible:', isNavbarVisible);


  // toggle navbar visibility
  const toggleNavbar = () => {
    
    setIsNavbarVisible(prevState => !prevState);
  };

  // transliterate the input text using the API 
  const handleTransliteration = async (inputText: string, newValue?: string) => {
    const selectedValue = newValue || scheme;
    const transliteratedText = await transliterateText(inputText, selectedValue);
    setTextTranslit(transliteratedText);
  };

  // update the translated text using the API
  const updateTranslate = async (inputText: string) => {
    setLoading(true);
    const response = await handleTranslate(inputText);
    setTranslatedText(response.translation);
    setLoading(false);
  };

  const shouldUseColumn = isMobile || (isTablet && isNavbarVisible);

  // split the text into words
  const words = textTranslit ? textTranslit.split(/\s+|\\+/) : [];

  // should split correctly the text into lines after '|' characters or newlines, while keeping the '|' characters. In case of '||' it should add an empty line.
  
  const lines = [];
  if (textTranslit) {
    let currentLine = '';
    const textLines = textTranslit.split('\n');
    
    for (const line of textLines) {
      // First check for || XX || pattern, then for || and |
      const segments = line.split(/((?:\|\|\s*[^\s]{1,2}\s*\|\||\|\||[\|]))/);
      
      for (const segment of segments) {
        if (segment === '||') {
          currentLine += segment;
          lines.push(currentLine.trimStart());
          currentLine = '';
          lines.push(''); // Add empty line after
        }
        // Check for single pipe
        else if (segment === '|') {
          currentLine += segment;
          lines.push(currentLine.trimStart());
          currentLine = '';
        }
        // Regular text
        else if (segment.trim()) {
          currentLine += segment;
        }
      }
      
      // Push any remaining content in currentLine
      if (currentLine.trim()) {
        lines.push(currentLine.trimStart());
        currentLine = '';
      }
    }
  }
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const [wordData, setWordData] = useState<WordEntry[]>([]);
  // Add this state at the component level
  const [clickedAdditionalWord, setClickedAdditionalWord] = useState<string | null>(null);

  // Modified effect with more robust scrolling logic
  useEffect(() => {
    if (clickedAdditionalWord) {
      // First try with querySelector
      let element = document.querySelector(`h1[data-word="${clickedAdditionalWord}"]`);
      
      // If not found, try finding all h1s and match by content
      if (!element) {
        const allH1s = document.querySelectorAll('h1');
        for (const h1 of allH1s) {
          if (h1.textContent?.trim() === clickedAdditionalWord) {
            element = h1;
            break;
          }
        }
      }

      if (element) {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Optionally highlight the scrolled element temporarily
        }, 100);
      } else {
        console.log('Element not found for word:', clickedAdditionalWord);
      }
      setClickedAdditionalWord(null); // Reset after attempting to scroll
    }
  }, [clickedAdditionalWord]);

  const clickable_words = lines.map((line, lineIndex) => {
    const words = line.split(/\s+|\+/);
    const hasClickedWord = words.some(word => word.trim() === clickedWord);

    return (
      <div key={lineIndex} style={{ marginBottom: '8px' }}>
      <p>
        {words.map((word: string, wordIndex: number) => {
          const trimmedWord = word.trim();
          return (
            <span
              key={wordIndex}
              onClick={async () => {
                setSelectedWord(trimmedWord);
                setClickedWord(trimmedWord);
                setIsLoadingWordData(true);
                
                try {
                  const data = await fetchMultidictData(trimmedWord, selectedDictionaries);
                  console.log(data);
                  setWordData(data);
                } finally {
                  setIsLoadingWordData(false);
                }
              }}
              onMouseEnter={() => setHoveredWord(trimmedWord)}
              onMouseLeave={() => setHoveredWord(null)}
              style={{ 
                color: selectedWord === trimmedWord ? 'orange' : 'inherit',
                ...(hoveredWord === trimmedWord ? { color: 'gray' } : {}),
                cursor: 'pointer',
              }}
            >
              {word + ' '}
            </span>
          );
        })}
      </p>
      {hasClickedWord && (
        <p style={{ paddingLeft: '16px', color: '#666', marginTop: '4px' }}>
          {isLoadingWordData ? (
          <div className= {classes.loaderContainer}>
            <Loader type="dots" size="sm" color='rgba(191, 191, 191, 1)' />
          </div>
          ) : (
            wordData.length > 0 && (() => {
              const groupedEntries = wordData.reduce<GroupedEntries>((acc, entry) => {
                const key = entry[4] || 'default';
                if (!acc[key]) {
                  acc[key] = [];
                }
                acc[key].push(entry);
                return acc;
              }, {});

              return Object.entries(groupedEntries).map(([originalWord, entries], groupIndex) => {
                const uniqueWords = Array.from(new Set(entries.map(entry => entry[0])));
                
                return (
                  <span key={groupIndex} style={{ marginRight: '8px' }}>
                    {uniqueWords.map((word, wordIndex) => (
                      <>
                        <span
                          key={wordIndex}
                          className= {classes.additionalWord}
                          onClick={async () => {
                            setClickedAdditionalWord(word);
                            
                          }}
                          style={{
                            cursor: 'pointer',
                            whiteSpace: 'nowrap', // Prevent line breaks within words
                                                      
                            marginRight: wordIndex < uniqueWords.length - 1 ? '4px' : '0',
                          }}
                        >
                          {word}
                        </span>
                        {wordIndex < uniqueWords.length - 1 && (
                          <span style={{ margin: '0 4px', color: '#666' }}>|</span>
                        )}
                      </>
                    ))}
                  </span>
                );
              });
            })()
          )}
        </p>
      )}
    </div>
  );
});

  // If there is only one word, set it as the selected word
  useEffect(() => {
    if (words.length === 1) {
      setSelectedWord(words[0].trim());
    }
  }, [words]);

  


    // Define types for the different entry structures
  type InflectionEntry = [string, string]; // [caseAbbr, numberAbbr]
  type LongEntry = [
    string,  // entry[0] - word
    string,  // entry[1] - grammar
    InflectionEntry[],  // entry[2] - inflections
    string[],  // entry[3] - inflection_wordsIAST
    string,  // entry[4] - etymology
    string,  // entry[5] - pronunciation
    { [dictionaryName: string]: { [wordName: string]: string[] } }  // entry[6] - vocabulary entries
  ];

  type ShortEntry = [
    string,  // entry[0] - word
    string,  // entry[1] - components
    { [dictionaryName: string]: { [wordName: string]: string[] } }  // entry[6] - vocabulary entries
  ];

  type WordEntry = LongEntry | ShortEntry;


  useEffect(() => {
    if (selectedWord) {
      fetchMultidictData(selectedWord, selectedDictionaries).then(data => {
        console.log(data);
        setWordData(data);
      });
    }
  }, [selectedWord]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/resources/books/${bookTitle}.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        const data = await response.json();
        setBookText(data);
        console.log(data);
      } catch (error) {
        console.error("Error loading JSON file:", error);
      }
    };
  
    fetchData();
  }, [bookTitle]);

  return (
    <>

      
      <HeaderSearch   // header search component
        onSearch={setSelectedWord}
        onToggleNavbar={toggleNavbar}
        isMobile={isMobile}
        isNavbarVisible={isNavbarVisible} // Add the missing isNavbarVisible prop
      />

    <div style={{ display: 'flex' }}>  
      <div // navbar component
        className={classes.navbarBox}
        style={{ flex: isMobile? '0 0 8%' : '0 0 10%', 
                  minWidth: isNavbarVisible? '400px': '0px' }}
        >
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

                handleTransliteration(text, _value ?? undefined);
              }}
            style={{ width: '100%', paddingTop: 50, paddingBottom: 16, }}
          />
          
        <DictionarySelectComponent 
          selectedDictionaries = {selectedDictionaries}
          setSelectedDictionaries = {setSelectedDictionaries}
          
         />



         <BookSelect
          setBookTitle={setBookTitle}
          bookTitle={bookTitle}
         />



          <Textarea 
            value={text}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false} 
            onInput={(event) => {
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
          className= {classes.readingButton}
          leftSection={<IconVocabularyOff size={14} />}
          onClick={() => setIsNavbarVisible(false)} 
          loaderProps={{ type: 'dots' }}
          style={{
            width: '100%',
          }}      
          >
            {'Start Reading'}
          </Button>

          

        </NavbarSimple>
      )}
      </div>


      <div style={{ 
      flex: isNavbarVisible ? '1 1 80%' : '1 1 100%',
      paddingLeft: isMobile ? '16px' : undefined,
      paddingRight: isMobile ? '16px' : undefined
      }}>



            

      <Grid 
        gutter= {isTablet ? "lg" : 'xl'}
        className={classes.wholeGrid}
        justify="space-around"
        align="stretch"
        style={{ 
          display: 'flex', 
          flexDirection: shouldUseColumn ? 'column' : 'row',
          flexWrap: 'wrap', 
          justifyContent: 'left',
          transition: 'padding-left 0.3s ease',
          width: '100%', // Ensure grid doesn't exceed viewport
          maxWidth: '100vw', // Prevent horizontal scroll
          maxHeight: '100vh', // Added to prevent vertical overflow
          
     
        }}
      >
        <Grid.Col 
          span={isMobile ? 12 : 6}
          className={`${classes.noScroll} ${classes.textDisplay}`}
          style={{
            marginTop: isMobile ? '20px' : '120px',
            maxHeight: isMobile ? '50vh' : '100vh',
            width: isMobile ? '100%' : '50%',  // Changed to percentage
            paddingLeft: isTablet ? '0' : (isNavbarVisible ? '100px' : '0px'),
            paddingRight: isMobile? '0px' : isTablet ? '40px' : (isNavbarVisible ? '100px' : '120px'),
            transition: 'padding-left 0.3s ease',
            overflowY: 'auto',
            overflowX: 'hidden',
            borderBottom: isMobile && !isTextEmpty ? '1px solid lightgray' : 'none',
            minHeight: isMobile ? (isTextEmpty ? '0vh' : '50vh') : '0vh',              
            
          }}
        >
      
          <div
            className={`${classes.noScroll} ${classes.textClickable}`}
            style={{
              overflowY: 'auto',
              overflowX: 'hidden', // Added to prevent horizontal scroll
              width: '100%', // Changed from maxWidth
              maxWidth: '100vw', // Added to prevent horizontal scroll
              wordBreak: 'break-word', // Added to ensure words break
              whiteSpace: 'normal', // Changed from pre-wrap
              cursor: 'pointer',
              lineHeight: '1.6',
              paddingTop: isMobile ? '50px' : '0px',  // Added to ensure padding
              maxHeight: isMobile ? (isTextEmpty ? '0vh' : '50vh') : '100vh', // Added to prevent vertical overflow

            }}
            
          >
            {clickable_words}
            <ClickableSimpleBooks
              bookText={bookText}
              selectedWord={selectedWord}
              setSelectedWord={setSelectedWord}
              clickedWord={clickedWord}
              setClickedWord={setClickedWord}
              setWordData={setWordData}
              wordData={wordData}
              setClickedAdditionalWord={setClickedAdditionalWord}
              selectedDictionaries={selectedDictionaries}
              hoveredWord = {hoveredWord}
              setHoveredWord = {setHoveredWord}
             


            />
          </div>
          
          {/* Update the translated text container */}
          <div style={{ width: '100%' }}> {/* Added width constraint */}
            {translatedText.length > 0 && translatedText.map((item, index) => (
              <div key={index} style={{ width: '100%' }}> {/* Added width constraint */}
                <p style={{ 
                  color: 'darkgrey',
                  width: '100%', // Added width constraint
                  wordBreak: 'break-word' // Added to ensure words break
                }}>
                  {item.Sanskrit.split(/\s+|\+/).map((word, wordIndex) => {
                    const trimmedWord = word.trim();
                    return (
                      <span
                        key={wordIndex}
                        onClick={() => setSelectedWord(trimmedWord)}
                        style={{ 
                          color: selectedWord === trimmedWord ? 'orange' : 'inherit',
                          display: 'inline-block', // Added to help with word wrapping
                          wordBreak: 'break-word' // Added to ensure words break
                        }}
                      >
                        {word + ' '}
                      </span>
                    );
                  })}
                </p>
                <p style={{ wordBreak: 'break-word' }}>{item.English}</p>
              </div>
            ))}
          </div>
          </Grid.Col>

        {text !== '' || bookTitle !== null ? (
          <Grid.Col 
            span={isMobile ? 12 : 6}
            className={`${classes.noScroll} ${classes.wordInfoHalf}`}
            style={{
              marginTop: isMobile ? '20px' : '80px',
              maxHeight: isMobile ? (isTextEmpty ? '100vh' : '50vh') : '100vh',              
              width: isMobile ? '100%' : '50%',  // Changed to percentage
              paddingLeft: isMobile ? '0' : (isNavbarVisible ? '50px' : '0px'),
              paddingRight: isMobile ? '0' : (isNavbarVisible ? '80px' : '40px'),
              transition: 'padding-left 0.3s ease',
              overflowY: 'auto',

            }}
          >
            <WordDataComponent wordData={wordData} setWordData={setWordData} selectedDictionaries={selectedDictionaries} isMobile={isMobile} />
          </Grid.Col>
        ) : (
          <Grid.Col 
            span={12}
            className={`${classes.noScroll} ${classes.wordInfoFull}`}
            style={{
              width: '100%',  // Added explicit width
              paddingLeft: isMobile ? '16px' : (isNavbarVisible ? '300px' : '0px'),
              paddingRight: isMobile ? '16px' : (isNavbarVisible ? '350px' : '120px'),
            }}
          >
            <WordDataComponent wordData={wordData} setWordData={setWordData} selectedDictionaries={selectedDictionaries} isMobile={isMobile} />
          </Grid.Col>
        )}
      </Grid>
        

      </div>
      <div style={{ flex: isMobile ? '0 0 6%' : '0 0 7%' }}> 
        </div>
    </div>
    </>
  );
}






