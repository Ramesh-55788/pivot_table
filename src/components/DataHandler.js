import Papa from 'papaparse';

const DataHandler = {
    handleFileUpload: (file, setCsvData, setColumns, setNumericColumns) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const columns = Object.keys(data[0] || {});
                const numericCols = columns.filter(col =>
                    data.some(row => !isNaN(parseFloat(row[col])) && isFinite(row[col]))
                );
                setCsvData(data);
                setColumns(columns);
                setNumericColumns(numericCols);
            },
        });
    },

    generatePivotData: (csvData, rowFields, colFields, valueAggregations) => {
        const pivotMap = new Map();
        const colKeySet = new Set();

        const aggFuncs = {
            sum: arr => arr.reduce((a, b) => a + b, 0),
            avg: arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
            min: arr => arr.length ? Math.min(...arr) : 0,
            max: arr => arr.length ? Math.max(...arr) : 0,
            count: arr => arr.length
        };

        csvData.forEach(row => {
            const rowKey = rowFields.map(f => row[f] || '').join(' | ');
            const colKeyBase = colFields.map(f => row[f] || '').join(' | ');

            if (!pivotMap.has(rowKey)) pivotMap.set(rowKey, {});
            const rowMap = pivotMap.get(rowKey);

            valueAggregations.forEach(({valueField, aggregations}) => {
                aggregations.forEach(agg => {
                    const colKey = colFields.length > 0 
                        ? colKeyBase + ` | ${valueField} (${agg})`
                        : `${valueField} (${agg})`;
                    colKeySet.add(colKey);

                    if (!rowMap[colKey]) rowMap[colKey] = [];

                    const val = parseFloat(row[valueField]);
                    if (agg === 'count' || !isNaN(val)) {
                        rowMap[colKey].push(agg === 'count' ? 1 : val);
                    }
                });
            });
        });

        for (let rowMap of pivotMap.values()) {
            for (let key in rowMap) {
                const parts = key.match(/\((.*?)\)$/);
                const agg = parts ? parts[1] : 'sum';
                rowMap[key] = aggFuncs[agg](rowMap[key]);
            }
        }

        return {
            pivotMap,
            colKeys: Array.from(colKeySet).sort()
        };
    }
};

export default DataHandler;