import React, { useState } from 'react';
import './styles/FileUploader.css';

const FileUploader = ({ onUpload }) => {
    const [fileName, setFileName] = useState('');

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file);
            setFileName(file.name);
        }
    };

    return (
        <div className="file-uploader">
            <input
                type="file"
                id="fileInput"
                accept=".csv"
                onChange={handleChange}
            />
            <label htmlFor="fileInput">Upload File</label>
            {fileName && <div className="file-name">{fileName}</div>}
        </div>
    );
};

export default FileUploader;
