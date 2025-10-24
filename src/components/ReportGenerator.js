// src/components/ReportGenerator.js

"use client";

import React, { useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Impor "mesin" dan komponen-komponen baru kita
import useAttendanceProcessor from '@/hooks/useAttendanceProcessor';
import DetailTable from './DetailTable';
import RecapTable from './RecapTable';

export default function ReportGenerator({ rawData }) {
    // 1. Gunakan "mesin" untuk mengolah data
    const { matrixData, recapData } = useAttendanceProcessor(rawData);
    
    // Refs untuk sinkronisasi scrollbar
    const topScrollRef = useRef(null);
    const tableContainerRef = useRef(null);
    const contentRef = useRef(null);

    // Sinkronisasi scrollbar
    useEffect(() => {
        const topScroll = topScrollRef.current;
        const tableContainer = tableContainerRef.current;
        const content = contentRef.current;

        // Hanya jalankan jika tabelnya memang bisa di-scroll
        if (topScroll && tableContainer && content && tableContainer.scrollWidth > tableContainer.clientWidth) {
            content.style.width = `${tableContainer.scrollWidth}px`;
            const syncScrollTop = () => { tableContainer.scrollLeft = topScroll.scrollLeft; };
            const syncScrollBottom = () => { topScroll.scrollLeft = tableContainer.scrollLeft; };
            topScroll.addEventListener('scroll', syncScrollTop);
            tableContainer.addEventListener('scroll', syncScrollBottom);
            return () => { // Cleanup function saat komponen di-unmount
                topScroll.removeEventListener('scroll', syncScrollTop);
                tableContainer.removeEventListener('scroll', syncScrollBottom);
            };
        } else if (content) {
            // Jika tidak bisa di-scroll, pastikan width konten scroll atas sesuai
             content.style.width = `100%`;
        }
    }, [matrixData]); // Jalankan ulang efek ini jika data matriks berubah

    // Teks periode untuk ditampilkan di header dan PDF
    const periodText = matrixData.dates.length > 0 ? `Periode: ${matrixData.dates[0]} s/d ${matrixData.dates[matrixData.dates.length - 1]}` : "";

    // Fungsi Ekspor Detail ke Excel
    const handleExportDetailExcel = () => {
        const { employees, dates, dataMap } = matrixData;
        const headerRow1 = ['No.', 'Nama Pegawai', ...dates.flatMap(date => [date, ''])];
        const headerRow2 = ['', '', ...dates.flatMap(() => ['Masuk', 'Pulang'])];
        
        const bodyRows = [];
        employees.forEach((employee, index) => {
            const timeRow = [index + 1, employee];
            const statusRow = ['', 'Status']; // Baris untuk status
            dates.forEach(date => {
                const record = dataMap.get(`${employee}-${date}`);
                timeRow.push(record?.masuk || '-');
                timeRow.push(record?.pulang || '-');
                const statusMasuk = record?.keterangan?.includes('Terlambat') ? 'Terlambat' : (record?.keterangan === 'Lupa Absen Datang' ? 'Lupa Absen' : '');
                const statusPulang = record?.keterangan?.includes('Pulang Awal') ? 'Pulang Awal' : (record?.keterangan === 'Lupa Absen Pulang' ? 'Lupa Absen' : '');
                if (record?.keterangan === 'Tidak Hadir') {
                    statusRow.push('Tidak Hadir', 'Tidak Hadir');
                } else {
                    statusRow.push(statusMasuk, statusPulang);
                }
            });
            bodyRows.push(timeRow, statusRow);
        });

        const finalData = [headerRow1, headerRow2, ...bodyRows];
        const worksheet = XLSX.utils.aoa_to_sheet(finalData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Detail');
        worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, ...dates.flatMap(() => [{ wch: 10 }, { wch: 10 }])];
        XLSX.writeFile(workbook, 'Laporan_Detail_Absensi.xlsx');
    };

    // Fungsi Ekspor Rekap ke PDF
    const handleExportRecapPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait' });
        doc.text("Laporan Rekapitulasi Absensi", 14, 20);
        doc.setFontSize(10);
        doc.text(periodText, 14, 26);
        const recapHead = [['No.', 'Nama Pegawai', 'Hadir', 'Tidak Hadir', 'Terlambat', 'Pulang Awal', 'Lupa Absen Datang', 'Lupa Absen Pulang']];
        const recapBody = recapData.map((item, index) => [ index + 1, item.nama, item['Hadir'], item['Tidak Hadir'], item['Terlambat'], item['Pulang Awal'], item['Lupa Absen Datang'], item['Lupa Absen Pulang'] ]);
        autoTable(doc, {
            head: recapHead, body: recapBody, startY: 32, theme: 'grid',
            styles: { halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1, },
            headStyles: { fillColor: [242, 242, 242], textColor: 20, fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1, },
            willDrawCell: (data) => {
                if (data.section === 'body') {
                    const cellValue = data.cell.raw; const colIndex = data.column.index;
                    let fillColor = null;
                    // Kolom Tidak Hadir (index 3), Terlambat (4), Pulang Awal (5) -> Kuning
                    if (colIndex >= 3 && colIndex <= 5 && cellValue > 0) fillColor = [255, 249, 196]; 
                    // Kolom Lupa Absen (index 6, 7) -> Biru
                    if (colIndex >= 6 && colIndex <= 7 && cellValue > 0) fillColor = [224, 247, 250]; 
                    if (fillColor) doc.setFillColor(...fillColor);
                }
            },
        });
        doc.save('laporan-rekap-absensi.pdf');
    };

    // Fungsi Ekspor Rekap ke Excel
    const handleExportRecapExcel = () => {
        const recapHead = ['No.', 'Nama Pegawai', 'Hadir', 'Tidak Hadir', 'Terlambat', 'Pulang Awal', 'Lupa Absen Datang', 'Lupa Absen Pulang'];
        const recapBody = recapData.map((item, index) => [
          index + 1, item.nama, item['Hadir'], item['Tidak Hadir'], item['Terlambat'], 
          item['Pulang Awal'], item['Lupa Absen Datang'], item['Lupa Absen Pulang']
        ]);
        const finalData = [recapHead, ...recapBody];
        const worksheet = XLSX.utils.aoa_to_sheet(finalData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi');
        worksheet['!cols'] = [ { wch: 5 }, { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 } ];
        XLSX.writeFile(workbook, 'Laporan_Rekap_Absensi.xlsx');
    };

    return (
        <div style={{ width: '100%' }}> 
            {/* Header Laporan Detail */}
            <div className="report-header">
                <div>
                    <h2>Laporan Detail Kehadiran</h2>
                    <p className="report-subheader">{periodText}</p>
                </div>
                <button 
                    onClick={handleExportDetailExcel} 
                    className="export-button" 
                    disabled={!matrixData.dates.length} // Nonaktifkan jika belum ada data
                >
                    Ekspor Detail Excel
                </button>
            </div>
            {/* Komponen Tabel Detail */}
            <DetailTable 
                matrixData={matrixData} 
                topScrollRef={topScrollRef} 
                tableContainerRef={tableContainerRef} 
                contentRef={contentRef} 
            />

            {/* Header Rekapitulasi */}
            <div className="report-header">
                <div>
                    <h2>Rekapitulasi</h2>
                    <p className="report-subheader">{periodText}</p>
                </div>
                {/* Tombol Ekspor Rekap */}
                <div> 
                  <button 
                    onClick={handleExportRecapExcel} 
                    className="export-button"
                    disabled={!recapData.length} // Nonaktifkan jika belum ada data
                  >
                    Ekspor Rekap Excel
                  </button>
                  <button 
                    onClick={handleExportRecapPDF} 
                    className="export-button pdf-button"
                    disabled={!recapData.length} // Nonaktifkan jika belum ada data
                  >
                    Ekspor Rekap PDF
                  </button>
                </div>
            </div>
            {/* Komponen Tabel Rekap */}
            <RecapTable recapData={recapData} />
        </div>
    );
}

// Catatan: Pastikan file DetailTable.js, RecapTable.js, dan useAttendanceProcessor.js
// ada di lokasi yang benar dan berisi kode yang sudah kita buat sebelumnya.
// Pastikan juga file globals.css berisi semua style CSS yang sudah kita definisikan.