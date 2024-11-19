// DictionaryEntry.tsx
import classes from './DictionaryEntry.module.css';

interface DictionaryEntryProps {
  entry: string;
  onWordClick?: (word: string, index: number) => void;
}

function DictionaryEntry({ entry, onWordClick }: DictionaryEntryProps) {
  const processContent = (content: string) => {
    content = content.replace(/&amp;c\./g, '&c.');

    let currentTag = '';
    let buffer = '';
    const result = [];
    let index = 0;
    let inParentheses = false;

    const createStyledSpan = (text: string, tagName: string) => {
      const className = getClassName(tagName);
      const classNames = [];
      
      if (className) classNames.push(classes[className]);
      if (inParentheses) classNames.push(classes.dictParenthetical);
      
      if (classNames.length === 0) return text;

      return (
        <span 
          key={index++} 
          className={classNames.join(' ')}
        >
          {text}
        </span>
      );
    };

    const getClassName = (tag: string): string => {
      switch (tag) {
        case 'hw': return 'dictHeadword';
        case 'ab': return 'dictAbbreviation';
        case 'lex': return 'dictGrammar';
        case 'ls': return 'dictSource';
        case 'etym': return 'dictEtymology';
        case 'def': return 'dictDefinition';
        case 's': return 'dictSanskrit';
        case 's1': return 'dictAuthor';
        case 'gk': return 'dictGreek';
        case 'lang': return 'dictLanguage';
        default: return '';
      }
    };

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '(') {
        if (buffer) {
          if (currentTag) {
            result.push(createStyledSpan(buffer, currentTag));
          } else {
            result.push(buffer);
          }
          buffer = '';
        }
        inParentheses = true;
        buffer = '(';
      } else if (content[i] === ')') {
        buffer += ')';
        if (currentTag) {
          result.push(createStyledSpan(buffer, currentTag));
        } else {
          result.push(
            <span key={index++} className={classes.dictParenthetical}>
              {buffer}
            </span>
          );
        }
        buffer = '';
        inParentheses = false;
      } else if (content[i] === '<') {
        if (content[i + 1] === '/') {
          if (buffer) {
            if (currentTag === 's') {
              const words = buffer.split(/(\s+)/);
              words.forEach((word, wordIndex) => {
                if (word.trim()) {
                  const classNames = [classes.dictSanskrit];
                  if (inParentheses) classNames.push(classes.dictParenthetical);
                  result.push(
                    <span
                      key={`${index}-${wordIndex}`}
                      className={classNames.join(' ')}
                      onClick={() => onWordClick?.(word, index)}
                    >
                      {word}
                    </span>
                  );
                } else {
                  result.push(word);
                }
              });
            } else {
              result.push(createStyledSpan(buffer, currentTag));
            }
            buffer = '';
          }
          while (content[i] !== '>') i++;
          currentTag = '';
        } else {
          if (buffer && !currentTag) {
            if (inParentheses) {
              result.push(
                <span key={index++} className={classes.dictParenthetical}>
                  {buffer}
                </span>
              );
            } else {
              result.push(buffer);
            }
            buffer = '';
          }
          let tagName = '';
          i++;
          while (content[i] !== '>' && i < content.length) {
            tagName += content[i];

            i++;
          }   currentTag = tagName;
        }
      } else {
        buffer += content[i];
      }
    }

    if (buffer) {
      if (currentTag) {
        result.push(createStyledSpan(buffer, currentTag));
      } else if (inParentheses) {
        result.push(
          <span key={index++} className={classes.dictParenthetical}>
            {buffer}
          </span>
        );
      } else {
        result.push(buffer);
      }
    }

    return result;
  };

  return (
    <div className={classes.dictEntry}>
      {processContent(entry)}
    </div>
  );
}

export default DictionaryEntry;