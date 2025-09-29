// src/hooks/useAttendanceProcessor.js

import { useState, useEffect } from 'react';

function ensureDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === "string") {
        const isoString = value.replace(" ", "T");
        const d = new Date(isoString);
        if (!isNaN(d)) return d;
    }
    return null;
}

export default function useAttendanceProcessor(rawData) {
    const [matrixData, setMatrixData] = useState({ employees: [], dates: [], dataMap: new Map() });
    const [recapData, setRecapData] = useState([]);

    useEffect(() => {
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
                if (rec.masuk && rec.masuk > '08:06:00') keterangan = 'Terlambat';
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

    return { matrixData, recapData };
}