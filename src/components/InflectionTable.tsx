
interface InflectionTableProps {
    inflection_wordsIAST: string[] | null;
    rowcolstitles: Array<[number, number]> | null;
  }

  
  function InflectionTable({ inflection_wordsIAST, rowcolstitles }: InflectionTableProps) {
    
    if (!inflection_wordsIAST || !Array.isArray(inflection_wordsIAST)) {
        return null;
    }

    if (inflection_wordsIAST.length <= 1) {
        return <b>indeclinable</b>;
    }

    let rowtitles = ["First", "Second", "Third"];
    let coltitles = ["Sg", "Du", "Pl"];

    if (inflection_wordsIAST.length === 24) {
        rowtitles = ["Nom", "Acc", "Inst", "Dat", "Abl", "Gen", "Loc", "Voc"];
    }

    let table = [];
    for (let i = 0; i < inflection_wordsIAST.length; i += coltitles.length) {
        table.push(inflection_wordsIAST.slice(i, i + coltitles.length));
    }

    if (inflection_wordsIAST.length === 24) {
        let vocIndex = rowtitles.indexOf('Voc');
        let vocRow = table.splice(vocIndex, 1)[0];
        table.splice(1, 0, vocRow);
        rowtitles.splice(vocIndex, 1);
        rowtitles.splice(1, 0, 'Voc');
    }

    let boldMap: { [key: string]: { [key: string]: boolean } } = {};
    if (!Array.isArray(rowcolstitles)) {
        console.error('rowcolstitles is not an array:', rowcolstitles);
        return null;
    }
    for (let rowcol of rowcolstitles) {
        let [row, col] = rowcol;
        if (!boldMap[row]) {
            boldMap[row] = {};
        }
        boldMap[row][col] = true;
    }

    return (
        <table style={{ border: '1px solid' }}>
            <thead>
                <tr>
                    <th></th>
                    {coltitles.map((title, index) => <th key={index}>{title}</th>)}
                </tr>
            </thead>
            <tbody>
                {table.map((row, i) => (
                    <tr key={i}>
                        <td>{rowtitles[i]}</td>
                        {row.map((cell, j) => (
                            <td key={j}>
                                {boldMap[rowtitles[i]] && boldMap[rowtitles[i]][coltitles[j]] ? <b>{cell}</b> : cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default InflectionTable;