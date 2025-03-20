import React, { useState } from 'react';
import { 
  SegmentedControl, 
  TextInput, 
  MultiSelect, 
  Button, 
  Stack, 
  Title, 
  Text, 
  Paper, 
  Loader, 
  Accordion, 
  Group, 
  Badge, 
  Divider,
  ActionIcon,
  Box,
  Collapse,
  useMantineTheme,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconSearch, 
  IconBook, 
  IconChevronDown, 
  IconChevronRight, 
  IconExternalLink,
  IconInfoCircle, 
  IconChevronUp,
  IconFilter,
  IconAdjustments,
} from '@tabler/icons-react';
import Mark from 'mark.js';
import classes from './AdvancedSearch.module.css';
import { BookResult, SearchResult, SegmentResult } from '../types/bookTypes';
import HighlightText from './HighlightText';


interface AdvancedSearchProps {
  advancedSearchResults: SearchResult | null;
  setAdvancedSearchResults: (results: SearchResult | null) => void;
  onSearch: (params: any) => void;
  onOpenText?: (textId: string, title: string) => void;
  isMobile: boolean | undefined;
  setTargetSegmentNumber: (segmentNumber: number) => void;
  query: string;
  setQuery: (query: string) => void;
  matchedBookSegments: number[];
  setMatchedBookSegments: (segments: number[]) => void;
  
}

function AdvancedSearch({ advancedSearchResults, setAdvancedSearchResults, onSearch, onOpenText, isMobile, setTargetSegmentNumber, query, setQuery, setMatchedBookSegments, matchedBookSegments }: AdvancedSearchProps) {
  const [queryType, setQueryType] = useState('stemmed');
  const [filterMode, setFilterMode] = useState('include');
  const [searchType, setSearchType] = useState<'segments' | 'books'>('segments');
  const [authors, setAuthors] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [limit, setLimit] = useState(500);
  
  // State for handling the search process
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<string[]>([]);

  const [inputValue, setInputValue] = useState('');

  // Mock data for dropdowns - replace with actual data from API
  const authorOptions = [
    { value: 'patanjali', label: 'Patañjali' },
    { value: 'vyasa', label: 'Vyāsa' },
    { value: 'kalidasa', label: 'Kālidāsa' },
    { value: 'valmiki', label: 'Vālmīki' },
    { value: 'vasubandhu', label: 'Vasubandhu' },
    { value: 'shankara', label: 'Śaṅkara' },
  ];

  const collectionOptions = [
    { value: 'vedic', label: 'Vedic Literature' },
    { value: 'epic', label: 'Epic Literature' },
    { value: 'philosophical', label: 'Philosophical Texts' },
    { value: 'tantric', label: 'Tantric Texts' },
    { value: 'buddhist', label: 'Buddhist Literature' },
  ];

  const titleOptions = [
    { value: 'yogasutra', label: 'Yoga Sūtra' },
    { value: 'ramayana', label: 'Rāmāyaṇa' },
    { value: 'mahabharata', label: 'Mahābhārata' },
    { value: 'bhagavadgita', label: 'Bhagavad Gītā' },
    { value: 'abhidharmakosa', label: 'Abhidharmakośa' },
  ];

  // Function to handle the search API call
  const handleSearch = async () => {
    // Reset previous search state
    setIsLoading(true);
    setError(null);
    setAdvancedSearchResults(null);

    setQuery(inputValue);
    
    // Create the search parameters
    const searchParams = {
      query: query,
      query_type: queryType,
      search_type: searchType,
      limit: limit
    };
    
    // Add filters based on the selected filter mode
    if (authors.length > 0) {
      searchParams.author = authors.join(',');
    }
    
    if (collections.length > 0) {
      searchParams.collection = collections.join(',');
    }
    
    if (titles.length > 0) {
      searchParams.text_id = titles.join(',');
    }
    
    try {
      // Make the API request
      const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      // Set the search results based on the search type
      setAdvancedSearchResults({
        type: searchType,
        results: data
      });
      
      // Also pass the results to the parent component
      onSearch(data);
      console.log('Search results:', data);
      
    } catch (err) {
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clicking on a text to open it
  const handleOpenText = (textId: string, title: string, segmentNumber?: number, matchedSegments?: number[]) => {
    if (onOpenText) {

      if (advancedSearchResults) {
        if (advancedSearchResults.type === 'books') {
          // Find the book in search results
          const book = advancedSearchResults.results.find((b: BookResult) => b.text_id === textId);
          if (book) {
            // Extract all segment numbers from this book
            setMatchedBookSegments(book.segments.map(segment => segment.segment_number))
          }
        } 
        else if (advancedSearchResults.type === 'segments') {
          // Find all segments that belong to this text
          setMatchedBookSegments(advancedSearchResults.results
            .filter((seg: SegmentResult) => seg.segment_id.split(':')[0] === textId)
            .map((seg: SegmentResult) => seg.segment_number))
        }
      }
      console.log("matched_segments", matchedBookSegments);
      setTargetSegmentNumber(segmentNumber || 0);
      onOpenText(textId, title);
      console.log(segmentNumber);
    }
  };

  return (
    <div className={classes.pageWrapper}>
      <Paper p="md" radius="md" className={classes.optionsContainer}>
        <Title order={2} mb="xs" className={classes.title}>Sanskrit Corpus Search</Title>
        <Text size="sm" color="dimmed" mb="md">
          Search across the Sanskrit collection with additional filters for more specific results.
        </Text>
        
        {/* Search bar at the top */}
        <TextInput
          label="Search Query"
          placeholder="Enter Sanskrit terms or phrase"
          value={inputValue}
          onChange={(event) => setInputValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSearch();
            }
          }}
          className={classes.control}
          classNames={{ input: classes.mainSearchInput }}
          mb="md"
          rightSection={
            isLoading ? <Loader size="xs" /> : <IconSearch size={16} />
          }
        />

        <Stack gap="xs">
          {/* Search type segment control */}
          <div>
            <Text size="sm" fw={500} mb={5}>Result Type</Text>
            <SegmentedControl
              value={searchType}
              onChange={(value) => setSearchType(value as 'segments' | 'books')}
              data={[
                { label: 'Individual Segments', value: 'segments' },
                { label: 'Grouped by Book', value: 'books' },
              ]}
              fullWidth
              classNames={{
                indicator: classes.indicator,
                root: classes.root
              }}
            />
          </div>

          {/* Search mode segment control */}
          <div>
            <Group gap="lg" justify='flex-start'>
              <Text size="sm" fw={500} mb={5}>Search Mode</Text>
              <Tooltip label="Select how terms are matched in the text" position="top-end" withArrow>
                <IconInfoCircle size={14} style={{ 
                  color: 'var(--mantine-color-dimmed)',
                  transform: 'translateY(-4px)'
                }} />
              </Tooltip>
            </Group>
            <SegmentedControl
              value={queryType}
              onChange={setQueryType}
              data={[
                { label: 'Exact', value: 'exact' },
                { label: 'Stemmed', value: 'stemmed' },
                { label: 'Neural', value: 'neural' },
              ]}
              fullWidth
              classNames={{
                indicator: classes.indicator,
                root: classes.root
              }}
            />
          </div>

          {/* Accordion for search settings and filters */}
          <Accordion 
            multiple 
            className={classes.settingsAccordion}
            value={value} 
            onChange={setValue}
            classNames={{
              root: classes.settingsAccordionRoot,
              panel: classes.settingsAccordionPanel,
              item: classes.settingsAccordionItem,
              control: classes.settingsAccordionControl
            }}
          >
            
            {/* Filters Section */}
            <Accordion.Item value="2" className={classes.accordionItem}>
              <Accordion.Control className={classes.accordionHeader}>
                <Text size="sm">Filters</Text>
              </Accordion.Control>
              
              <Accordion.Panel className={classes.accordionPanel}>
                <SegmentedControl
                  value={filterMode}
                  onChange={setFilterMode}
                  data={[
                    { label: 'Include Selected', value: 'include' },
                    { label: 'Exclude Selected', value: 'exclude' },
                  ]}
                  fullWidth
                  classNames={{
                    indicator: classes.indicator,
                    root: classes.root
                  }}
                  mb={16}
                  mt={16}
                />
                
                <div className={classes.inputContainer}>
                  {!isMobile && (
                    <Text size="sm" fw={500} className={classes.fieldLabel}>
                      Titles
                    </Text>
                  )}
                  <MultiSelect
                    placeholder="Select titles"
                    data={titleOptions}
                    value={titles}
                    onChange={setTitles}
                    searchable
                    clearable
                    className={classes.fieldInput}
                    label={isMobile ? "Titles" : undefined}
                    size="xs"
                  />
                </div>

                <div className={classes.inputContainer}>
                  {!isMobile && (
                    <Text size="sm" fw={500} className={classes.fieldLabel}>
                      Authors
                    </Text>
                  )}
                  <MultiSelect
                    placeholder="Filter by author"
                    data={authorOptions}
                    value={authors}
                    onChange={setAuthors}
                    searchable
                    clearable
                    className={classes.fieldInput}
                    label={isMobile ? "Authors" : undefined}
                    size="xs"
                  />
                </div>

                <div className={classes.inputContainer}>
                  {!isMobile && (
                    <Text size="sm" fw={500} className={classes.fieldLabel}>
                      Collections
                    </Text>
                  )}
                  <MultiSelect
                    placeholder="Filter by collection"
                    data={collectionOptions}
                    value={collections}
                    onChange={setCollections}
                    searchable
                    clearable
                    className={classes.fieldInput}
                    label={isMobile ? "Collections" : undefined}
                    size="xs"
                  />
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          <Button 
            className={classes.searchButton}
            onClick={handleSearch} 
            size="md" 
            mt="sm"
            loaderProps={{ type: 'dots' }}
            leftSection={<IconSearch size={14} />}
          >
            Search Texts
          </Button>
        </Stack>
      </Paper>







      {/* Search Results Section */}
{(advancedSearchResults || isLoading || error) && (
  <Paper p="md" radius="md" className={classes.resultsContainer} mt="md">
    <Title order={3} mb="md" className={classes.title}>Search Results</Title>
    
    {isLoading && (
      <div className={classes.loaderContainer}>
        <Loader size="md" />
        <Text mt="xs">Searching Sanskrit texts...</Text>
      </div>
    )}
    
    {error && (
      <div className={classes.errorContainer}>
        <Text color="red" mb="xs">Error: {error}</Text>
        <Button variant="outline" color="red" onClick={handleSearch}>
          Try Again
        </Button>
      </div>
    )}
    
    {advancedSearchResults && !isLoading && !error && (
      <>
        {/* Display segment results - NEW CARD-BASED DESIGN */}
        {advancedSearchResults.type === 'segments' && advancedSearchResults.results.length > 0 && (
          <div className={classes.segmentResults}>
            <Text size="sm" mb="md">
              Found {advancedSearchResults.results.length} matching segments
            </Text>
            
            <Stack spacing="md">
              {advancedSearchResults.results.map((segment: SegmentResult) => (
                <Paper 
                  key={segment.segment_id} 
                  withBorder
                  shadow="xs"
                  p="md"
                  className={classes.segmentCard}
                >
                  {/* Header with metadata */}
                  <Group position="apart" mb="xs">
                    <div>
                      <Group spacing="xs">
                        <Text fw={500} size="sm">{segment.title || 'Unknown Text'}</Text>
                        <Text size="xs" color="dimmed">Segment {segment.segment_number}</Text>
                      </Group>
                    </div>
                    <Group spacing="xs">
                      <Badge 
                        variant="outline" 
                        color={getRankColor(segment.rank)}
                      >
                        {Math.round(segment.rank * 100)}%
                      </Badge>
                      <Tooltip label="Open full text">
                        <ActionIcon 
                          color="blue" 
                          variant="subtle"
                          onClick={() => handleOpenText(
                            segment.segment_id.split(':')[0], 
                            segment.title || 'Unknown Text',
                            segment.segment_number
                          )}
                        >
                          <IconBook size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                  
                  {/* Segment content with highlighted query */}
                  <div className={classes.segmentContent}>
                    <HighlightText 
                      text={segment.text} 
                      query={query}
                    />
                  </div>
                </Paper>
              ))}
            </Stack>
          </div>
        )}
        
        {/* Display book results - IMPROVED ACCORDION DESIGN */}
        {advancedSearchResults.type === 'books' && advancedSearchResults.results.length > 0 && (
          <div className={classes.bookResults}>
            <Text size="sm" mb="md">
              Found {advancedSearchResults.results.length} books with matching content
            </Text>
            
            <Accordion variant="separated">
              {advancedSearchResults.results.map((book: BookResult) => (
                <Accordion.Item 
                  key={book.text_id} 
                  value={book.text_id}
                  className={classes.resultItem}
                >
                  <Accordion.Control>
                    <Group position="apart">
                      <div>
                        <Group align="center" spacing={8}>
                          <Text fw={500}>{book.title}</Text>
                          <Badge size="xs" variant="filled" radius="xl">
                            {book.occurrence_count}
                          </Badge>
                        </Group>
                        <Group spacing={8}>
                          {book.author && (
                            <Text size="xs">by {book.author}</Text>
                          )}
                          <Badge size="sm">{book.collection}</Badge>
                        </Group>
                      </div>
                      <Tooltip label="Open full text">
                        <ActionIcon 
                          color="blue" 
                          variant="subtle"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenText(book.text_id, book.title);
                          }}
                          size="md"
                        >
                          <IconBook size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Accordion.Control>
                  
                  <Accordion.Panel>
                    <Stack gap="sm">
                      {book.segments.map((segment, index) => (
                        <Paper 
                          key={`${book.text_id}-segment-${index}`}
                          p="sm" 
                          withBorder
                          className={classes.segmentDetail}
                        >
                          <Group position="apart" mb="xs">
                            <Text size="xs" fw={500}>
                              Segment {segment.segment_number}
                            </Text>
                            <Group spacing={8}>
                              <Badge 
                                variant="outline" 
                                size="sm"
                                color={getRankColor(segment.rank)}
                              >
                                {Math.round(segment.rank * 100)}%
                              </Badge>
                              <Tooltip label="Go to this segment">
                                <ActionIcon 
                                  size="xs" 
                                  variant="subtle"
                                  onClick={() => handleOpenText(
                                    book.text_id, 
                                    book.title,
                                    segment.segment_number
                                  )}
                                >
                                  <IconChevronRight size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Group>
                          
                          <HighlightText 
                            text={segment.text} 
                            query={query}
                          />
                        </Paper>
                      ))}
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        )}
        
        {/* No results found */}
        {advancedSearchResults.results.length === 0 && (
          <Text className={classes.errorText} my="xl">
            No results found for your search criteria. Try different search terms or filters.
          </Text>
        )}
      </>
    )}
  </Paper>
)}


    </div>
  );
}

// Helper function to get color based on relevance score
function getRankColor(rank: number): string {
  if (rank >= 0.8) return 'green';
  if (rank >= 0.6) return 'teal';
  if (rank >= 0.4) return 'blue';
  if (rank >= 0.2) return 'violet';
  return 'gray';
}

export default AdvancedSearch;