import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import Dropdowns from './components/Dropdowns';
import PivotTable from './components/PivotTable';
import DataHandler from './components/DataHandler';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [rowFields, setRowFields] = useState([]);
  const [colFields, setColFields] = useState([]);
  const [valueAggregations, setValueAggregations] = useState([]);

  const handleFileUpload = (file) => {
    DataHandler.handleFileUpload(file, setCsvData, setColumns, setNumericColumns);
    setRowFields([]);
    setColFields([]);
    setValueAggregations([]);
  };

  return (
    <div className="app-container">
      <FileUploader onUpload={handleFileUpload} />

      <Dropdowns
        columns={columns}
        numericColumns={numericColumns}
        rowFields={rowFields}
        colFields={colFields}
        valueAggregations={valueAggregations}
        setRowFields={setRowFields}
        setColFields={setColFields}
        setValueAggregations={setValueAggregations}
      />

      {csvData.length > 0 && valueAggregations.length > 0 && (
        (rowFields.length > 0 || colFields.length > 0) && (
          <div className="table-wrapper">
            <PivotTable
              pivotData={DataHandler.generatePivotData(
                csvData,
                rowFields,
                colFields,
                valueAggregations
              )}
              rowFields={rowFields}
              colFields={colFields}
              valueAggregations={valueAggregations}
            />
          </div>
        )
      )}
    </div>
  );
}

export default App;
