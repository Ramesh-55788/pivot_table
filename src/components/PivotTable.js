import React, { useMemo } from 'react';
import './styles/PivotTable.css';

const calculateAggregation = (values, aggregationType) => {
  if (!values || !values.length) return 0;
  const numericValues = values.map(Number).filter(v => !isNaN(v));
  if (!numericValues.length) return 0;

  switch (aggregationType) {
    case 'sum':
    case 'count':
      return numericValues.reduce((total, val) => total + val, 0);
    case 'min':
      return Math.min(...numericValues);
    case 'max':
      return Math.max(...numericValues);
    case 'avg':
      return numericValues.reduce((total, val) => total + val, 0) / numericValues.length;
    default:
      return numericValues.reduce((total, val) => total + val, 0);
  }
};

const PivotTable = ({ pivotData, rowFields, colFields, valueAggregations }) => {
  const { pivotMap = new Map(), colKeys = [] } = pivotData || {};

  const { parsedHeaders, valueFields } = useMemo(() => {
    const valueFieldsMap = new Map();
    const parsedHeaders = colKeys.map(key => {
      const parts = key.split(' | ');
      const valueAggPart = parts.pop();
      const match = valueAggPart.match(/(.+) \((.+)\)$/);
      const valueField = match?.[1] || '';
      const aggregation = match?.[2] || '';
      
      if (valueField && !valueFieldsMap.has(valueField)) {
        valueFieldsMap.set(valueField, new Set());
      }
      valueFieldsMap.get(valueField)?.add(aggregation);
      
      return {
        colLevels: parts,
        valueField,
        aggregation,
        fullKey: key
      };
    });
    
    return {
      parsedHeaders,
      valueFields: Array.from(valueFieldsMap.entries()).map(([field, aggregations]) => ({
        field,
        aggregations: Array.from(aggregations)
      }))
    };
  }, [colKeys]);

  const levels = colFields.length;
  const hasRowFields = rowFields.length > 0;

  const buildColumnHeaders = useMemo(() => {
    const headerRows = [];

    for (let level = 0; level <= levels; level++) {
      const row = [];

      if (level === 0) {
        row.push(
          <th
            key="corner"
            rowSpan={levels > 0 ? levels + 1 : 1}
            colSpan={hasRowFields ? rowFields.length : 1}
            className="field-header"
          >
            {hasRowFields ? rowFields.join(" / ") : 'Row'}
          </th>
        );
      }

      if (level < levels) {
        let prev = null;
        let span = 0;
        let colIndex = 0;
        
        for (let i = 0; i <= parsedHeaders.length; i++) {
          const current = i < parsedHeaders.length ? parsedHeaders[i].colLevels[level] : null;

          if (current === prev) {
            span++;
          } 
          else {
            if (prev !== null) {
              row.push(
                <th
                  key={`header-${level}-${colIndex}`}
                  colSpan={span}
                  className="column-header"
                >
                  {prev || '-'}
                </th>
              );
              colIndex++;
            }
            prev = current;
            span = 1;
          }
        }
      } 
      else {
        parsedHeaders.forEach((header, i) => {
          row.push(
            <th key={`value-header-${i}`} className="value-header">
              {`${header.aggregation.charAt(0).toUpperCase() + header.aggregation.slice(1)} of ${header.valueField}`}
            </th>
          );
        });
      }

      if (level === 0) {
        valueFields.forEach(({ field, aggregations }) => {
          aggregations.forEach(agg => {
            row.push(
              <th 
                key={`total-header-${field}-${agg}`} 
                rowSpan={levels > 0 ? levels + 1 : 1} 
                className="total-header"
              >
                {`Total ${agg.charAt(0).toUpperCase() + agg.slice(1)} of ${field}`}
              </th>
            );
          });
        });
      }

      headerRows.push(<tr key={`header-row-${level}`}>{row}</tr>);
    }

    return headerRows;
  }, [levels, hasRowFields, rowFields, parsedHeaders, valueFields]);

  const renderBody = useMemo(() => {
    if (colKeys.length === 0) return [];

    const data = Array.from(pivotMap.entries()).map(([key, value]) => ({
      splitKey: key.split(" | "),
      rowData: value,
    })).sort((a, b) => {
      if (!hasRowFields) return 0;
      for (let i = 0; i < rowFields.length; i++) {
        if (a.splitKey[i] < b.splitKey[i]) return -1;
        if (a.splitKey[i] > b.splitKey[i]) return 1;
      }
      return 0;
    });

    const rowSpanMap = new Map();
    if (hasRowFields) {
      for (let level = 0; level < rowFields.length; level++) {
        let prev = null;
        let count = 0;
        for (let i = 0; i <= data.length; i++) {
          const curr = i < data.length ? data[i].splitKey[level] : null;
          if (curr === prev) {
            count++;
          }
          else {
            if (prev !== null) {
              rowSpanMap.set(`${level}-${i - count}`, count);
            }
            prev = curr;
            count = 1;
          }
        }
      }
    }

    const calculateTotals = (rowData) => {
      const totals = {};
      valueFields.forEach(({ field, aggregations }) => {
        aggregations.forEach(agg => {
          const relevantCols = parsedHeaders.filter(
            h => h.valueField === field && h.aggregation === agg
          );
          const values = relevantCols
            .map(col => rowData[col.fullKey])
            .filter(v => v !== undefined && v !== null);
          totals[`${field}|${agg}`] = calculateAggregation(values, agg);
        });
      });
      return totals;
    };

    const formatNumber = (num) => {
      if (num == null) return '';
      return Number.isInteger(num) ? num : num.toFixed(2);
    };

    const rows = data.map((item, idx) => {
      const { splitKey, rowData } = item;
      const tds = [];

      if (hasRowFields) {
        for (let level = 0; level < rowFields.length; level++) {
          const key = `${level}-${idx}`;
          if (rowSpanMap.has(key)) {
            tds.push(
              <td
                key={`rowkey-${key}`}
                rowSpan={rowSpanMap.get(key)}
                className="row-header"
              >
                {splitKey[level] || '-'}
              </td>
            );
          }
        }
      }
      else {
        tds.push(
          <td key={`rowkey-${idx}`} className="row-header">
            {splitKey[0] || 'Total'}
          </td>
        );
      }

      parsedHeaders.forEach((header, i) => {
        tds.push(
          <td key={`cell-${idx}-${i}`} className="data-cell">
            {formatNumber(rowData[header.fullKey] ?? 0)}
          </td>
        );
      });

      const rowTotals = calculateTotals(rowData);
      valueFields.forEach(({ field, aggregations }) => {
        aggregations.forEach(agg => {
          const totalKey = `${field}|${agg}`;
          tds.push(
            <td key={`row-total-${idx}-${totalKey}`} className="row-total">
              {formatNumber(rowTotals[totalKey])}
            </td>
          );
        });
      });

      return <tr key={`row-${idx}`}>{tds}</tr>;
    });

    const columnTotals = parsedHeaders.reduce((acc, header) => {
      const values = data.map(item => item.rowData[header.fullKey])
        .filter(v => v !== undefined && v !== null);
      acc[header.fullKey] = calculateAggregation(values, header.aggregation);
      return acc;
    }, {});

    const grandTotals = valueFields.reduce((acc, { field, aggregations }) => {
      aggregations.forEach(agg => {
        const totalKey = `${field}|${agg}`;
        const values = data.map(item => {
          const rowTotals = calculateTotals(item.rowData);
          return rowTotals[totalKey];
        }).filter(v => v !== undefined && v !== null);
        acc[totalKey] = calculateAggregation(values, agg);
      });
      return acc;
    }, {});

    const totalRow = [
      <td key="total-label"
        colSpan={rowFields.length || 1}
        className="total-label">Total</td>
    ];
    
    parsedHeaders.forEach(header => {
      totalRow.push(
        <td key={`col-total-${header.fullKey}`} className="column-total">
          {formatNumber(columnTotals[header.fullKey])}
        </td>
      );
    });
    
    valueFields.forEach(({ field, aggregations }) => {
      aggregations.forEach(agg => {
        const totalKey = `${field}|${agg}`;
        totalRow.push(
          <td key={`grand-total-${totalKey}`} className="grand-total">
            {formatNumber(grandTotals[totalKey])}
          </td>
        );
      });
    });

    rows.push(<tr key="totals" className="total-row">{totalRow}</tr>);
    return rows;
  }, [pivotMap, colKeys, hasRowFields, rowFields, parsedHeaders, valueFields]);

  if (colKeys.length === 0) {
    return (
      <div className="empty-state">
        <h2>Pivot Table</h2>
      </div>
    );
  }

  return (
    <div className="pivot-table-container">
      <table className="pivot-table">
        <thead>{buildColumnHeaders}</thead>
        <tbody>{renderBody}</tbody>
      </table>
    </div>
  );
};

export default PivotTable;