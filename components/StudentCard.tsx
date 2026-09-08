import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student, SchoolInfo } from '../types';
import { UserIcon, BuildingIcon, UploadIcon } from './icons/Icons';
import { imageFileToBase64 } from '../utils';

interface StudentCardProps {
    student: Student;
    schoolInfo?: SchoolInfo;
    isBulk?: boolean; // Optimized for bulk printing (A4 multiple cards)
    activeTab?: 'both' | 'front' | 'back';
}

// Helper function for 100% reliable, pristine Student ID Card printing (Front, Back, or Both) without clipping
export const printStudentCardDirectly = (
    student: Student,
    qrDataUrl: string,
    schoolInfo?: SchoolInfo,
    activeTab: 'both' | 'front' | 'back' = 'both'
) => {
    const schoolName = schoolInfo?.officialName || schoolInfo?.name || 'SMK MANBAUL ULUM';
    const schoolAddress = schoolInfo?.address || 'Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kec. Gunung Labuhan, Kab. Way Kanan';
    const headmasterName = schoolInfo?.headmaster || 'Muniroh';
    const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const photoSrc = student.photoUrl || student.faceDataUrl || '';
    const rfidText = student.rfidCode ? student.rfidCode : '-';
    const faceText = (student.faceRegistered || !!student.faceDataUrl) ? '✓ Wajah' : '';
    const qrCodeText = student.qrCode || `SMK-S-${student.nis || student.id}`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Kartu Pelajar - ${student.fullName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background-color: #ffffff;
            color: #0f172a;
            padding: 15px;
          }
          .cards-wrapper {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 24px;
            justify-content: center;
            align-items: flex-start;
          }
          .student-card {
            width: 85.6mm;
            height: 53.98mm;
            background: #ffffff;
            border: 1.5pt solid #0f172a;
            border-radius: 8pt;
            padding: 7pt 9pt;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            box-shadow: none;
          }
          .card-watermark {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.03;
            pointer-events: none;
            font-size: 80pt;
            font-weight: 900;
            color: #0f172a;
          }
          .kop-header {
            position: relative;
            z-index: 10;
          }
          .kop-flex {
            display: flex;
            align-items: center;
            gap: 5pt;
            padding-bottom: 2pt;
          }
          .kop-logo {
            width: 22pt;
            height: 22pt;
            border-radius: 50%;
            background: #0f172a;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7.5pt;
            font-weight: 900;
            flex-shrink: 0;
            border: 1pt solid #0f172a;
          }
          .kop-title {
            text-align: center;
            flex: 1;
            min-width: 0;
          }
          .kop-title .sub1 {
            font-size: 4.8pt;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
            line-height: 1.1;
            letter-spacing: 0.3pt;
          }
          .kop-title .sub2 {
            font-size: 5.2pt;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            line-height: 1.1;
            letter-spacing: 0.3pt;
          }
          .kop-title .main-school {
            font-size: 7.5pt;
            font-weight: 900;
            color: #020617;
            text-transform: uppercase;
            letter-spacing: 0.6pt;
            margin-top: 1pt;
            line-height: 1.1;
          }
          .line-double {
            border-bottom: 1.5pt solid #0f172a;
            margin-top: 1pt;
          }
          .line-thin {
            border-bottom: 0.5pt solid #94a3b8;
            margin-top: 1pt;
          }
          .card-ribbon {
            background: #0f172a;
            color: #ffffff;
            text-align: center;
            padding: 1.5pt 0;
            margin: 2pt 0;
            border-radius: 1.5pt;
            font-size: 5.5pt;
            font-weight: 900;
            letter-spacing: 0.8pt;
            text-transform: uppercase;
          }
          .card-body {
            position: relative;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 6pt;
            margin: auto 0;
          }
          .photo-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }
          .photo-frame {
            width: 46pt;
            height: 60pt;
            border: 1.2pt solid #0f172a;
            border-radius: 3pt;
            background: #f1f5f9;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .photo-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .photo-placeholder {
            font-size: 18pt;
            color: #94a3b8;
          }
          .badge-active {
            font-size: 4.5pt;
            font-weight: 900;
            color: #0f172a;
            background: #f1f5f9;
            border: 0.5pt solid #cbd5e1;
            padding: 1pt 3pt;
            border-radius: 2pt;
            margin-top: 2pt;
            text-transform: uppercase;
          }
          .info-block {
            flex: 1;
            min-width: 0;
            color: #020617;
          }
          .student-name {
            font-size: 7.5pt;
            font-weight: 900;
            color: #020617;
            text-transform: uppercase;
            border-bottom: 0.5pt solid #cbd5e1;
            padding-bottom: 1.5pt;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .info-table {
            width: 100%;
            font-size: 5.5pt;
            margin-top: 2pt;
            border-collapse: collapse;
            line-height: 1.2;
          }
          .info-table td {
            padding: 0.8pt 0;
            vertical-align: top;
          }
          .label-col {
            font-weight: 700;
            color: #475569;
            width: 26pt;
          }
          .colon-col {
            width: 4pt;
            text-align: center;
            font-weight: 700;
          }
          .val-col {
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .qr-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex-shrink: 0;
          }
          .qr-frame {
            width: 46pt;
            height: 46pt;
            background: #ffffff;
            border: 0.6pt solid #94a3b8;
            border-radius: 2pt;
            padding: 1pt;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-frame img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .qr-label {
            font-size: 4.5pt;
            font-weight: 900;
            color: #1e293b;
            margin-top: 2pt;
            letter-spacing: 0.3pt;
            text-transform: uppercase;
          }
          .card-footer {
            position: relative;
            z-index: 10;
            border-top: 0.5pt solid #cbd5e1;
            padding-top: 2pt;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 4.5pt;
            color: #475569;
          }
          .rules-title {
            background: #0f172a;
            color: #ffffff;
            text-align: center;
            padding: 1.5pt 0;
            border-radius: 1.5pt;
            font-size: 5.5pt;
            font-weight: 900;
            letter-spacing: 0.8pt;
            text-transform: uppercase;
            margin-bottom: 4pt;
          }
          .rules-list {
            font-size: 5.2pt;
            color: #1e293b;
            padding-left: 10pt;
            line-height: 1.35;
          }
          .rules-list li {
            margin-bottom: 2pt;
          }
          .signature-section {
            position: relative;
            z-index: 10;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            border-top: 0.5pt solid #cbd5e1;
            padding-top: 2pt;
            margin-top: auto;
          }
          .notice-text {
            font-size: 4.5pt;
            color: #64748b;
            font-style: italic;
            max-width: 95pt;
            line-height: 1.2;
          }
          .signature-box {
            text-align: center;
            min-width: 95pt;
          }
          .signature-date {
            font-size: 5pt;
            color: #334155;
          }
          .signature-role {
            font-size: 5pt;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.1;
          }
          .signature-space {
            height: 14pt;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 5pt;
            color: #cbd5e1;
            font-style: italic;
          }
          .headmaster-title {
            font-size: 5.5pt;
            font-weight: 900;
            color: #020617;
            text-transform: uppercase;
            border-bottom: 0.5pt solid #0f172a;
            display: inline-block;
            padding-bottom: 1pt;
            line-height: 1;
          }
          .headmaster-nip {
            font-size: 4.8pt;
            font-family: monospace;
            color: #475569;
            margin-top: 1.5pt;
            line-height: 1;
          }
        </style>
      </head>
      <body>
        <div class="cards-wrapper">
          ${(activeTab === 'both' || activeTab === 'front') ? `
            <div class="student-card">
              <div class="card-watermark">SISWA</div>
              <div class="kop-header">
                <div class="kop-flex">
                  <div class="kop-logo">SMK</div>
                  <div class="kop-title">
                    <div class="sub1">PEMERINTAH KABUPATEN LAMPUNG SELATAN</div>
                    <div class="sub2">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
                    <div class="main-school">${schoolName}</div>
                  </div>
                </div>
                <div class="line-double"></div>
                <div class="line-thin"></div>
                <div class="card-ribbon">KARTU IDENTITAS & PRESENSI SISWA</div>
              </div>

              <div class="card-body">
                <div class="photo-container">
                  <div class="photo-frame">
                    ${photoSrc ? `<img src="${photoSrc}" alt="${student.fullName}" />` : `<div class="photo-placeholder">👤</div>`}
                  </div>
                  <div class="badge-active">SISWA AKTIF</div>
                </div>

                <div class="info-block">
                  <div class="student-name">${student.fullName}</div>
                  <table class="info-table">
                    <tr>
                      <td class="label-col">NIS</td>
                      <td class="colon-col">:</td>
                      <td class="val-col" style="font-family:monospace;">${student.nis || '-'}</td>
                    </tr>
                    <tr>
                      <td class="label-col">NISN</td>
                      <td class="colon-col">:</td>
                      <td class="val-col" style="font-family:monospace;">${student.nisn || '-'}</td>
                    </tr>
                    <tr>
                      <td class="label-col">Kelas</td>
                      <td class="colon-col">:</td>
                      <td class="val-col">Kelas ${student.class}</td>
                    </tr>
                    <tr>
                      <td class="label-col">RFID/Bio</td>
                      <td class="colon-col">:</td>
                      <td class="val-col">${rfidText} ${faceText}</td>
                    </tr>
                    <tr>
                      <td class="label-col" style="color:#1e40af; font-weight:800;">User Quiz</td>
                      <td class="colon-col" style="color:#1e40af;">:</td>
                      <td class="val-col" style="color:#1e40af; font-family:monospace; font-weight:800;">${student.username || '-'}</td>
                    </tr>
                    <tr>
                      <td class="label-col" style="color:#1e40af; font-weight:800;">Pass Quiz</td>
                      <td class="colon-col" style="color:#1e40af;">:</td>
                      <td class="val-col" style="color:#1e40af; font-family:monospace; font-weight:800;">${student.password || '-'}</td>
                    </tr>
                  </table>
                </div>

                <div class="qr-container">
                  <div class="qr-frame">
                    ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code Presensi" />` : ''}
                  </div>
                  <div class="qr-label">SCAN PRESENSI</div>
                </div>
              </div>

              <div class="card-footer">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180pt;">${schoolAddress}</span>
                <span style="font-family:monospace; font-weight:bold; color:#0f172a;">${qrCodeText}</span>
              </div>
            </div>
          ` : ''}

          ${(activeTab === 'both' || activeTab === 'back') ? `
            <div class="student-card">
              <div class="card-watermark">SMK</div>
              <div>
                <div class="rules-title">KETENTUAN KARTU PRESENSI SISWA</div>
                <ol class="rules-list">
                  <li>Kartu ini adalah identitas resmi peserta didik ${schoolName}.</li>
                  <li>Wajib dibawa setiap hari sekolah untuk autentikasi presensi harian (QR / Face / RFID).</li>
                  <li>Dilarang mencoret, merusak, atau memindahtangankan kartu ini kepada pihak lain.</li>
                  <li>Bila menemukan kartu ini, mohon kembalikan ke kantor ${schoolName}.</li>
                </ol>
                <div style="margin-top:3pt; padding:2pt 4pt; background:#eff6ff; border:0.5pt solid #bfdbfe; border-radius:2pt;">
                  <div style="font-size:4.8pt; font-weight:900; color:#1e3a8a; text-transform:uppercase; display:flex; justify-content:space-between; margin-bottom:1pt;">
                    <span>🔑 KREDENSIAL LOGIN QUIZ & POIN</span>
                    <span style="font-family:monospace; color:#2563eb;">PERMANEN</span>
                  </div>
                  <div style="font-size:5.5pt; font-family:monospace; font-weight:bold; color:#0f172a; display:flex; justify-content:space-between;">
                    <span>User: <strong style="color:#1d4ed8;">${student.username || '-'}</strong></span>
                    <span>Pass: <strong style="color:#1d4ed8;">${student.password || '-'}</strong></span>
                  </div>
                </div>
              </div>

              <div class="signature-section">
                <div class="notice-text">
                  * Simpan kartu dengan baik dan hindari goresan pada area kode QR.
                </div>

                <div class="signature-box">
                  <div class="signature-date">${schoolInfo?.district || 'Gunung Labuhan'}, ${todayFormatted}</div>
                  <div class="signature-role">Kepala Sekolah,</div>
                  <div class="signature-space">[ STEMPEL / TTD ]</div>
                  <div class="headmaster-title">${headmasterName}</div>
                  <div class="headmaster-nip">NIP. -</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 1500);
    }, 450);
};

export const StudentCard: React.FC<StudentCardProps> = ({ 
    student, 
    schoolInfo, 
    isBulk = false,
    activeTab = 'both'
}) => {
    const [qrDataUrl, setQrDataUrl] = useState('');
    
    const [cardData, setCardData] = useState({
        schoolName: schoolInfo?.officialName || schoolInfo?.name || 'SMK MANBAUL ULUM',
        schoolAddress: schoolInfo?.address || 'Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kec. Gunung Labuhan, Kab. Way Kanan',
        logoUrl: schoolInfo?.logoUrl || '',
        headmaster: schoolInfo?.headmaster || 'Muniroh',
        signatureDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    useEffect(() => {
        const codeValue = student.qrCode || student.rfidCode || student.nis || student.id;
        QRCode.toDataURL(codeValue, { width: 256, margin: 1 })
            .then((url) => setQrDataUrl(url))
            .catch((err) => console.error('Error generating QR:', err));
    }, [student.id, student.nis, student.rfidCode, student.qrCode]);

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isBulk) return;
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await imageFileToBase64(file);
                setCardData(prev => ({ ...prev, logoUrl: base64 }));
            } catch (error) {
                console.error(error);
            }
        }
    };

    const photoSrc = student.photoUrl || student.faceDataUrl || '';
    const rfidText = student.rfidCode ? student.rfidCode : '-';
    const qrCodeText = student.qrCode || `SMK-S-${student.nis || student.id}`;

    return (
        <div className={`flex ${isBulk ? 'flex-row gap-2' : 'flex-col md:flex-row gap-6'} items-center justify-center print:flex-row print:gap-2 print:m-0 max-w-full overflow-x-auto p-1`}>
            {/* --- KARTU BAGIAN DEPAN (FRONT) --- */}
            {(activeTab === 'both' || activeTab === 'front') && (
                <div 
                    id="student-card-front"
                    className="w-[336px] h-[214px] bg-white rounded-xl border-2 border-slate-900 p-3 shadow-md relative overflow-hidden flex flex-col justify-between print:shadow-none print:border-slate-900 print:m-0 flex-shrink-0"
                    style={{ 
                        width: '336px',
                        height: '214px',
                        pageBreakInside: 'avoid',
                        printColorAdjust: 'exact',
                        WebkitPrintColorAdjust: 'exact'
                    }}
                >
                    {/* Background Pattern Watermark */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                        <BuildingIcon className="w-52 h-52 text-slate-950" />
                    </div>

                    {/* KOP RESMI SEKOLAH */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 pb-1">
                            {/* Logo Bulat Resmi */}
                            <div className="relative group w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center p-0.5 flex-shrink-0 shadow-xs border border-slate-900 overflow-hidden">
                                {cardData.logoUrl ? (
                                    <img src={cardData.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                    <span className="text-[7.5px] font-black tracking-tighter">SMK</span>
                                )}
                                {!isBulk && (
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity no-print cursor-pointer">
                                        <UploadIcon className="w-3 h-3 text-white" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                    </label>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-center pr-1">
                                <h5 className="text-[6.5px] font-bold tracking-wider text-slate-800 uppercase leading-tight">PEMERINTAH KABUPATEN LAMPUNG SELATAN</h5>
                                <h5 className="text-[7px] font-black tracking-wider text-slate-900 uppercase leading-tight">DINAS PENDIDIKAN DAN KEBUDAYAAN</h5>
                                {isBulk ? (
                                    <h4 className="text-[10px] font-black tracking-widest text-slate-950 uppercase leading-tight mt-0.5 truncate">{cardData.schoolName}</h4>
                                ) : (
                                    <input 
                                        value={cardData.schoolName}
                                        onChange={(e) => setCardData({...cardData, schoolName: e.target.value})}
                                        className="bg-transparent border-none text-[10px] font-black tracking-widest text-slate-950 uppercase leading-tight mt-0.5 w-full text-center focus:outline-none focus:bg-slate-100 rounded px-0.5 truncate"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Garis Ganda Pembatas KOP */}
                        <div className="border-b-2 border-slate-900 mt-0.5"></div>
                        <div className="border-b border-slate-400 mt-[1.5px]"></div>

                        {/* Ribbon Judul Kartu */}
                        <div className="bg-slate-900 text-white text-center py-0.5 my-1 rounded-xs">
                            <span className="text-[7.5px] font-black tracking-widest uppercase">KARTU IDENTITAS & PRESENSI SISWA</span>
                        </div>
                    </div>

                    {/* ISI KARTU (PAS FOTO + TABEL IDENTITAS SISWA + QR CODE) */}
                    <div className="relative z-10 flex items-center gap-2.5 flex-1 my-auto">
                        {/* 1. PAS FOTO RESMI (3x4) */}
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-[66px] h-[84px] rounded border-2 border-slate-800 bg-slate-100 overflow-hidden shadow-xs flex items-center justify-center">
                                {photoSrc ? (
                                    <img src={photoSrc} alt={student.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-slate-400" />
                                )}
                            </div>
                            <span className="text-[6px] font-black text-slate-900 bg-slate-100 border border-slate-300 rounded px-1 py-0.2 mt-0.5 uppercase tracking-tight">
                                SISWA AKTIF
                            </span>
                        </div>

                        {/* 2. TABEL DATA SISWA */}
                        <div className="flex-1 min-w-0 text-slate-950 flex flex-col justify-center">
                            <h3 className="font-black text-[10.5px] text-slate-950 uppercase truncate leading-tight border-b border-slate-300 pb-0.5" title={student.fullName}>
                                {student.fullName}
                            </h3>
                            
                            <table className="w-full text-[7.5px] mt-1 border-collapse leading-tight">
                                <tbody>
                                    <tr>
                                        <td className="font-bold text-slate-700 w-[38px] py-0.5">NIS</td>
                                        <td className="w-[6px] text-center font-bold">:</td>
                                        <td className="font-mono font-bold text-slate-950 truncate">{student.nis || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-slate-700 py-0.5">NISN</td>
                                        <td className="text-center font-bold">:</td>
                                        <td className="font-mono font-bold text-slate-950 truncate">{student.nisn || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-slate-700 py-0.5">Kelas</td>
                                        <td className="text-center font-bold">:</td>
                                        <td className="font-bold text-slate-950">Kelas {student.class}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-slate-700 py-0.5">RFID/Bio</td>
                                        <td className="text-center font-bold">:</td>
                                        <td className="text-[7px] text-slate-900 font-medium truncate">
                                            {student.rfidCode ? <span className="font-mono font-bold">{rfidText}</span> : '-'} 
                                            {(student.faceRegistered || !!student.faceDataUrl) && <span className="ml-1 text-emerald-800 font-bold">✓ Wajah</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-indigo-900 py-0.5">User Quiz</td>
                                        <td className="text-center font-bold text-indigo-900">:</td>
                                        <td className="font-mono font-extrabold text-indigo-700 truncate">{student.username || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-indigo-900 py-0.5">Pass Quiz</td>
                                        <td className="text-center font-bold text-indigo-900">:</td>
                                        <td className="font-mono font-extrabold text-indigo-700 truncate">{student.password || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. QR CODE RESMI */}
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-[64px] h-[64px] bg-white border border-slate-400 rounded p-0.5 shadow-2xs flex items-center justify-center">
                                {qrDataUrl ? (
                                    <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[7px] text-slate-400">Loading</div>
                                )}
                            </div>
                            <span className="text-[5.5px] font-black text-slate-800 uppercase tracking-tighter mt-0.5">
                                SCAN PRESENSI
                            </span>
                        </div>
                    </div>

                    {/* FOOTER KARTU DEPAN */}
                    <div className="relative z-10 border-t border-slate-300 pt-0.5 flex items-center justify-between text-[6px] text-slate-600 font-medium">
                        {isBulk ? (
                            <span className="truncate max-w-[210px]">{cardData.schoolAddress}</span>
                        ) : (
                            <input 
                                value={cardData.schoolAddress}
                                onChange={(e) => setCardData({...cardData, schoolAddress: e.target.value})}
                                className="bg-transparent border-none text-[6px] text-slate-600 font-medium truncate max-w-[210px] focus:outline-none focus:bg-slate-100 rounded px-0.5"
                            />
                        )}
                        <span className="font-mono font-bold text-slate-800 truncate max-w-[100px]">{qrCodeText}</span>
                    </div>
                </div>
            )}

            {/* --- KARTU BAGIAN BELAKANG (BACK) --- */}
            {(activeTab === 'both' || activeTab === 'back') && (
                <div 
                    id="student-card-back"
                    className="w-[336px] h-[214px] bg-white rounded-xl border-2 border-slate-900 p-3 shadow-md relative overflow-hidden flex flex-col justify-between print:shadow-none print:border-slate-900 print:m-0 flex-shrink-0"
                    style={{ 
                        width: '336px',
                        height: '214px',
                        pageBreakInside: 'avoid',
                        printColorAdjust: 'exact',
                        WebkitPrintColorAdjust: 'exact'
                    }}
                >
                    {/* Watermark Logo Center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <BuildingIcon className="w-48 h-48 text-slate-950" />
                    </div>

                    <div className="relative z-10">
                        {/* Header Tata Tertib */}
                        <div className="bg-slate-900 text-white text-center py-0.5 rounded-xs mb-1.5">
                            <h4 className="text-[7.5px] font-black uppercase tracking-widest">KETENTUAN KARTU PRESENSI SISWA</h4>
                        </div>

                        {/* Butir Tata Tertib */}
                        <ol className="list-decimal list-inside text-[6.5px] text-slate-800 space-y-0.5 leading-snug pl-0.5">
                            <li>Kartu ini adalah identitas resmi peserta didik {cardData.schoolName}.</li>
                            <li>Wajib dibawa setiap hari sekolah untuk autentikasi presensi harian (QR / Face / RFID).</li>
                            <li>Dilarang mencoret, merusak, atau memindahtangankan kartu ini kepada pihak lain.</li>
                            <li>Bila menemukan kartu ini, mohon kembalikan ke kantor {cardData.schoolName}.</li>
                        </ol>

                        {/* Akses Login Quiz & Poin (Permanen) */}
                        <div className="mt-1 p-1 rounded bg-indigo-50 border border-indigo-200">
                            <div className="flex items-center justify-between text-[6px] font-black uppercase text-indigo-950 mb-0.5">
                                <span>🔑 KREDENSIAL LOGIN QUIZ & POIN</span>
                                <span className="text-[5px] bg-indigo-200 text-indigo-900 px-1 rounded font-mono">PERMANEN</span>
                            </div>
                            <div className="flex items-center justify-between text-[6.5px] font-mono font-bold text-slate-800">
                                <span>Username: <span className="text-indigo-700">{student.username || '-'}</span></span>
                                <span>Password: <span className="text-indigo-700">{student.password || '-'}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Pengesahan Kepala Sekolah */}
                    <div className="relative z-10 flex items-end justify-between pt-1 border-t border-slate-300">
                        <div className="text-[5.5px] text-slate-500 italic max-w-[130px] leading-tight">
                            * Simpan kartu dengan baik dan hindari goresan pada area kode QR.
                        </div>

                        <div className="text-center min-w-[130px]">
                            <p className="text-[6.5px] text-slate-700">
                                {schoolInfo?.district || 'Gunung Labuhan'}, {isBulk ? cardData.signatureDate : <input value={cardData.signatureDate} onChange={(e) => setCardData({...cardData, signatureDate: e.target.value})} className="w-20 bg-transparent border-b border-slate-300 text-center focus:outline-none text-[6.5px]" />}
                            </p>
                            <p className="text-[6.5px] font-bold text-slate-900 leading-tight">Kepala Sekolah,</p>
                            <div className="h-6 flex items-center justify-center">
                                <span className="text-[8px] font-serif text-slate-300 italic tracking-widest">[ TTD / STEMPEL ]</span>
                            </div>
                            {isBulk ? (
                                <p className="text-[7px] font-black text-slate-950 uppercase border-b border-slate-800 inline-block leading-none pb-0.5">
                                    {cardData.headmaster}
                                </p>
                            ) : (
                                <input 
                                    value={cardData.headmaster} 
                                    onChange={(e) => setCardData({...cardData, headmaster: e.target.value})}
                                    className="text-[7px] font-black text-slate-950 uppercase border-b border-slate-800 text-center bg-transparent focus:outline-none block mx-auto leading-none pb-0.5" 
                                />
                            )}
                            <p className="text-[6px] font-mono text-slate-700 leading-none mt-0.5">NIP. -</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
