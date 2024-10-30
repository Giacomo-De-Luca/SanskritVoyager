import InflectionTable from './InflectionTable';
import { fetchWordData } from '../pages/Api';
import { useState, useEffect } from 'react';



interface WordDataComponentProps {
  wordData: any[][][];
  setWordData: React.Dispatch<React.SetStateAction<any[][][]>>;
}

const WordDataComponent = ({ wordData, setWordData }: WordDataComponentProps) => {


  const handleWordClick = async (word: string, index: number) => {
    console.log(`Clicked word: ${word}`);
    console.log(`Index: ${index}`);
    fetchWordData(word).then(data => {
      console.log(data);  
      setWordData(prevWordData => {
        // Create a copy of the previous state
        const newData = [...prevWordData];
        // Insert the new data at index + 1
        newData.splice(index + 1, 0, ...data);
        console.log(newData);
        return newData;
      });
    });
  }
  

  return (
    <>
      {wordData && wordData.map((entry, index) => {
        console.log(entry[2]);
        if (entry.length === 7) {
          return (
            <div>
              <h1 className="text-xl" style={{  
                fontFamily: "Optima, sans-serif", 
                // textTransform: "uppercase",
                fontWeight: "bold"}}>
                {entry[0]}
              </h1>
              {entry[0] !== entry[5] && <p style={{fontFamily:"Optima"}}>{entry[5]}</p>}
              {entry[0] !== entry[4] && <p><span style={{fontFamily:"Garamond"}}>from:</span> <span style={{fontFamily:"Garamond", fontStyle: "italic", fontWeight:"bold"}}>{entry[4]}</span></p>}
              <p>{entry[1]}</p>
              {entry[2] && entry[2].map((inflection, index) => {
                let caseAbbr = inflection[0];
                let numberAbbr = inflection[1];

                let caseFull;
                switch (caseAbbr.trim()) {
                  case 'Nom': caseFull = 'Nominative'; break;
                  case 'Acc': caseFull = 'Accusative'; break;
                  case 'Voc': caseFull = 'Vocative'; break;
                  case 'Inst': caseFull = 'Instrumental'; break;
                  case 'Dat': caseFull = 'Dative'; break;
                  case 'Abl': caseFull = 'Ablative'; break;
                  case 'Gen': caseFull = 'Genitive'; break;
                  case 'Loc': caseFull = 'Locative'; break;
                  default: caseFull = caseAbbr;
                }

                let numberFull;
                switch (numberAbbr.trim()) {
                  case 'Sg': numberFull = 'Singular'; break;
                  case 'Du': numberFull = 'Dual'; break;
                  case 'Pl': numberFull = 'Plural'; break;
                  default: numberFull = numberAbbr;
                }

                return (
                  <span key={index} style={{fontFamily:"Garamond", fontStyle: "italic"}}>
                    {caseFull}, {numberFull}
                    {index < entry[2].length - 1 && ' or '}
                  </span>
                );
              })}
              
                          <InflectionTable inflection_wordsIAST={entry[3]} rowcolstitles={entry[2]} />     
                          <div>

                            Vocabulary entries:

                              {entry[6].map((item: string, index: number) => (  
                                <p key={index}>
                                  {item.split(/<s>(.*?)<\/s>/g).map((segment: string, i: number) => {
                                    if (i % 2 === 1) { // the words inside <s> and </s> are at odd indices
                                      const cleanedSegment = segment.replace(/<[^>]*>/g, '');
                                      return cleanedSegment.split(/(\s(?=\w)|—(?=\w)|-(?=\w)|\/(?=\w))/).map((word: string, j: number) => (
                                        <span
                                          key={j}
                                          style={{fontStyle: 'italic', color: 'teal'}}
                                          onClick={() => handleWordClick(word, index)}
                                        >
                                          {word}
                                        </span>
                                      ));
                                    } else {
                                      const cleanedSegment = segment.replace(/<[^>]*>/g, '');
                                      return cleanedSegment;

                                    }
                                  })}
                                </p>
                              ))}
                          </div>  
                        <hr />
                  </div>
          );
        } else if (entry.length === 3) {
          return(
            <div>
              <h1 className="text-xl" style={{fontFamily:"Garamond", fontWeight:"bold"}}>{entry[0]}</h1>
              <p>{entry[1]}</p>
              <div>
                Vocabulary entries:
                {entry[2].map((item: string, index: number) => (  
                                <p key={index}>
                                  {item.split(/<s>(.*?)<\/s>/g).map((segment: string, i: number) => {
                                    if (i % 2 === 1) { // the words inside <s> and </s> are at odd indices
                                      const cleanedSegment = segment.replace(/<[^>]*>/g, '');
                                      return cleanedSegment.split(/(\s(?=\w)|—(?=\w)|-(?=\w))/).map((word: string, j: number) => (
                                        <span
                                          key={j}
                                          style={{fontStyle: 'italic', color: 'teal'}}
                                          onClick={() => handleWordClick(word, index)}
                                        >
                                          {word}
                                        </span>
                                      ));
                                    } else {
                                      const cleanedSegment = segment.replace(/<[^>]*>/g, '');
                                      return cleanedSegment;

                                    }
                                  })}
                                </p>
                 ))}
              </div>
              <hr />
            </div>    
          );
        }
        else {
          return null;
        }
      })}        
    </>
  );
    
  };

export default WordDataComponent;
















