import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const CsvUpload = ({ onUploadSuccess }) => {
    const { user } = useContext(AuthContext);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return setStatus('⚠️ Please select a CSV file first.');

        const formData = new FormData();
        formData.append('file', file);
        setIsUploading(true);
        setStatus('🚀 Securing and processing data...');

        try {
            const response = await fetch('http://localhost:8000/upload-csv/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` },
                body: formData,
            });
            if (response.ok) {
                const result = await response.json();
                setStatus(`✅ ${result.message}`);
                if (onUploadSuccess) onUploadSuccess(); 
            } else {
                setStatus('❌ Upload failed.');
            }
        } catch (error) {
            setStatus('❌ Server Error.');
        } finally {
            setIsUploading(false); 
        }
    };

    return (
        <div style={{ marginTop: '20px', padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#1f2937', marginBottom: '15px' }}>Upload Private Performance Data</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input type="file" accept=".csv" onChange={(e) => {setFile(e.target.files[0]); setStatus('');}} disabled={isUploading} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: isUploading ? 'not-allowed' : 'pointer' }} />
                <button type="submit" disabled={isUploading} style={{ padding: '10px 20px', backgroundColor: isUploading ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: isUploading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                    {isUploading ? 'Processing...' : 'Run Secure Predictions'}
                </button>
            </form>
            {status && <p style={{ marginTop: '15px', marginBottom: 0, fontSize: '14px', fontWeight: 'bold', color: status.includes('✅') ? '#059669' : '#dc2626' }}>{status}</p>}
        </div>
    );
};

export default CsvUpload;