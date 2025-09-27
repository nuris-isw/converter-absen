// src/components/DetailTable.js

import React from 'react';

// FUNGSI DIUBAH: dari mengembalikan style object menjadi class name string
function getCellClass(record, cellType) {
    if (!record) return '';
    const { keterangan } = record;
    if (keterangan === 'Tidak Hadir') return 'highlight-orange';
    if (keterangan === 'Lupa Absen Datang' && cellType === 'masuk') return 'highlight-blue';
    if (keterangan === 'Lupa Absen Pulang' && cellType === 'pulang') return 'highlight-blue';
    if (keterangan.includes('Terlambat') && cellType === 'masuk') return 'highlight-yellow';
    if (keterangan.includes('Pulang Awal') && cellType === 'pulang') return 'highlight-yellow';
    return '';
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
                            <th rowSpan="2" className="sticky-col" style={{ left: '58px' }}>Nama Pegawai</th>
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
                                    return (
                                        <React.Fragment key={key}>
                                            {/* PERUBAHAN: Gunakan className, bukan style */}
                                            <td className={getCellClass(record, 'masuk')}>{record?.masuk || '-'}</td>
                                            <td className={getCellClass(record, 'pulang')}>{record?.pulang || '-'}</td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}