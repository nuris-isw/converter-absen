"use client";

import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ... (fungsi ensureDate dan getCellStyle tidak berubah) ...
function ensureDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const isoString = value.replace(" ", "T");
    const d = new Date(isoString);
    if (!isNaN(d)) return d;
  }
  return null;
}
function getCellStyle(record, cellType) {
  if (!record) return {};
  const { keterangan } = record;
  if (keterangan === 'Tidak Hadir') return { backgroundColor: '#ffe8cc' };
  if (keterangan === 'Lupa Absen Datang' && cellType === 'masuk') return { backgroundColor: '#e0f7fa' };
  if (keterangan === 'Lupa Absen Pulang' && cellType === 'pulang') return { backgroundColor: '#e0f7fa' };
  if (keterangan.includes('Terlambat') && cellType === 'masuk') return { backgroundColor: '#fff9c4' };
  if (keterangan.includes('Pulang Awal') && cellType === 'pulang') return { backgroundColor: '#fff9c4' };
  return {};
}

export default function ReportGenerator({ rawData }) {
  const [matrixData, setMatrixData] = useState({ employees: [], dates: [], dataMap: new Map() });
  const [recapData, setRecapData] = useState([]);
  
  const topScrollRef = useRef(null);
  const tableContainerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // ... (Logika pemrosesan data tidak berubah) ...
    if (rawData.length > 0) {
      const cleanedData = rawData.map(row => {
        const tanggalObj = ensureDate(row.Tanggal);
        if (!tanggalObj) return null;
        const tanggalLokal = `${tanggalObj.getFullYear()}-${String(tanggalObj.getMonth() + 1).padStart(2, '0')}-${String(tanggalObj.getDate()).padStart(2, '0')}`;
        const waktu = tanggalObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        return { nama: row.Nama, tanggal: tanggalLokal, waktu, status: row.Status, dayOfWeek: tanggalObj.getDay() };
      }).filter(row => row && row.nama);

      const dailyRecords = {};
      cleanedData.forEach(row => {
        const key = `${row.nama}-${row.tanggal}`;
        if (!dailyRecords[key]) {
          dailyRecords[key] = { nama: row.nama, tanggal: row.tanggal, masuk: null, pulang: null, dayOfWeek: row.dayOfWeek };
        }
        if (row.status === 'Masuk') {
          if (!dailyRecords[key].masuk || row.waktu < dailyRecords[key].masuk) dailyRecords[key].masuk = row.waktu;
        } else if (row.status === 'Pulang' || row.status === 'Keluar') {
          if (!dailyRecords[key].pulang || row.waktu > dailyRecords[key].pulang) dailyRecords[key].pulang = row.waktu;
        }
      });
      
      const analyzedData = Object.values(dailyRecords).map(rec => {
        let keterangan = 'Hadir';
        const isFriday = rec.dayOfWeek === 5;
        const pulangAwalTime = isFriday ? '11:00:00' : '13:00:00';
        if (rec.masuk && rec.masuk > '08:00:00') keterangan = 'Terlambat';
        if (rec.pulang && rec.pulang < pulangAwalTime) keterangan = keterangan === 'Terlambat' ? 'Terlambat & Pulang Awal' : 'Pulang Awal';
        if (!rec.masuk && rec.pulang) keterangan = 'Lupa Absen Datang';
        if (rec.masuk && !rec.pulang) keterangan = 'Lupa Absen Pulang';
        return { ...rec, keterangan };
      });

      const employees = [...new Set(cleanedData.map(item => item.nama))].sort();
      const dates = [...new Set(cleanedData.map(item => item.tanggal))].sort();
      
      const dataMap = new Map();
      analyzedData.forEach(item => {
        const key = `${item.nama}-${item.tanggal}`;
        dataMap.set(key, item);
      });
      
      employees.forEach(employee => {
        dates.forEach(date => {
          const key = `${employee}-${date}`;
          if (!dataMap.has(key)) {
            dataMap.set(key, { nama: employee, tanggal: date, masuk: null, pulang: null, keterangan: 'Tidak Hadir' });
          }
        });
      });
      
      setMatrixData({ employees, dates, dataMap });

      const recap = employees.map(employee => {
        const counts = { 'Hadir': 0, 'Tidak Hadir': 0, 'Terlambat': 0, 'Pulang Awal': 0, 'Lupa Absen Datang': 0, 'Lupa Absen Pulang': 0 };
        dates.forEach(date => {
          const key = `${employee}-${date}`;
          const record = dataMap.get(key);
          if (record) {
            if (record.keterangan !== 'Tidak Hadir') counts['Hadir']++;
            else counts['Tidak Hadir']++;
            if (record.keterangan.includes('Terlambat')) counts['Terlambat']++;
            if (record.keterangan.includes('Pulang Awal')) counts['Pulang Awal']++;
            if (record.keterangan === 'Lupa Absen Datang') counts['Lupa Absen Datang']++;
            if (record.keterangan === 'Lupa Absen Pulang') counts['Lupa Absen Pulang']++;
          }
        });
        return { nama: employee, ...counts };
      });
      
      const sortedRecap = recap.sort((a, b) => a['Hadir'] - b['Hadir']);
      setRecapData(sortedRecap);
    }
  }, [rawData]);

  useEffect(() => {
    // ... (Scroll sync logic remains the same) ...
    const topScroll = topScrollRef.current; const tableContainer = tableContainerRef.current; const content = contentRef.current;
    if (topScroll && tableContainer && content) {
      content.style.width = `${tableContainer.scrollWidth}px`;
      const syncScrollTop = () => { tableContainer.scrollLeft = topScroll.scrollLeft; };
      const syncScrollBottom = () => { topScroll.scrollLeft = tableContainer.scrollLeft; };
      topScroll.addEventListener('scroll', syncScrollTop); tableContainer.addEventListener('scroll', syncScrollBottom);
      return () => {
        topScroll.removeEventListener('scroll', syncScrollTop); tableContainer.removeEventListener('scroll', syncScrollBottom);
      };
    }
  }, [matrixData]);

  const { employees, dates, dataMap } = matrixData;
  const periodText = dates.length > 0 ? `Periode: ${dates[0]} s/d ${dates[dates.length - 1]}` : "";

  // PERBAIKAN BUG: Fungsi ini sekarang untuk EXCEL
  const handleExportDetailExcel = () => {
    const headerRow1 = ['No.', 'Nama Pegawai', ...dates.flatMap(date => [date, ''])];
    const headerRow2 = ['', '', ...dates.flatMap(() => ['Masuk', 'Pulang'])];
    
    const bodyRows = employees.map((employee, index) => {
        const row = [index + 1, employee]; // Tambah nomor urut
        dates.forEach(date => {
            const record = dataMap.get(`${employee}-${date}`);
            row.push(record?.masuk || '');
            row.push(record?.pulang || '');
        });
        return row;
    });

    const finalData = [headerRow1, headerRow2, ...bodyRows];
    const worksheet = XLSX.utils.aoa_to_sheet(finalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Detail');
    const colWidths = [{ wch: 5 }, { wch: 30 }, ...dates.flatMap(() => [{ wch: 10 }, { wch: 10 }])];
    worksheet['!cols'] = colWidths;
    XLSX.writeFile(workbook, 'Laporan_Detail_Absensi.xlsx');
  };

  const handleExportRecapPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait' });
    doc.text("Laporan Rekapitulasi Absensi", 14, 20);
    // PERUBAHAN: Tambahkan periode
    doc.setFontSize(10);
    doc.text(periodText, 14, 26);

    const recapHead = [['No.', 'Nama Pegawai', 'Hadir', 'Tidak Hadir', 'Terlambat', 'Pulang Awal', 'Lupa Absen Datang', 'Lupa Absen Pulang']];
    // PERUBAHAN: Tambahkan nomor urut
    const recapBody = recapData.map((item, index) => [
      index + 1,
      item.nama,
      item['Hadir'],
      item['Tidak Hadir'],
      item['Terlambat'],
      item['Pulang Awal'],
      item['Lupa Absen Datang'],
      item['Lupa Absen Pulang']
    ]);

    autoTable(doc, {
        head: recapHead,
        body: recapBody,
        startY: 32, // Sesuaikan posisi Y
        theme: 'grid',
        styles: { halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1, },
        headStyles: { fillColor: [242, 242, 242], textColor: 20, fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1, },
        willDrawCell: (data) => {
          if (data.section === 'body') {
            // Indeks kolom sekarang bergeser karena ada kolom 'No.'
            const cellValue = data.cell.raw;
            const colIndex = data.column.index;
            let fillColor = null;
            if (colIndex >= 3 && colIndex <= 5 && cellValue > 0) fillColor = [255, 249, 196]; // Kuning
            if (colIndex >= 6 && colIndex <= 7 && cellValue > 0) fillColor = [224, 247, 250]; // Biru
            if (fillColor) doc.setFillColor(...fillColor);
          }
        },
    });
    
    doc.save('laporan-rekap-absensi.pdf');
  };

  const yellowHighlight = { backgroundColor: '#fff9c4' };
  const blueHighlight = { backgroundColor: '#e0f7fa' };

  return (
    <div style={{ width: '100%' }}>
      <style jsx>{`
        /* ... CSS tidak berubah ... */
        table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 14px; }
        td { border: 1px solid #ccc; padding: 8px; text-align: center; white-space: nowrap; }
        th { border: 1px solid #ccc; padding: 8px; text-align: center; white-space: nowrap; background-color: #f2f2f2; position: -webkit-sticky; position: sticky; top: 0; z-index: 20; }
        .sticky-col { position: -webkit-sticky; position: sticky; left: 0; top: 0; background-color: #f2f2f2; z-index: 30; }
        .employee-name { text-align: left; font-weight: bold; }
        .sticky-name { position: -webkit-sticky; position: sticky; left: 60px; /* Lebar kolom No + padding */ background-color: white; z-index: 10; width: 200px; }
        .sticky-no { position: -webkit-sticky; position: sticky; left: 0; background-color: white; z-index: 10; width: 60px; }
        .sticky-th-no { z-index: 40; /* Paling atas */ }
        .report-header { display: flex; justify-content: space-between; align-items: center; }
        .report-subheader { font-size: 14px; color: #555; margin-top: -1rem; margin-bottom: 1rem; }
        .export-button { padding: 8px 12px; cursor: pointer; background-color: #1d6f42; color: white; border: none; border-radius: 5px; font-size: 12px; margin-left: 1rem; }
        .pdf-button { background-color: #007bff; }
      `}</style>
      
      <div className="report-header">
        <h2>Laporan Detail Kehadiran</h2>
        <button onClick={handleExportDetailExcel} className="export-button">Ekspor Detail Excel</button>
      </div>
      <p className="report-subheader">{periodText}</p>

      <div ref={topScrollRef} style={{ overflowX: 'auto', overflowY: 'hidden' }}><div ref={contentRef} style={{ height: '1px' }}></div></div>
      <div ref={tableContainerRef} style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th rowSpan="2" className="sticky-col sticky-th-no">No.</th>
              <th rowSpan="2" className="sticky-col" style={{left: '60px'}}>Nama Pegawai</th>
              {dates.map(date => <th colSpan="2" key={date}>{date}</th>)}
            </tr>
            <tr>
              {dates.map(date => (<React.Fragment key={date}><th>Masuk</th><th>Pulang</th></React.Fragment>))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr key={employee}>
                <td className="sticky-no">{index + 1}</td>
                <td className="sticky-name">{employee}</td>
                {dates.map(date => {
                  const key = `${employee}-${date}`;
                  const record = dataMap.get(key);
                  return (<React.Fragment key={key}><td style={getCellStyle(record, 'masuk')}>{record?.masuk || '-'}</td><td style={getCellStyle(record, 'pulang')}>{record?.pulang || '-'}</td></React.Fragment>);
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="report-header">
        <h2>Rekapitulasi</h2>
        <button onClick={handleExportRecapPDF} className="export-button pdf-button">Ekspor Rekap PDF</button>
      </div>
      <p className="report-subheader">{periodText}</p>
       <table>
        <thead>
          <tr>
            <th>No.</th><th className="employee-name">Nama Pegawai</th><th>Hadir</th><th>Tidak Hadir</th><th>Terlambat</th><th>Pulang Awal</th><th>Lupa Absen Datang</th><th>Lupa Absen Pulang</th>
          </tr>
        </thead>
        <tbody>
          {recapData.map((recap, index) => (
            <tr key={recap.nama}>
              <td>{index + 1}</td>
              <td className="employee-name">{recap.nama}</td><td>{recap['Hadir']}</td>
              <td style={recap['Tidak Hadir'] > 0 ? yellowHighlight : {}}>{recap['Tidak Hadir']}</td>
              <td style={recap['Terlambat'] > 0 ? yellowHighlight : {}}>{recap['Terlambat']}</td>
              <td style={recap['Pulang Awal'] > 0 ? yellowHighlight : {}}>{recap['Pulang Awal']}</td>
              <td style={recap['Lupa Absen Datang'] > 0 ? blueHighlight : {}}>{recap['Lupa Absen Datang']}</td>
              <td style={recap['Lupa Absen Pulang'] > 0 ? blueHighlight : {}}>{recap['Lupa Absen Pulang']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}