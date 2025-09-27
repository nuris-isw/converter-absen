// src/components/DetailTable.js

import React from 'react';

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

export default function DetailTable({ matrixData, topScrollRef, tableContainerRef, contentRef }) {
    const { employees, dates, dataMap } = matrixData;

    return (
        <>
            <div ref={topScrollRef} style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                <div ref={contentRef} style={{ height: '1px' }}></div>
            </div>
            <div ref={tableContainerRef} style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th rowSpan="2" className="sticky-col sticky-th-no">No.</th>
                            {/* PERBAIKAN: Ubah 60px menjadi 58px */}
                            <th rowSpan="2" className="sticky-col" style={{ left: '37px' }}>Nama Pegawai</th>
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
        </>
    );
}