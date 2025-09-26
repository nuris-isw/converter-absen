"use client";

import { useState } from 'react';
import * as XLSX from 'xlsx';
import ReportGenerator from '@/components/ReportGenerator';

export default function HomePage() {
  const [rawData, setRawData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true); // Mulai loading
    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "binary", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json_data = XLSX.utils.sheet_to_json(sheet);

      setRawData(json_data);
      setIsLoading(false); // Selesai loading
    };
    reader.readAsBinaryString(file);
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Konverter Absensi Excel ke PDF</h1>
      <p>Unggah file Excel absensi Anda untuk diolah.</p>

      <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <input 
          type="file" 
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          disabled={isLoading} // Nonaktifkan saat loading
        />
        {fileName && <p style={{ marginTop: '0.5rem' }}>File terpilih: <strong>{fileName}</strong></p>}
        {isLoading && <p>Sedang memproses file...</p>}
      </div>
      
      <hr />

      {rawData.length > 0 && <ReportGenerator rawData={rawData} />}
    </main>
  );
}