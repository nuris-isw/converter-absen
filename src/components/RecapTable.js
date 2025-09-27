// src/components/RecapTable.js

import React from 'react';

export default function RecapTable({ recapData }) {
    const yellowHighlight = { backgroundColor: '#fff9c4' };
    const blueHighlight = { backgroundColor: '#e0f7fa' };
    const orangeHighlight = { backgroundColor: '#ffe8cc' };

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
                        <td style={recap['Tidak Hadir'] > 0 ? orangeHighlight : {}}>{recap['Tidak Hadir']}</td>
                        <td style={recap['Terlambat'] > 0 ? yellowHighlight : {}}>{recap['Terlambat']}</td>
                        <td style={recap['Pulang Awal'] > 0 ? yellowHighlight : {}}>{recap['Pulang Awal']}</td>
                        <td style={recap['Lupa Absen Datang'] > 0 ? blueHighlight : {}}>{recap['Lupa Absen Datang']}</td>
                        <td style={recap['Lupa Absen Pulang'] > 0 ? blueHighlight : {}}>{recap['Lupa Absen Pulang']}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}