import React from 'react';
import './styles/PivotTable.css';

const PivotTable = ({ pivotData, rowFields, colFields, valueFields, aggregations }) => {
  const { pivotMap = new Map(), colKeys = [] } = pivotData || {};

  const splitHeaders = colKeys.map(key => key.split(' | '));
  const levels = colFields.length + 1;

  const buildHeader = () => {
    const headerRows = [];
    const hasRowFields = rowFields.length > 0;
    const isSingleColumnAndValue = colFields.length >= 1 && rowFields.length === 0;

    for (let level = 0; level < levels; level++) {
      const row = [];

      if (level === 0) {
        row.push(
          <th
            key="corner"
            rowSpan={levels}
            colSpan={hasRowFields ? rowFields.length : 1}
            style={{ backgroundColor: '#eee' }}
          >
            {hasRowFields ? rowFields.join(" / ") : 'Row'}
          </th>
        );
      }

      let prev = null;
      let span = 0;

      for (let i = 0; i <= splitHeaders.length; i++) {
        const current = i < splitHeaders.length ? splitHeaders[i][level] : null;

        if (current === prev) {
          span++;
        } 
        else {
          if (prev !== null) {
            row.push(
              <th
                key={`header-${level}-${i}`}
                colSpan={span}
                style={{ backgroundColor: '#eee' }}
              >
                {prev || '-'}
              </th>
            );
          }
          prev = current;
          span = 1;
        }
      }

      if ((isSingleColumnAndValue || hasRowFields) && level === 0) {
        row.push(
          <th key="total" rowSpan={levels} style={{ backgroundColor: '#eee' }}>
            Total
          </th>
        );
      }

      headerRows.push(<tr key={`header-row-${level}`}>{row}</tr>);
    }

    return headerRows;
  };

  const renderBody = () => {
    const colTotals = new Array(colKeys.length).fill(0);
    let grandTotal = 0;
    const rows = [];

    const data = Array.from(pivotMap.entries()).map(([key, value]) => ({
      splitKey: key.split(" | "),
      rowData: value,
    }));

    data.sort((a, b) => {
      if (rowFields.length === 0) return 0;
      for (let i = 0; i < rowFields.length; i++) {
        if (a.splitKey[i] < b.splitKey[i]) return -1;
        if (a.splitKey[i] > b.splitKey[i]) return 1;
      }
      return 0;
    });

    const rowSpanMap = new Map();
    if (rowFields.length > 0) {
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

    data.forEach((item, idx) => {
      const { splitKey, rowData } = item;
      const tds = [];

      if (rowFields.length > 0) {
        for (let level = 0; level < rowFields.length; level++) {
          const key = `${level}-${idx}`;
          if (rowSpanMap.has(key)) {
            tds.push(
              <td
                key={`rowkey-${key}`}
                rowSpan={rowSpanMap.get(key)}
                style={{ backgroundColor: '#f9f9f9' }}
              >
                {splitKey[level] || '-'}
              </td>
            );
          }
        }
      } 
      else {
        tds.push(
          <td key={`rowkey-${idx}`} style={{ backgroundColor: '#f9f9f9' }}>
            {splitKey[0] || 'Total'}
          </td>
        );
      }

      let rowTotal = 0;
      colKeys.forEach((col, i) => {
        const val = rowData[col] ?? 0;
        tds.push(
          <td key={`cell-${idx}-${i}`} align="right">
            {val.toFixed(2)}
          </td>
        );
        colTotals[i] += val;
        rowTotal += val;
      });

      tds.push(
        <td key={`row-total-${idx}`} align="right">
          <b>{rowTotal.toFixed(2)}</b>
        </td>
      );

      grandTotal += rowTotal;
      rows.push(<tr key={`row-${idx}`}>{tds}</tr>);
    });

    const totalRow = [
      <td
        key="total-label"
        colSpan={rowFields.length || 1}
        style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}
      >
        Total
      </td>,
      ...colTotals.map((v, i) => (
        <td
          key={`col-total-${i}`}
          align="right"
          style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}
        >
          {v.toFixed(2)}
        </td>
      )),
      <td
        key="grand-total"
        align="right"
        style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}
      >
        {grandTotal.toFixed(2)}
      </td>,
    ];

    rows.push(<tr key="totals">{totalRow}</tr>);
    return rows;
  };

  return (
    <table border={1} cellPadding={4} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>{buildHeader()}</thead>
      <tbody>{renderBody()}</tbody>
    </table>
  );
};

export default PivotTable;
