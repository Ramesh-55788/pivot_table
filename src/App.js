import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import PivotControls from './components/PivotControls';
import PivotTable from './components/PivotTable';
import DataHandler from './components/DataHandler';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [rowFields, setRowFields] = useState([]);
  const [colFields, setColFields] = useState([]);
  const [valueFields, setValueFields] = useState([]);

  const handleFileUpload = (file) => {
    DataHandler.handleFileUpload(file, setCsvData, setColumns, setNumericColumns);
    setRowFields([]);
    setColFields([]);
    setValueFields([]);
  };

  return (
    <div className="app-container">
      <FileUploader onUpload={handleFileUpload} />

      <PivotControls
        columns={columns}
        numericColumns={numericColumns}
        rowFields={rowFields}
        colFields={colFields}
        valueFields={valueFields}
        setRowFields={setRowFields}
        setColFields={setColFields}
        setValueFields={setValueFields}
      />

      {csvData.length > 0 && valueFields.length > 0 && (
        (rowFields.length > 0 || colFields.length > 0) && (
          <div className="table-wrapper">
            <PivotTable
              pivotData={DataHandler.generatePivotData(
                csvData,
                rowFields,
                colFields,
                valueFields
              )}
              rowFields={rowFields}
              colFields={colFields}
              valueFields={valueFields}
            />
          </div>
        )
      )}
    </div>
  );
}

export default App;