import React, { useState } from 'react';
import { 
  SegmentedControl, 
  TextInput, 
  MultiSelect, 
  Button, 
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
  Tooltip,
  Collapse
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconSearch, 
  IconBook, 
  IconChevronDown, 
  IconChevronUp,
  IconExternalLink,
  IconAdjustments,
  IconFilter
} from '@tabler/icons-react';
import classes from './AdvancedSearch.module.css';
import { BookResult, SearchResult, SegmentResult } from '../types/bookTypes';

interface AdvancedSearchProps {
  advancedSearchResults: SearchResult | null;
  setAdvancedSearchResults: (results: SearchResult | null) => void;
  onSearch: (params: any) => void;
  onOpenText?: (textId: string, title: string) => void;
}

function AdvancedSearch({ advancedSearchResults, setAdvancedSearchResults, onSearch, onOpenText }: AdvancedSearchProps) {
  const [queryType, setQueryType] = useState('exact');
  const [filterMode, setFilterMode] = useState('include');
  const [searchType, setSearchType] = useState<'segments' | 'books'>('segments');
  const [query, setQuery] = useState('');
  const [authors, setAuthors] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [limit, setLimit] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for collapsible panels
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);
  const [configOpened, { toggle: toggleConfig }] = useDisclosure(true);
  
  // Mock data for dropdowns
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

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setAdvancedSearchResults(null);
    
    const searchParams = {
      query: query,
      query_type: queryType,
      search_type: searchType,
      limit: limit
    };
    
    if (authors.length > 0) searchParams.author = authors.join(',');
    if (collections.length > 0) searchParams.collection = collections.join(',');
    if (titles.length > 0) searchParams.text_id = titles.join(',');
    
    try {
      const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setAdvancedSearchResults({ type: searchType, results: data });
      onSearch(data);
    } catch (err) {
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenText = (textId: string, title: string) => {
    if (onOpenText) onOpenText(textId, title);
  };
  
  // Count total active filters
  const totalActiveFilters = authors.length + collections.length + titles.length;

  return (
    <div className={classes.pageWrapper}>
      <Paper p="md" radius="md" className={classes.container}>
        <Title order={2} mb="xs" className={classes.title}>
          Sanskrit Text Search
        </Title>
        
        {/* Search Input */}
        <div className={classes.searchInputWrapper}>
          <TextInput
            placeholder="Enter Sanskrit term or phrase"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch();
            }}
            className={classes.searchInput}
            rightSection={
              isLoading ? <Loader size="xs" /> : (
                <ActionIcon onClick={handleSearch} variant="subtle">
                  <IconSearch size={16} />
                </ActionIcon>
              )
            }
          />
          
          <Button 
            className={classes.searchButton}
            onClick={handleSearch} 
            size="sm"
            variant="light"
            style={{ color: 'var(--mantine-color-lightscale-6)' }}
            loading={isLoading}
            loaderProps={{ type: 'dots' }}
          >
            Search
          </Button>
        </div>

        {/* Collapsible Configuration Section */}
        <div className={classes.collapsibleSection}>
          <Group position="apart" mb={5} className={classes.sectionHeader} onClick={toggleConfig}>
            <Group spacing={8}>
              <IconAdjustments size={16} />
              <Text size="sm" fw={600}>Search Configuration</Text>
            </Group>
            <ActionIcon variant="subtle" size="sm">
              {configOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>
          
          <Collapse in={configOpened}>
            <div className={classes.sectionContent}>
              <Text size="sm" fw={500} mb={5}>Result Display</Text>
              <SegmentedControl
                value={searchType}
                onChange={setSearchType}
                data={[
                  { label: 'Individual Segments', value: 'segments' },
                  { label: 'Grouped by Book', value: 'books' },
                ]}
                fullWidth
                classNames={{
                  indicator: classes.indicator,
                  root: classes.root
                }}
                mb={10}
              />
              
              <Text size="sm" fw={500} mb={5}>Match Method</Text>
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
          </Collapse>
        </div>

        {/* Collapsible Filter Section */}
        <div className={classes.collapsibleSection}>
          <Group position="apart" mb={5} className={classes.sectionHeader} onClick={toggleFilters}>
            <Group spacing={8}>
              <IconFilter size={16} />
              <Text size="sm" fw={600}>Filters</Text>
              {totalActiveFilters > 0 && (
                <Badge size="xs" variant="filled" className={classes.filterBadge}>
                  {totalActiveFilters}
                </Badge>
              )}
            </Group>
            <ActionIcon variant="subtle" size="sm">
              {filtersOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>
          </Group>
          
          <Collapse in={filtersOpened}>
            <div className={classes.sectionContent}>
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
                mb={10}
              />
              
              <div className={classes.inputContainer}>
                <Text size="sm" className={classes.fieldLabel}>
                  Titles 
                  {titles.length > 0 && (
                    <Badge size="xs" variant="filled" className={classes.filterBadge}>
                      {titles.length}
                    </Badge>
                  )}
                </Text>
                <MultiSelect
                  placeholder="Select texts"
                  data={titleOptions}
                  value={titles}
                  onChange={setTitles}
                  searchable
                  clearable
                  className={classes.fieldInput}
                  size="xs"
                />
              </div>

              <div className={classes.inputContainer}>
                <Text size="sm" className={classes.fieldLabel}>
                  Authors
                  {authors.length > 0 && (
                    <Badge size="xs" variant="filled" className={classes.filterBadge}>
                      {authors.length}
                    </Badge>
                  )}
                </Text>
                <MultiSelect
                  placeholder="By author"
                  data={authorOptions}
                  value={authors}
                  onChange={setAuthors}
                  searchable
                  clearable
                  className={classes.fieldInput}
                  size="xs"
                />
              </div>

              <div className={classes.inputContainer}>
                <Text size="sm" className={classes.fieldLabel}>
                  Collections
                  {collections.length > 0 && (
                    <Badge size="xs" variant="filled" className={classes.filterBadge}>
                      {collections.length}
                    </Badge>
                  )}
                </Text>
                <MultiSelect
                  placeholder="By collection"
                  data={collectionOptions}
                  value={collections}
                  onChange={setCollections}
                  searchable
                  clearable
                  className={classes.fieldInput}
                  size="xs"
                />
              </div>
            </div>
          </Collapse>
        </div>
      </Paper>

      {/* Search Results Section */}
      {(advancedSearchResults || isLoading || error) && (
        <Paper p="md" radius="md" className={classes.resultsContainer} mt="md" withBorder>
          <Group position="apart" mb="md">
            <Title order={3} className={classes.title}>Search Results</Title>
            {advancedSearchResults && !isLoading && (
              <Group spacing="xs">
                <Badge variant="light" style={{ backgroundColor: 'var(--mantine-color-lightscale-5)' }}>
                  {advancedSearchResults.results.length} Results
                </Badge>
              </Group>
            )}
          </Group>
          
          {isLoading && (
            <div className={classes.loaderContainer}>
              <Loader size="md" />
              <Text mt="xs">Searching Sanskrit texts...</Text>
            </div>
          )}
          
          {error && (
            <div className={classes.errorContainer}>
              <Text style={{ color: 'var(--mantine-color-red-6)' }} mb="xs">Error: {error}</Text>
              <Button variant="outline" style={{ color: 'var(--mantine-color-red-6)' }} onClick={handleSearch}>
                Try Again
              </Button>
            </div>
          )}
          
          {advancedSearchResults && !isLoading && !error && (
            <>
              {/* Display segment results */}
              {advancedSearchResults.type === 'segments' && advancedSearchResults.results.length > 0 && (
                <div className={classes.segmentResults}>
                  <Text size="sm" mb="md">
                    Found {advancedSearchResults.results.length} matching segments
                  </Text>
                  
                  <Accordion variant="separated">
                    {advancedSearchResults.results.map((segment: SegmentResult) => (
                      <Accordion.Item 
                        key={segment.segment_id} 
                        value={segment.segment_id}
                        className={classes.resultItem}
                      >
                        <Accordion.Control>
                          <Group position="apart">
                            <div>
                              <Text fw={600}>{segment.title || 'Unknown Text'}</Text>
                              <Group spacing={4}>
                                <Text size="xs" style={{ color: 'var(--mantine-color-dimmed)' }}>
                                  Segment {segment.segment_number}
                                </Text>
                                {segment.collection && (
                                  <Badge size="xs" variant="dot" style={{ backgroundColor: 'var(--mantine-color-lightscale-5)' }}>
                                    {segment.collection}
                                  </Badge>
                                )}
                              </Group>
                            </div>
                            <Badge 
                              variant="light" 
                              style={{ backgroundColor: getLightscaleColorForRank(segment.rank) }}
                            >
                              {Math.round(segment.rank * 100)}%
                            </Badge>
                          </Group>
                        </Accordion.Control>
                        
                        <Accordion.Panel>
                          <Box className={`${classes.sanskritText} ${classes.textSegment}`}>
                            {highlightMatchedText(segment.text, query)}
                          </Box>
                          <Divider my="sm" variant="dashed" />
                          <Group position="right">
                            <Button 
                              variant="subtle" 
                              size="xs"
                              leftSection={<IconBook size={14} />}
                              onClick={() => handleOpenText(
                                segment.segment_id.split(':')[0], 
                                segment.title || 'Unknown Text'
                              )}
                            >
                              Open Full Text
                            </Button>
                          </Group>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </div>
              )}
              
              {/* Display book results */}
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
                              <Text fw={600}>{book.title}</Text>
                              <Group spacing={8}>
                                {book.author && (
                                  <Text size="xs">by {book.author}</Text>
                                )}
                                <Badge size="sm" style={{ backgroundColor: 'var(--mantine-color-lightscale-2)' }}>
                                  {book.collection}
                                </Badge>
                                <Text size="xs">
                                  {book.occurrence_count} matching segments
                                </Text>
                              </Group>
                            </div>
                            <Button 
                              variant="subtle" 
                              size="xs"
                              rightSection={<IconExternalLink size={16} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenText(book.text_id, book.title);
                              }}
                            >
                              Open Text
                            </Button>
                          </Group>
                        </Accordion.Control>
                        
                        <Accordion.Panel>
                          <div className={classes.segmentList}>
                            {book.segments.map((segment, index) => (
                              <Paper 
                                key={`${book.text_id}-segment-${index}`}
                                p="sm" 
                                withBorder
                                className={`${classes.segmentDetail} ${classes.textSegment}`}
                              >
                                <Group position="apart" mb="xs">
                                  <Text size="xs" style={{ fontWeight: 500 }}>
                                    Segment {segment.segment_number}
                                  </Text>
                                  <Badge 
                                    variant="outline" 
                                    size="sm"
                                    style={{ color: getLightscaleColorForRank(segment.rank) }}
                                  >
                                    Match: {Math.round(segment.rank * 100)}%
                                  </Badge>
                                </Group>
                                <Text className={classes.sanskritText}>
                                  {highlightMatchedText(segment.text, query)}
                                </Text>
                              </Paper>
                            ))}
                          </div>
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

// Helper function to get lightscale color based on relevance score
function getLightscaleColorForRank(rank: number): string {
  if (rank >= 0.8) return 'var(--mantine-color-lightscale-8)';
  if (rank >= 0.6) return 'var(--mantine-color-lightscale-6)';
  if (rank >= 0.4) return 'var(--mantine-color-lightscale-5)';
  if (rank >= 0.2) return 'var(--mantine-color-lightscale-4)';
  return 'var(--mantine-color-lightscale-3)';
}

// Function to highlight matched text
function highlightMatchedText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  
  const terms = query.toLowerCase()
    .replace(/[&|]/g, ' ')
    .split(' ')
    .filter(term => term.length > 1);
  
  if (terms.length === 0) return text;
  
  const parts = [];
  let lastIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    for (const term of terms) {
      if (i + term.length <= text.length) {
        const substr = text.substring(i, i + term.length).toLowerCase();
        if (substr === term) {
          if (i > lastIndex) {
            parts.push(text.substring(lastIndex, i));
          }
          
          parts.push(
            <span key={i} style={{ 
              backgroundColor: 'var(--mantine-color-lightscale-3)',
              padding: '0 2px',
              borderRadius: '3px'
            }}>
              {text.substring(i, i + term.length)}
            </span>
          );
          
          lastIndex = i + term.length;
          i += term.length - 1;
          break;
        }
      }
    }
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

export default AdvancedSearch;

{/* Configuration Section */}
<Accordion.Item value="1" className={classes.accordionItem}>
<Accordion.Control className={classes.accordionHeader}>
    <Text size="sm">Search Configuration</Text>
</Accordion.Control>

<Accordion.Panel className={classes.accordionPanel}>
  
  
  <Group gap="xs" align="center" mb={5}>
    <Text size="sm" fw={500}>Search Mode</Text>
    <Tooltip label="Select how terms are matched in the text" position="top-end" withArrow>
      <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
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
    mb={10}
  />




</Accordion.Panel>
</Accordion.Item>
