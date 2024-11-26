import React, { useState, useEffect } from 'react';
import { Select, ComboboxItem, OptionsFilter } from '@mantine/core'; // Ensure you import Select from your UI library

interface BookSelectProps {
    setBookTitle: (value: string | null) => void;
    bookTitle: string | null;
}

function capitalizeWords(string: string) {
  return string.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const removeDiacritics = (str: string | null) => {
  if (str === null) {
    return '';
  }
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const optionsFilter: OptionsFilter = ({ options, search }) => {
  const normalizedSearch = removeDiacritics(search.toLowerCase().trim());
  return (options as ComboboxItem[]).filter((option) => {
    const normalizedValue = removeDiacritics(option.value.toLowerCase().trim());
    return normalizedValue.includes(normalizedSearch);
  });
};

function BookSelect({ setBookTitle, bookTitle }: BookSelectProps) {
  const [bookTitlesList, setBookTitlesList] = useState<{ value: string; label: string; original: string }[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  useEffect(() => {
    // Fetch titles from titles.json
    fetch('/resources/books/titles.json') // Adjust the path as needed
      .then((response) => {
        console.log('Fetch response:', response); // Debugging statement
        if (!response.ok) {
          throw new Error('Failed to fetch titles.json');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Fetched data:', data); // Debugging statement
        // Map the array of strings into the desired format
        const formattedData = data.map((title: string) => ({
          value: removeDiacritics(title.replace(/_/g, ' ').replace(/-/g, ' ')),
          label: capitalizeWords(title.replace(/^sa/, '').replace(/^ta/, '').replace(/_/g, ' ').replace(/-/g, ' ')), // Replace initial "sa" and underscores with spaces, then convert to CamelCase
          original: title
        }));
        console.log('Formatted data:', formattedData); // Debugging statement
        setBookTitlesList(formattedData);
      })
      .catch((error) => {
        console.error('Error loading titles:', error);
      });
  }, []);

  const selectBook = (value: string | null) => {
    const selectedBook = bookTitlesList.find(book => book.value === value);
    const originalValue = selectedBook ? selectedBook.original : null;
    setBookTitle(originalValue); // Directly update the parent state with the original value
    setSelectedValue(value); // Update the local state with the transformed value
    console.log('Selected book title:', originalValue); // Debugging statement
  };

  return (
    <Select
      data={bookTitlesList.map(({ value, label }) => ({ value, label }))}
      value={selectedValue}
      label="Select a book to import"
      placeholder="Pick a book to import"
      searchable
      nothingFoundMessage="Nothing found..."
      onChange={selectBook}
      filter={optionsFilter}
      style={{ width: '100%', paddingTop: 5, paddingBottom: 16 }}
      autoCorrect="off"
      spellCheck={false} 
    />
  );
}

export default BookSelect;