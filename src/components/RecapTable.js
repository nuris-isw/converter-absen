// src/components/RecapTable.js

import React from 'react';

export default function RecapTable({ recapData }) {
    return (
        <table>
            <thead>
                <tr>
                    <th>No.</th>
                    <th className="employee-name">Nama Pegawai</th>
                    <th>Hadir</th>
                    <th>Tidak Hadir</th>
                    <th>Terlambat</th>
                    <th>Pulang Awal</th>
                    <th>Lupa Absen Datang</th>
                    <th>Lupa Absen Pulang</th>
                </tr>
            </thead>
            <tbody>
                {recapData.map((recap, index) => (
                    <tr key={recap.nama}>
                        <td>{index + 1}</td>
                        <td className="employee-name">{recap.nama}</td>
                        <td>{recap['Hadir']}</td>
                        {/* PERUBAHAN: Gunakan className, bukan style */}
                        <td className={recap['Tidak Hadir'] > 0 ? 'highlight-orange' : ''}>{recap['Tidak Hadir']}</td>
                        <td className={recap['Terlambat'] > 0 ? 'highlight-yellow' : ''}>{recap['Terlambat']}</td>
                        <td className={recap['Pulang Awal'] > 0 ? 'highlight-yellow' : ''}>{recap['Pulang Awal']}</td>
                        <td className={recap['Lupa Absen Datang'] > 0 ? 'highlight-blue' : ''}>{recap['Lupa Absen Datang']}</td>
                        <td className={recap['Lupa Absen Pulang'] > 0 ? 'highlight-blue' : ''}>{recap['Lupa Absen Pulang']}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}