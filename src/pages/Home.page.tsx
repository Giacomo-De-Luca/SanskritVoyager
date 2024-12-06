import { useState, useEffect } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea, Button, Loader, Text, Stack, ActionIcon } from '@mantine/core';
import { FileInput } from '@mantine/core';
import {  ComboboxItem, Container, lighten, darken } from '@mantine/core';
import { useDisclosure, useDebouncedState, useMediaQuery } from '@mantine/hooks';
import WordDataComponent from '@/components/WordDataComponent';
import { fetchWordData, fetchMultidictData, transliterateText, handleTranslate } from './Api';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavbarSimple } from '@/components/NavbarSimple';
import { IconVocabularyOff, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { IconClipboardCheck, IconCopy, IconClipboard} from '@tabler/icons-react';
import classes from './HomePage.module.css';
import { UiSwitch } from '@/components/HeaderSearch';
import DictionarySelectComponent from '@/components/DictionarySelect';
import BookSelect from '@/components/BookSelect';
import  ClickableSimpleBooks  from '@/components/ClickableSimpleBooks';
import ClickableWords from '@/components/ClickableWords';
import { WordEntry, GroupedEntries } from '../types/wordTypes';
import { BookText } from '../types/bookTypes';


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

  const [bookText, setBookText] = useState<BookText>({});
  
  // dictionary selected
  const [ selectedDictionaries, setSelectedDictionaries ] = useState<string[]>([]);
  
  const isTextEmpty = text === "" && Object.keys(bookText).length === 0;
  console.log('isTextEmpty:', isTextEmpty);

  // reduce array for the clickable links to wordData
  type GroupedEntries = {
    [key: string]: WordEntry[];
  };
  
  const [isWordInfoVisible, setIsWordInfoVisible] = useState(true);



  // Add loading state
  const [isLoadingWordData, setIsLoadingWordData] = useState(false);

  // media queries
  const isSmallMobile = useMediaQuery('(max-height: 724px)');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1340px)');

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

  const vhActual = `calc(100vh - 56px)`;
  const vhActualHalf = `calc((100vh - 56px)/2)`; // Correct

  // here starts what should be a separate component
  // make a separate component for the clickable words in the text
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

  // New effect for wordData changes
  useEffect(() => {
    if (wordData.length > 0) {
      // Wait for the DOM to update with new wordData
      setTimeout(() => {
        const firstWord = wordData[0][0]; // Get the first word from wordData
        let element = document.querySelector(`h1[data-word="${firstWord}"]`);
        
        if (!element) {
          const allH1s = document.querySelectorAll('h1');
          for (const h1 of allH1s) {
            if (h1.textContent?.trim() === firstWord) {
              element = h1;
              break;
            }
          }
        }

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [wordData]);


  // If there is only one word, set it as the selected word
  useEffect(() => {
    if (words.length === 1) {
      setSelectedWord(words[0].trim());
    }
  }, [words]);

  useEffect(() => {
  if (selectedWord !== '') {
    setIsWordInfoVisible(true);
  }
}, [selectedWord]);
  
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
        const response = await fetch(`/public/resources/books/${bookTitle}.json`);
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
      <div // navbar component should be a separate one
        className={classes.navbarBox}
        style={{ flex: isMobile? '0 0 8%' : '0 0 10%', 
                  minWidth: isNavbarVisible? '400px': '0px' }}
        >
      {isNavbarVisible && (
        <NavbarSimple>
        
        <Stack  
          gap="3px"
          justify="flex-end"
          >
          <Select
            data={['IAST', 'DEVANAGARI', 'ITRANS', 'HK', 'SLP1', 'WX', 'Kolkata'].map((item) => ({ value: item, label: item }))}
            value={value ? value.value : 'IAST'}
            label="Select Transliteration Scheme"
            placeholder="Pick Transliteration Scheme, default is IAST"
            onChange={(_value, option) => 
              {
                const tempscheme = value ? value.value : 'IAST';
                setScheme(tempscheme);
                setValue(option);

                handleTransliteration(text, _value ?? undefined);
              }}
            style={{ width: '100%', 
                     paddingTop: isSmallMobile? '30px': '60px', }}
          />
          
        <DictionarySelectComponent 
          selectedDictionaries = {selectedDictionaries}
          setSelectedDictionaries = {setSelectedDictionaries}
          
         />

         <BookSelect
          setBookTitle={setBookTitle}
          bookTitle={bookTitle}
         />
        </Stack>


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
            placeholder={"Write text here to transliterate it." + '\n' + "A single word is automatically searched." + '\n' + "Analyse words on click."}
            style={{ width: '100%', paddingBottom: 16, paddingTop: '0px' }}
            autosize
            minRows={6}
            maxRows={8}
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
          maxHeight: vhActual, // Added to prevent vertical overflow
          paddingLeft: isMobile ? '0' : (isTablet ? '0' : (isNavbarVisible ? '0px' : '0px')),          
        }}
      >
        {text !== '' || bookTitle !== null ? (
        <Grid.Col 
          span={isMobile ? 12 : isTablet && isNavbarVisible ? 12 : 6}
          className={`${classes.noScroll} ${classes.textDisplay}`}
          style={{
            marginTop: isMobile ? '20px' : '100px',
            maxHeight: isMobile ? 
            (selectedWord !== "" ? 
              (isWordInfoVisible ? vhActualHalf : vhActual) 
              : vhActual
            ) :
            isTablet && isNavbarVisible ? 
              (selectedWord !== "" ? vhActualHalf : vhActual) 
              : vhActual,
            width: isMobile ? '100%' : '50%',  // Changed to percentage
            paddingLeft: isTablet ? '0' : (isNavbarVisible ? '100px' : (isMobile ? '0px': '120px')),
            paddingRight: isMobile? '0px' : isTablet ? '40px' : (isNavbarVisible ? '100px' : '120px'),
            transition: 'padding-left 0.3s ease',
            overflowY: 'auto',
            overflowX: 'hidden',
            borderBottom: isMobile && !isTextEmpty ? '1px solid lightgray' : 'none',
            minHeight: isMobile ? (isTextEmpty ? '0vh' : '45vh') : '0vh',              
            
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
              maxHeight: isMobile 
                ? (isTextEmpty ? '0vh' : 
                    (selectedWord !== "" ? 
                      (isWordInfoVisible ? vhActualHalf : vhActual) 
                      : vhActual
                    )
                  )
                : vhActual,
            }}
            
          >
              <ClickableWords
                lines={lines}
                selectedWord={selectedWord}
                setSelectedWord={setSelectedWord}
                hoveredWord={hoveredWord}
                setHoveredWord={setHoveredWord}
                selectedDictionaries={selectedDictionaries}
                wordData={wordData}
                isLoadingWordData={isLoadingWordData}
                clickedWord={clickedWord}
                setClickedWord={setClickedWord}
                onWordClick={async (word) => {
                  setIsLoadingWordData(true);
                  try {
                    const data = await fetchMultidictData(word, selectedDictionaries);
                    setWordData(data);
                  } finally {
                    setIsLoadingWordData(false);
                  }
                }}
                onAdditionalWordClick={(word) => setClickedAdditionalWord(word)}
              />
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
        ) : ("")
        }
        {text !== '' || bookTitle !== null ? (
          selectedWord !== "" ? (
              <Grid.Col 
                span={isMobile ? (isWordInfoVisible ? 12 : 0) : (isTablet && isNavbarVisible ? 12 : 6)}
                className={`${classes.noScroll} ${classes.wordInfoHalf} ${classes.wordInfoTransition}`}
                style={{
                  marginTop: isMobile ? '20px' : '80px',
                  maxHeight: isMobile ? (selectedWord !== "" ? vhActualHalf: vhActual) :
                  isTablet && isNavbarVisible ? (selectedWord !== "" ? vhActualHalf: vhActual):
                  vhActual,          
                  width: isMobile ? (isWordInfoVisible ? '100%' : '0%') : '50%',
                  paddingLeft: isMobile ? '0' : (isNavbarVisible ? '50px' : '0px'),
                  paddingRight: isMobile ? '0' : (isNavbarVisible ? '80px' : (isTablet ?'40px': '160px')),
                  overflowY: 'auto',
                  position: 'relative',
                  opacity: isMobile && !isWordInfoVisible ? 0 : 1,
                  visibility: isMobile && !isWordInfoVisible ? 'hidden' : 'visible',
                  transition: 'all 0.3s ease',

                  
                }}
              >
                {isMobile && (
                  <ActionIcon
                      className={classes.chevronButton}
                      onClick={() => setIsWordInfoVisible(!isWordInfoVisible)}
                      data-rotated={!isWordInfoVisible}
                      aria-label={isWordInfoVisible ? "Collapse word info" : "Expand word info"}
                      variant="transparent"
                      size="lg"
                    >
                      <IconChevronDown size={20} stroke={1.5}  />
                </ActionIcon>
                )}
                <WordDataComponent 
                  wordData={wordData} 
                  setWordData={setWordData} 
                  selectedDictionaries={selectedDictionaries} 
                  isMobile={isMobile} 
                />
              </Grid.Col>
        ) : "") : (
          <Grid.Col 
            span={12}
            className={`${classes.noScroll} ${classes.wordInfoFull}`}
            style={{
              width: '100%',  // Added explicit width
              paddingLeft: isMobile ? '16px' : (isNavbarVisible ? '17vw' : '22vw'),
              paddingRight: isMobile ? '16px' : (isNavbarVisible ? '15vw' : '20vw'),
              marginTop: '60px',
            }}
          >
            <WordDataComponent wordData={wordData} setWordData={setWordData} selectedDictionaries={selectedDictionaries} isMobile={isMobile} />
          </Grid.Col>
        )}
      </Grid>
        

      </div>
      <div style={{ flex: isMobile ? '0 0 6%' : '0 0 8%' }}> 
        </div>
    </div>
    </>
  );
}






