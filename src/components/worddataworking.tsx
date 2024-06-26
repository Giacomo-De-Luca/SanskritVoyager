import InflectionTable from './InflectionTable';



const WordDataComponent = ({ entry }: { entry: any[][] }) => {
    console.log(entry[2]);
    if (entry.length === 7) {
      return (
        <div>
          <h1 className="text-xl" style={{fontFamily:"Garamond", fontWeight:"bold"}}>{entry[0]}</h1>
          {entry[0] !== entry[5] && <p style={{fontFamily:"Garamond"}}>{entry[5]}</p>}
          {entry[0] !== entry[4] && <p><span style={{fontFamily:"Garamond"}}>from:</span> <span style={{fontFamily:"Garamond", fontStyle: "italic"}}>{entry[4]}</span></p>}
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
                          {entry[6].map((item, index) => (  
                                    <p key={index} dangerouslySetInnerHTML={{ __html: item.replace(/<s>(.*?)<\/s>/g, '<span style="font-style:italic; color: teal;">$1</span>') }} />
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
            {entry[2].map((item, index) => (
              <p key={index} dangerouslySetInnerHTML={{ __html: item.replace(/<s>(.*?)<\/s>/g, '<span style="font-style:italic; color: teal;">$1</span>') }} />
            ))}
          </div>
          <hr />
        </div>    
      );
    }
    else {
      return null;
    }
    
  };

export default WordDataComponent;













