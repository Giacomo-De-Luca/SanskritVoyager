import { useState, useEffect } from 'react';
import { ActionToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Select, MultiSelect, Grid, Textarea, Button, Loader, Text, Stack, ActionIcon, Skeleton } from '@mantine/core';
import { FileInput } from '@mantine/core';
import {  ComboboxItem, Container, lighten, darken, ScrollArea } from '@mantine/core';
import { useDisclosure, useDebouncedState, useMediaQuery } from '@mantine/hooks';
import WordDataComponent from '@/components/WordDataComponent';
import { fetchWordData, fetchMultidictData, transliterateText, handleTranslate } from './Api';
import { HeaderSearch } from '@/components/HeaderSearch';
import { NavbarSimple } from '@/components/NavbarSimple';
import { IconVocabularyOff, IconChevronUp, IconChevronDown, IconChevronsRight, IconChevronRight } from '@tabler/icons-react';
import { IconClipboardCheck, IconCopy, IconClipboard} from '@tabler/icons-react';
import classes from './HomePage.module.css';
import { UiSwitch } from '@/components/HeaderSearch';
import DictionarySelectComponent from '@/components/DictionarySelect';
import BookSelect from '@/components/BookSelect';
import  ClickableSimpleBooks  from '@/components/ClickableSimpleBooks';
import ClickableWords from '@/components/ClickableWords';
import { WordEntry, GroupedEntries } from '../types/wordTypes';
import { BookText } from '../types/bookTypes';
import TranslationControl from '@/components/TranslationControl';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface Translation {
  English: string;
  Sanskrit: string;
}

export function HomePage() {

  // input text into the textarea
  const [text, setText] = useState('');


  // output translitteration scheme
  const [scheme, setScheme] = useState<ComboboxItem>({ value: 'IAST', label: 'IAST' });  

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

  const [textType, setTextType] = useState('both');
  
  // dictionary selected
  const [ selectedDictionaries, setSelectedDictionaries ] = useState<string[]>([]);
  
  const isTextEmpty = text === "" && Object.keys(bookText).length === 0;
  console.log('isTextEmpty:', isTextEmpty);

  // reduce array for the clickable links to wordData
  type GroupedEntries = {
    [key: string]: WordEntry[];
  };
  
  const [isWordInfoVisible, setIsWordInfoVisible] = useState(false);



  // Add loading state
  const [isLoadingWordData, setIsLoadingWordData] = useState(false);

  // media queries
  const isSmallMobile = useMediaQuery('(max-height: 724px)');
  const isMobile = useMediaQuery('(max-width: 600px)');
  const isTablet = useMediaQuery('(max-width: 1100px)');

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
    const selectedValue = newValue || scheme.value;
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

  // const vhActual = `calc(100vh - 56px)`;
  const vhActual = `calc(100vh - 56px)`;
  const vhActualHalf = `calc((100vh - 56px)/2)`; // Correct
  const vwActual = `calc(100vw - 400px)`;


  

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
  const [clickedInfoWord, setClickedInfoWord] = useState<string | null>(null);


  // Modified effect with more robust scrolling logic
  useEffect(() => {
    if (clickedAdditionalWord) {
      // First try with querySelector
      let element = document.querySelector(`h1[data-word="${clickedAdditionalWord}"]`);
      setIsWordInfoVisible(true)
      
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

  useEffect(() => {
    if (wordData.length > 0) {
      // Wait for the DOM to update with new wordData
      setTimeout(() => {
        // If we have a clicked word, try to scroll to that instead of the first word
        const targetWord = clickedInfoWord || wordData[0][0];
        let element = document.querySelector(`h1[data-word="${targetWord}"]`);
        
        if (!element) {
          const allH1s = document.querySelectorAll('h1');
          for (const h1 of allH1s) {
            if (h1.textContent?.trim() === targetWord) {
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
  }, [wordData, clickedInfoWord]); // Added clickedInfoWord to dependencies


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
      setIsLoadingWordData(true);
      fetchMultidictData(selectedWord, selectedDictionaries).then(data => {
        console.log(data);
        setWordData(data);
        setIsLoadingWordData(false);
      }).catch(() => {
        setIsLoadingWordData(false);
      });
    }
  }, [selectedWord, selectedDictionaries]);

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
    
    <div className={classes.mainContainer}
    
    >

      
      <HeaderSearch   // header search component
        onSearch={setSelectedWord}
        onToggleNavbar={toggleNavbar}
        isMobile={isMobile}
        isNavbarVisible={isNavbarVisible} // Add the missing isNavbarVisible prop
      />

    <div 
      
        className={classes.contentBox}
        style={{ 
          display: 'flex',
          paddingTop: '56px', 
          overflow: 'hidden', // Prevent overflow
          height: '100%',
          position: 'relative',
          width: '100%'

    
            
            
         

        }}>  
      <div // navbar component should be a separate one
        className={classes.navbarBox}

        style={{ 
          width: 
          isNavbarVisible ? 
          (isMobile? '100vw' : (isTablet ? '350px' : '350px')): 0,
        }}


        
        >
      {isNavbarVisible && (
        <NavbarSimple
        isNavbarVisible={isNavbarVisible}

        isMobile={isMobile}
        isTablet={isTablet}


        isSmallMobile={isSmallMobile}
        scheme={scheme}
        setScheme={setScheme}
        handleTransliteration={handleTransliteration}
        selectedDictionaries={selectedDictionaries}
        setSelectedDictionaries={setSelectedDictionaries}
        bookTitle={bookTitle}
        setBookTitle={setBookTitle}
        textType={textType}
        setTextType={setTextType}
        text={text}
        setText={setText}
        setIsNavbarVisible={setIsNavbarVisible}

        
        />
      )}
      </div>


      {!(isMobile && isNavbarVisible) && (


    
      <Grid 
        className={classes.wholeGrid}
        justify="space-around"
        align="stretch"
        style={{ 
          display: 'flex', 
          flexDirection: shouldUseColumn ? 'column' : 'row',
          flexWrap: 'nowrap',
          justifyContent: 'left',
          transition: 'padding-left 0.3s ease',
          paddingRight: isMobile ? '16px' : 0,
          paddingLeft: isMobile ? '16px' : (isTablet ? '0' : (isNavbarVisible ? '0px' : '0px')),

          position: 'relative',
          width: '100%',

            
        }}
      >
        {text !== '' || bookTitle !== null ? (   // book and translit text grid
        <Grid.Col 
          span={
            isMobile ? 12 : 
            isTablet && isNavbarVisible ? 12 : 
            (selectedWord !== "" && isWordInfoVisible ? 6 : 12)
          }
          className={` ${classes.textDisplay} `}
          // ${classes.fadeContainer}
          style={{
            paddingTop:  '0px', // necessary?
            maxHeight: isMobile ?    //mobile
            (isWordInfoVisible ? vhActualHalf // mobile word info
            : vhActual) // mobile full size
            :
            isTablet && isNavbarVisible ?      // tablet
              (isWordInfoVisible ? vhActualHalf //tablet navbar word info
                : vhActual) // tablet navbar no word info, full size 

              : vhActual, // desktop, always full size
            width: isMobile ? '100%' : (isWordInfoVisible ? '50%' : '100%'),  // Changed to percentage
            paddingLeft: 
            isMobile ? '8%' : // mobile
            
                  (isTablet ? // tablet
                    (isNavbarVisible ? 
                      (isWordInfoVisible ? '10%' // two grid rows
                                         : '10%') : // single column navbar
                      (isWordInfoVisible ? '12%' // no navbar two column
                                         : '22%')) // no navbar
                    :

                    (isNavbarVisible ? // desktop
                      (isWordInfoVisible ? '10%' // left two column navbar open
                                         : '25%') : // navbar
                      (isWordInfoVisible ? '18%' // left two column no navbar
                                         : '28%')) // no navbar
                  ),
            paddingRight: 
                  isMobile ? '8%' : // mobile

                  (isTablet ? // tablet
                    (isNavbarVisible ? 
                      (isWordInfoVisible ? '10%' // two grid rows
                                         : '10%') : // single column navbar
                      (isWordInfoVisible ? '3%' //no navbar two columns --> GAP 
                                         : '20%')) : // no navbar

                    (isNavbarVisible ? // desktop
                      (isWordInfoVisible ? '3%'     // navbar two column
                                         : '25%') : // navbar single column

                      (isWordInfoVisible ? '3%' //  // between column 
                                         : '28%')) //  no navbar single column
                  ),
            transition: 'padding-left 0.3s ease',
            overflowY: 'auto',
            overflowX: 'hidden',
            wordBreak: 'break-word', // Added to ensure words break
            whiteSpace: 'normal', // Changed from pre-wrap      
            paddingBottom: '0px'  
          
          }}
        >
            
       

          < div className= {classes.scrollContainer}
          style={{
            borderBottom: isMobile && isWordInfoVisible || (isTablet && isNavbarVisible) && isWordInfoVisible ? '1px solid lightgray' : 'none',

          }}>
            {textTranslit !== '' && (
              <ClickableWords
                lines={lines}
                textTranslit={textTranslit}
                selectedWord={selectedWord}
                setSelectedWord={setSelectedWord}
                hoveredWord={hoveredWord}
                setHoveredWord={setHoveredWord}
                selectedDictionaries={selectedDictionaries}
                wordData={wordData}
                isLoadingWordData={isLoadingWordData}
                setIsLoadingWordData={setIsLoadingWordData}
                clickedWord={clickedWord}
                setClickedWord={setClickedWord}
                setClickedAdditionalWord={setClickedAdditionalWord}
                />
              )}
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
              textType = {textType}
              isLoadingWordData = {isLoadingWordData}

            />

                          {/* here was the translatedText container. RIP.  */}
              

                

              
                      </div>
          </Grid.Col>
        ) : ("")
        }
        {text !== '' || bookTitle !== null ? (
          (Array.isArray(wordData) && wordData.length > 0) || isLoadingWordData  && isWordInfoVisible ? (
              
              <Grid.Col 
                span= {
                  isWordInfoVisible ? 
                    (isMobile ? 12 :   // mobile visible full 
                    isTablet ? (
                      isNavbarVisible? 12 : 6    // table depends on navbar, with navbar column else half screen
                    )
                    : 6)                    // half screen for desktop                                      
                  : 0    // not visible, -- 0 
                }
                
                
                className={` ${classes.wordInfoHalf} ${classes.wordInfoTransition} `}
                // causes weird behaviour but cool one className={`${classes.scrollContainer} ${classes.wordInfoHalf} ${classes.wordInfoTransition} ${classes.topFadeContainer}`}

                style={{

                  overflowY: 'auto',
                  position: 'relative',
                  opacity: !isWordInfoVisible ? 0 : 1,
                  visibility: !isWordInfoVisible ? 'hidden' : 'visible',
                  transition: 'all 0.3s ease',
                  paddingTop:  '0px', // necessary?                  
                  height: 
                  isWordInfoVisible ? 
                  (isMobile ? vhActualHalf :   // mobile half screen
                  isTablet ? (
                    isNavbarVisible? vhActualHalf : vhActual    // table depends on navbar, with navbar half screen else full screen
                  )
                  : vhActual)                    // half screen for desktop        

                  : 0,    // not visible, -- 0 

                  
                  width:
                  isWordInfoVisible ? 
                  (isMobile ? '100%' :   // mobile half screen
                  isTablet ? (
                    isNavbarVisible? '100%' : '50%'    // table depends on navbar, with navbar half screen else full screen
                  )
                  : '50%')                    // half screen for desktop                                      
                  : 0,    // not visible, -- 0 
                  
                  
                  paddingLeft: 

                  isWordInfoVisible ? 
                  (isMobile ? '8%' :   // mobile little padding

                  isTablet ?          // tablet
                    (isNavbarVisible? '10%' // gap between two columns
                                    : '3%') :  // single column navbar 
                    
                    ( isNavbarVisible ?  //desktop
                                       '3%' : //navbar middle margin
                                       '3%')) // no navbar             //half screen for desktop          

                  : 0,    // not visible, -- 0 


                  paddingRight: 
                  isWordInfoVisible ? 
                  (isMobile ? '8%' :   // mobile little padding

                  isTablet ? 
                    (isNavbarVisible? '10%' // two rows + navbar
                                    : '12%') : // two columns ---> gap

                    ( isNavbarVisible ? '10%'         //desktop navbar
                                      : '18%'))       //desktop                              
                  : 0,    // not visible, -- 0 


                  wordBreak: 'break-word', // Added to ensure words break
                  whiteSpace: 'normal', // Changed from pre-wrap      
                  paddingBottom: '0px'  



              
                }}

              >
                < div className= {classes.scrollContainer}>

                  <div className={classes.chevronContainer}>
                  <ActionIcon
                      className={classes.chevronButton}
                      onClick={() => setIsWordInfoVisible(!isWordInfoVisible)}
                      data-rotated={!isWordInfoVisible}
                      aria-label={isWordInfoVisible ? "Collapse word info" : "Expand word info"}
                      variant="transparent"
                      size="md"
                      style={{
                        right: isMobile? '4px': '-0px', // Adjust this value to position within the margin
                        top: isMobile? 0 : '20px', // Adjust the top position as needed
                      }}
                      
                    >
                      { isMobile ? (<IconChevronDown size={20} stroke={1.5}  />): 
                        (<IconChevronRight size={20} stroke={1.5} />)}

                </ActionIcon>
                </div>
                
                

                  {isLoadingWordData ? (
                            <LoadingSkeleton />
                          ) : (
                            <WordDataComponent
                              wordData={wordData}
                              setWordData={setWordData}
                              selectedDictionaries={selectedDictionaries}
                              isMobile={isMobile}
                              setClickedInfoWord={setClickedInfoWord}
                              isTablet={isTablet}
                              isNavabarVisible={isNavbarVisible}
                              
                              
                            />
                          )}
                </div>

              </Grid.Col>
        ) : "") : (
          <Grid.Col 
            span={12}
            className={` ${classes.wordInfoFull}`}
            style={{
              paddingTop: '0px', // necessary?
              maxHeight: vhActual,
              width:  '100%',  // Changed to percentage
              paddingLeft: 
              isMobile ? '8%' : // mobile

                    (isTablet ? // tablet
                      (isNavbarVisible ? '12%'  // single column navbar
                                       : '22%') // no navbar

                      :                //desktop
                      (isNavbarVisible ? '25%' //  single column navbar
                                       : '28%') // no navbar
                    ),
              paddingRight: 
              isMobile ? '8%' : // mobile

              (isTablet ? // tablet
                (isNavbarVisible ? '12%'  // single column navbar
                                 : '22%') // no navbar

                :                //desktop
                (isNavbarVisible ? '25%'  // single column navbar
                                 : '28%') // no navbar
              ),
              transition: 'padding-right 0.3s ease',
              overflowY: 'auto',
              overflowX: 'auto',
              wordBreak: 'break-word', // Added to ensure words break
              whiteSpace: 'normal', // Changed from pre-wrap      
              paddingBottom: '0px'  }}

          >
            < div className= {classes.scrollContainer}>
            {wordData.length < 1 && isLoadingWordData ?  (
                    <LoadingSkeleton />
                  ) : (
                    <WordDataComponent
                      wordData={wordData}
                      setWordData={setWordData}
                      selectedDictionaries={selectedDictionaries}
                      isMobile={isMobile}
                      setClickedInfoWord={setClickedInfoWord}
                      isTablet={isTablet}
                      isNavabarVisible={isNavbarVisible}

                    />
                  )}
            </div>

          </Grid.Col>
        )}
      </Grid>
      )}
    </div>
    </div>
    
  );
}






