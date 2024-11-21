import React, { useState, useEffect } from 'react';
import { Select } from '@mantine/core'; // Ensure you import Select from your UI library

interface BookSelectProps {
    setBookTitle: (value: string | null) => void;
    bookTitle: string | null;
}

function capitalizeWords(string: string) {
  return string.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}



function BookSelect({ setBookTitle, bookTitle }: BookSelectProps) {
  const [bookTitlesList, setBookTitlesList] = useState<{ value: string; label: string }[]>([]);

  console.log("bookTitle", bookTitle)

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
          value: title,
          label: capitalizeWords(title.replace(/^sa/, '').replace(/^ta/, '').replace(/_/g, ' ')), // Replace initial "sa" and underscores with spaces, then convert to CamelCase

        }));
        console.log('Formatted data:', formattedData); // Debugging statement
        setBookTitlesList(formattedData);
      })
      .catch((error) => {
        console.error('Error loading titles:', error);
      });
  }, []);

  const selectBook = (value: string | null) => {
    setBookTitle(value); // Directly update the parent state
    console.log('Selected book title:', value); // Debugging statement
  };

  return (
    <Select
      data={bookTitlesList}
      value={bookTitle}
      label="Select a book to import"
      placeholder="Pick a book to import"
      searchable
      nothingFoundMessage="Nothing found..."
      onChange={selectBook}
      style={{ width: '100%', paddingTop: 5, paddingBottom: 16 }}
    />
  );
}

export default BookSelect;