import React, { useState } from 'react';
import './styles/PivotControls.css';

const PivotControls = ({
  columns,
  numericColumns,
  rowFields,
  colFields,
  valueFields,
  setRowFields,
  setColFields,
  setValueFields,
}) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const measureColumns = numericColumns;

  const handleDragStart = (e, field) => {
    setDraggedItem(field);
    e.dataTransfer.setData('text/plain', field);
  };

  const handleDrop = (e, targetArea) => {
    e.preventDefault();
    if (!draggedItem) return;

    const field = draggedItem;
    const isMeasure = measureColumns.includes(field);

    if ((targetArea === 'row' || targetArea === 'col') && isMeasure) return;
    if (targetArea === 'value' && !isMeasure) return;

    if (targetArea === 'row' && !rowFields.includes(field)) {
      setRowFields([...rowFields, field]);
    }
    else if (targetArea === 'col' && !colFields.includes(field)) {
      setColFields([...colFields, field]);
    }
    else if (targetArea === 'value') {
      setValueFields([...valueFields, { field, aggregation: 'sum' }]);
    } 
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemoveField = (field, area, index) => {
    if (area === 'row') setRowFields(rowFields.filter(f => f !== field));
    else if (area === 'col') setColFields(colFields.filter(f => f !== field));
    else if (area === 'value') setValueFields(valueFields.filter((_, i) => i !== index));
  };

  const handleAggregationChange = (index, aggregation) => {
    setValueFields(valueFields.map((vf, i) => i === index ? { ...vf, aggregation } : vf));
  };

  const availableFields = columns.filter(
    field => !rowFields.includes(field) && !colFields.includes(field)
  );

  const getFieldTypeClass = (field) => {
    return measureColumns.includes(field) ? 'measure-field' : 'dimension-field';
  };

  return (
    <div className="pivot-controls">
      <div className="fields-container">
        <h3>Available Fields</h3>
        <div className="fields-list">
          {availableFields.map(field => (
            <div
              key={field}
              className={`field-item ${getFieldTypeClass(field)}`}
              draggable
              onDragStart={(e) => handleDragStart(e, field)}
              title={measureColumns.includes(field) ? "Measure (can only be used in Values)" : "Dimension (can be used in Rows or Columns)"}
            >
              {field}
            </div>
          ))}
        </div>
      </div>

      <div className="drop-area rows-area"
        onDrop={(e) => handleDrop(e, 'row')}
        onDragOver={handleDragOver}
      >
        <h3>Rows</h3>
        {rowFields.map(field => (
          <div key={field} className="field-item dimension-field">
            {field}
            <button onClick={() => handleRemoveField(field, 'row')}>×</button>
          </div>
        ))}
      </div>

      <div className="drop-area cols-area"
        onDrop={(e) => handleDrop(e, 'col')}
        onDragOver={handleDragOver}
      >
        <h3>Columns</h3>
        {colFields.map(field => (
          <div key={field} className="field-item dimension-field">
            {field}
            <button onClick={() => handleRemoveField(field, 'col')}>×</button>
          </div>
        ))}
      </div>

      <div className="drop-area values-area" 
      onDrop={(e) => handleDrop(e, 'value')}
      onDragOver={handleDragOver}
      >
        <h3>Values</h3>
        {valueFields.map(({ field, aggregation }, index) => (
          <div key={`${field}-${index}`} className="field-item measure-field">
            {`${field} `}
            <select value={aggregation} onChange={(e) => handleAggregationChange(index, e.target.value)}>
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
              <option value="count">Count</option>
            </select>
            <button onClick={() => handleRemoveField(field, 'value', index)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PivotControls;