import InflectionTable from './InflectionTable';


type WordDataComponentProps = {
  title: string;
  title_constituent: string;
  vocabularyEntries: string[];
  original_word?: string | null;
  description?: string | null;
  inflections?: string[][];
  inflection_wordsIAST?: string[];
};


const WordDataComponent = ({
  title,
  title_constituent,
  vocabularyEntries,
  original_word,
  description,
  inflections,
  inflection_wordsIAST
}: WordDataComponentProps) => {

    return(


        <div>
          {title && <h1 className="text-xl" style={{fontFamily:"Garamond", fontWeight:"bold"}}>{title}</h1>}
          {title_constituent && title !== title_constituent && <p style={{fontFamily:"Garamond"}}>{title_constituent}</p>}
          {original_word && title !== original_word && <p><span style={{fontFamily:"Garamond"}}>from:</span> <span style={{fontFamily:"Garamond", fontStyle: "italic"}}>{original_word}</span></p>}
          {description && <p>{description}</p> }
          {inflections && inflections.map((inflection, index) => {
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
                {index < inflections.length - 1 && ' or '}
              </span>
            );
            })}
          
            
          
            <div>
            {vocabularyEntries.map((item, index) => (  
                <p key={index} dangerouslySetInnerHTML={{ __html: item.replace(/<s>(.*?)<\/s>/g, '<span style="font-style:italic; color: teal;">$1</span>') }} />
            ))}
            </div>              
            <hr />      
      </div>
    );
    } 

export default WordDataComponent;



















