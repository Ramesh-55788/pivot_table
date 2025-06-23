import React, { useMemo } from 'react';
import './styles/PivotTable.css';

const calculateAggregation = (values, type) => {
  if (!values?.length) return 0;

  const nums = values.map(Number).filter(v => !isNaN(v));
  if (!nums.length) return 0;

  switch (type) {
    case 'min': return Math.min(...nums);
    case 'max': return Math.max(...nums);
    case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'count':
    case 'sum':
    default: return nums.reduce((a, b) => a + b, 0);
  }
};

const PivotTable = ({ pivotData = {}, rowFields = [], colFields = [], valueAggregations = [] }) => {
  const { pivotMap = new Map(), colKeys = [] } = pivotData;
  const levels = colFields.length;
  const hasRows = rowFields.length > 0;

  const { parsedHeaders, valueFields } = useMemo(() => {
    const map = new Map();

    const headers = colKeys.map(key => {
      const parts = key.split(' | ');
      const last = parts.pop();
      const [, field, agg] = last.match(/(.+) \((.+)\)$/) || [];

      if (field) {
        if (!map.has(field)) map.set(field, new Set());
        map.get(field).add(agg);
      }

      return {
        colLevels: parts,
        valueField: field || '',
        aggregation: agg || '',
        fullKey: key
      };
    });

    return {
      parsedHeaders: headers,
      valueFields: Array.from(map, ([field, aggs]) => ({
        field,
        aggregations: Array.from(aggs)
      }))
    };
  }, [colKeys]);

  const buildHeaders = useMemo(() => {
    const rows = [];

    for (let level = 0; level <= levels; level++) {
      const row = [];

      if (level === 0) {
        row.push(
          <th
            key="corner"
            rowSpan={levels + 1}
            colSpan={hasRows ? rowFields.length : 1}
            className="field-header"
          >
            {hasRows ? rowFields.join(' / ') : 'Row'}
          </th>
        );
      }

      if (level < levels) {
        let prev = null, span = 0, idx = 0;

        for (let i = 0; i <= parsedHeaders.length; i++) {
          const curr = i < parsedHeaders.length ? parsedHeaders[i].colLevels[level] : null;

          if (curr === prev) {
            span++;
          }
          else {
            if (prev !== null) {
              row.push(
                <th key={`h-${level}-${idx++}`} colSpan={span} className="column-header">
                  {prev || '-'}
                </th>
              );
            }
            prev = curr;
            span = 1;
          }
        }
      } 
      else {
        parsedHeaders.forEach(({ aggregation, valueField }, i) => {
          row.push(
            <th key={`vh-${i}`} className="value-header">
              {`${aggregation[0].toUpperCase() + aggregation.slice(1)} of ${valueField}`}
            </th>
          );
        });
      }

      if (level === 0) {
        valueFields.forEach(({ field, aggregations }) =>
          aggregations.forEach(agg => {
            row.push(
              <th
                key={`total-${field}-${agg}`}
                rowSpan={levels + 1}
                className="total-header"
              >
                {`Total ${agg[0].toUpperCase() + agg.slice(1)} of ${field}`}
              </th>
            );
          })
        );
      }

      rows.push(<tr key={`r-${level}`}>{row}</tr>);
    }

    return rows;
  }, [levels, hasRows, rowFields, parsedHeaders, valueFields]);

  const renderBody = useMemo(() => {
    if (!colKeys.length) return [];

    const data = Array.from(pivotMap.entries()).map(([k, v]) => ({
      splitKey: k.split(' | '),
      rowData: v
    })).sort((a, b) =>
      hasRows
        ? rowFields.reduce((acc, _, i) =>
            acc || (a.splitKey[i] < b.splitKey[i] ? -1 : a.splitKey[i] > b.splitKey[i] ? 1 : 0), 0)
        : 0
    );

    const rowSpanMap = new Map();

    if (hasRows) {
      for (let lvl = 0; lvl < rowFields.length; lvl++) {
        let prev = null, count = 0;

        for (let i = 0; i <= data.length; i++) {
          const curr = i < data.length ? data[i].splitKey[lvl] : null;

          if (curr === prev) {
            count++;
          } 
          else {
            if (prev !== null) rowSpanMap.set(`${lvl}-${i - count}`, count);
            prev = curr;
            count = 1;
          }
        }
      }
    }

    const calcTotals = (rowData) => {
      const totals = {};

      valueFields.forEach(({ field, aggregations }) => {
        aggregations.forEach(agg => {
          const values = parsedHeaders
            .filter(h => h.valueField === field && h.aggregation === agg)
            .map(h => rowData[h.fullKey])
            .filter(v => v != null);

          totals[`${field}|${agg}`] = calculateAggregation(values, agg);
        });
      });

      return totals;
    };

    const fmtNum = (num) => num == null ? '' : Number.isInteger(num) ? num : num.toFixed(2);

    const rows = data.map(({ splitKey, rowData }, idx) => {
      const tds = [];

      if (hasRows) {
        for (let lvl = 0; lvl < rowFields.length; lvl++) {
          const key = `${lvl}-${idx}`;

          if (rowSpanMap.has(key)) {
            tds.push(
              <td key={`rk-${key}`} rowSpan={rowSpanMap.get(key)} className="row-header">
                {splitKey[lvl] || '-'}
              </td>
            );
          }
        }
      } 
      else {
        tds.push(
          <td key={`rk-${idx}`} className="row-header">
            {splitKey[0] || 'Total'}
          </td>
        );
      }

      parsedHeaders.forEach(({ fullKey }, i) => {
        tds.push(
          <td key={`c-${idx}-${i}`} className="data-cell">
            {fmtNum(rowData[fullKey] ?? 0)}
          </td>
        );
      });

      const totals = calcTotals(rowData);

      valueFields.forEach(({ field, aggregations }) =>
        aggregations.forEach(agg => {
          const key = `${field}|${agg}`;
          tds.push(
            <td key={`rt-${idx}-${key}`} className="row-total">
              {fmtNum(totals[key])}
            </td>
          );
        })
      );

      return <tr key={`row-${idx}`}>{tds}</tr>;
    });

    const colTotals = parsedHeaders.reduce((acc, { fullKey, aggregation }) => {
      acc[fullKey] = calculateAggregation(
        data.map(d => d.rowData[fullKey]).filter(v => v != null),
        aggregation
      );
      return acc;
    }, {});

    const grandTotals = valueFields.reduce((acc, { field, aggregations }) => {
      aggregations.forEach(agg => {
        const key = `${field}|${agg}`;
        const vals = data.map(({ rowData }) => calcTotals(rowData)[key]).filter(v => v != null);
        acc[key] = calculateAggregation(vals, agg);
      });
      return acc;
    }, {});

    const totalRow = [
      <td key="label" colSpan={rowFields.length || 1} className="total-label">Total</td>,

      ...parsedHeaders.map(({ fullKey }) => (
        <td key={`ct-${fullKey}`} className="column-total">
          {fmtNum(colTotals[fullKey])}
        </td>
      )),

      ...valueFields.flatMap(({ field, aggregations }) =>
        aggregations.map(agg => (
          <td key={`gt-${field}-${agg}`} className="grand-total">
            {fmtNum(grandTotals[`${field}|${agg}`])}
          </td>
        ))
      )
    ];

    rows.push(
      <tr key="totals" className="total-row">
        {totalRow}
      </tr>
    );

    return rows;
  }, [pivotMap, colKeys, hasRows, rowFields, parsedHeaders, valueFields]);

  if (!colKeys.length) {
    return (
      <div className="empty-state">
        <h2>Pivot Table</h2>
      </div>
    );
  }

  return (
    <div className="pivot-table-container">
      <table className="pivot-table">
        <thead>{buildHeaders}</thead>
        <tbody>{renderBody}</tbody>
      </table>
    </div>
  );
};

export default PivotTable;
