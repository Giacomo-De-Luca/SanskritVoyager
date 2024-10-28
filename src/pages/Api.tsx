export async function fetchWordData(word : string) {
    console.log('Posting word to API:', word);  // Print the word

    try {
        const response = await fetch('https://api.yogasutratrees.com/process', {
            method: 'POST',
            headers: { 
                'Content-Type': 'text/plain'
            },
            body: word
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function transliterateText(inputText: string, value: any) {
    if (inputText && value) {
      const response = await fetch('https://api.yogasutratrees.com/transliterate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          transliteration_scheme: value.value,
        }),
      });
  
      if (!response.ok) {
        console.error('An error occurred while transliterating the text');
        return;
      }
  
      const processedText = await response.json();
      return processedText;
    } else {
      console.error('Missing text or transliteration_scheme');
    }
  }

  export async function handleTranslate(inputText: string) {
    
    const response = await fetch('https://api.yogasutratrees.com/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
        }),
      });
  
      if (!response.ok) {
        console.error('An error occurred while transliterating the text');
        return;
      }
  
      const translatedText = await response.json();
      console.log(translatedText);
      return translatedText;
    
  }

  
