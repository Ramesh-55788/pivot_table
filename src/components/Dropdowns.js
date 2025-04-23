import React from 'react';
import './styles/Dropdowns.css';

const Dropdowns = ({
    columns,
    numericColumns,
    rowFields,
    colFields,
    valueAggregations,
    setRowFields,
    setColFields,
    setValueAggregations
}) => {
    // Compute dimension fields by filtering out numeric columns
    const dimensionColumns = columns.filter(col => !numericColumns.includes(col));

    const handleRowFieldChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
        setRowFields(selected);
    };

    const handleColFieldChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
        setColFields(selected);
    };

    const handleAddValueField = () => {
        if (numericColumns.length > 0) {
            const firstAvailable = numericColumns.find(col => 
                !valueAggregations.some(va => va.valueField === col)
            ) || numericColumns[0];
            
            setValueAggregations([
                ...valueAggregations,
                { valueField: firstAvailable, aggregations: ['sum'] }
            ]);
        }
    };

    const handleRemoveValueField = (index) => {
        setValueAggregations(valueAggregations.filter((_, i) => i !== index));
    };

    const handleValueFieldChange = (index, value) => {
        const updated = [...valueAggregations];
        updated[index].valueField = value;
        setValueAggregations(updated);
    };

    const handleAggregationChange = (index, agg) => {
        const updated = [...valueAggregations];
        const currentAggregations = updated[index].aggregations;
        
        if (currentAggregations.includes(agg)) {
            updated[index].aggregations = currentAggregations.filter(a => a !== agg);
        } else {
            updated[index].aggregations = [...currentAggregations, agg];
        }
        
        setValueAggregations(updated);
    };

    return (
        <div className="dropdown-container">
            <div className="dimension-section">
                <h3>Rows</h3>
                <select 
                    multiple 
                    value={rowFields} 
                    onChange={handleRowFieldChange}
                    className="large-dropdown"
                >
                    {dimensionColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                </select>
            </div>

            <div className="dimension-section">
                <h3>Columns</h3>
                <select 
                    multiple 
                    value={colFields} 
                    onChange={handleColFieldChange}
                    className="large-dropdown"
                >
                    {dimensionColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                </select>
            </div>

            <div className="values-section">
                <h3>Values</h3>
                <div className="values-container">
                    {valueAggregations.map((item, index) => (
                        <div key={index} className="value-field">
                            <select
                                value={item.valueField}
                                onChange={(e) => handleValueFieldChange(index, e.target.value)}
                                className="value-select"
                            >
                                {numericColumns.map(col => (
                                    <option 
                                        key={col} 
                                        value={col}
                                        disabled={valueAggregations.some(va => 
                                            va.valueField === col && 
                                            va !== item
                                        )}
                                    >
                                        {col}
                                    </option>
                                ))}
                            </select>

                            <div className="aggregation-options">
                                {['sum', 'avg', 'min', 'max', 'count'].map(agg => (
                                    <button
                                        key={agg}
                                        type="button"
                                        className={`agg-btn ${item.aggregations.includes(agg) ? 'active' : ''}`}
                                        onClick={() => handleAggregationChange(index, agg)}
                                    >
                                        {agg}
                                    </button>
                                ))}
                            </div>

                            <button 
                                className="remove-btn"
                                onClick={() => handleRemoveValueField(index)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                <button 
                    className="add-btn"
                    onClick={handleAddValueField}
                    disabled={numericColumns.length === 0 || 
                        valueAggregations.length >= numericColumns.length}
                >
                    + Add Value Field
                </button>
            </div>
        </div>
    );
};

export default Dropdowns;
