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
    
    // Refs untuk sinkronisasi scrollbar tetap di sini karena mengontrol 2 komponen
    const topScrollRef = useRef(null);
    const tableContainerRef = useRef(null);
    const contentRef = useRef(null);

    // Sinkronisasi scrollbar
    useEffect(() => {
        const topScroll = topScrollRef.current;
        const tableContainer = tableContainerRef.current;
        const content = contentRef.current;

        if (topScroll && tableContainer && content && tableContainer.scrollWidth > tableContainer.clientWidth) {
            content.style.width = `${tableContainer.scrollWidth}px`;
            const syncScrollTop = () => { tableContainer.scrollLeft = topScroll.scrollLeft; };
            const syncScrollBottom = () => { topScroll.scrollLeft = tableContainer.scrollLeft; };
            topScroll.addEventListener('scroll', syncScrollTop);
            tableContainer.addEventListener('scroll', syncScrollBottom);
            return () => {
                topScroll.removeEventListener('scroll', syncScrollTop);
                tableContainer.removeEventListener('scroll', syncScrollBottom);
            };
        }
    }, [matrixData]);

    const periodText = matrixData.dates.length > 0 ? `Periode: ${matrixData.dates[0]} s/d ${matrixData.dates[matrixData.dates.length - 1]}` : "";

    // Fungsi Ekspor tetap di sini karena membutuhkan data olahan
    const handleExportDetailExcel = () => {
        const { employees, dates, dataMap } = matrixData;
        const headerRow1 = ['No.', 'Nama Pegawai', ...dates.flatMap(date => [date, ''])];
        const headerRow2 = ['', '', ...dates.flatMap(() => ['Masuk', 'Pulang'])];
        const bodyRows = employees.map((employee, index) => {
            const row = [index + 1, employee];
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
        worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, ...dates.flatMap(() => [{ wch: 10 }, { wch: 10 }])];
        XLSX.writeFile(workbook, 'Laporan_Detail_Absensi.xlsx');
    };

    const handleExportRecapPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait' });
        doc.text("Laporan Rekapitulasi Absensi", 14, 20);
        doc.setFontSize(10);
        doc.text(periodText, 14, 26);
        const recapHead = [['No.', 'Nama Pegawai', 'Hadir', 'Tidak Hadir', 'Terlambat', 'Pulang Awal', 'Lupa Absen Datang', 'Lupa Absen Pulang']];
        const recapBody = recapData.map((item, index) => [index + 1, item.nama, item['Hadir'], item['Tidak Hadir'], item['Terlambat'], item['Pulang Awal'], item['Lupa Absen Datang'], item['Lupa Absen Pulang']]);
        autoTable(doc, {
            head: recapHead, body: recapBody, startY: 32, theme: 'grid',
            styles: { halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1, },
            headStyles: { fillColor: [242, 242, 242], textColor: 20, fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1, },
            willDrawCell: (data) => {
                if (data.section === 'body') {
                    const cellValue = data.cell.raw; const colIndex = data.column.index;
                    let fillColor = null;
                    if (colIndex === 3 && cellValue > 0) fillColor = [255, 232, 204];
                    if (colIndex >= 4 && colIndex <= 5 && cellValue > 0) fillColor = [255, 249, 196];
                    if (colIndex >= 6 && colIndex <= 7 && cellValue > 0) fillColor = [224, 247, 250];
                    if (fillColor) doc.setFillColor(...fillColor);
                }
            },
        });
        doc.save('laporan-rekap-absensi.pdf');
    };

    return (
        <div style={{ width: '100%' }}>            
            <div className="report-header">
                <div>
                    <h2>Laporan Detail Kehadiran</h2>
                    <p className="report-subheader">{periodText}</p>
                </div>
                <button onClick={handleExportDetailExcel} className="export-button">Ekspor Detail Excel</button>
            </div>
            <DetailTable matrixData={matrixData} topScrollRef={topScrollRef} tableContainerRef={tableContainerRef} contentRef={contentRef} />

            <div className="report-header">
                <div>
                    <h2>Rekapitulasi</h2>
                    <p className="report-subheader">{periodText}</p>
                </div>
                <button onClick={handleExportRecapPDF} className="export-button pdf-button">Ekspor Rekap PDF</button>
            </div>
            <RecapTable recapData={recapData} />
        </div>
    );
}