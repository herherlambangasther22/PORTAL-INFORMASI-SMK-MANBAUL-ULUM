import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Teacher, Schedule, Subject, School, Notification, SchoolInfo } from '../types';
import { Card } from './Card';
import { Modal } from './Modal';
import { UserIcon, TrashIcon, EditIcon, PlusIcon, TeacherIcon, DownloadIcon, MenuIcon, LinkIcon, ChevronDownIcon, ChevronUpIcon, CameraIcon, FaceScanIcon, QrCodeIcon, RfidCardIcon, XIcon, CheckCircleIcon } from './icons/Icons';
import { SearchBar } from './SearchBar';
import { LoadingSpinner } from './LoadingSpinner';
import { NotificationBell } from './NotificationBell';
import { TeacherForm } from './TeacherForm';
import { generateUniqueTeacherQr, generateTeacherQrDataUrl } from '../utils/qrHelper';
import { extractBiometricFeatures, detectFacePresence, invalidateTeacherBiometricCache } from '../utils/faceBiometrics';

// Declare XLSX and QRCode for global scripts
declare var XLSX: any;
declare var QRCode: any;

interface TeachersViewProps {
  teachers: Teacher[];
  schedule: Schedule;
  subjects: Subject[];
  schoolType: School;
  schoolInfo?: SchoolInfo;
  onAdd: (school: School, teacherData: Omit<Teacher, 'id'>) => Promise<void>;
  onEdit: (school: School, teacher: Teacher) => Promise<void>;
  onDelete: (school: School, id: number) => Promise<void>;
  isProcessing: boolean;
  onMenuClick: () => void;
  notifications: Notification[];
  onNotificationsOpen: () => void;
}

// Helper function for 100% reliable, pristine GTK ID Card printing (Front, Back, or Both) without clipping
export const printTeacherCardDirectly = (
    teacher: Teacher,
    qrDataUrl: string,
    schoolInfo?: SchoolInfo,
    activeTab: 'both' | 'front' | 'back' = 'both'
) => {
    const schoolName = schoolInfo?.officialName || schoolInfo?.name || 'SMK MANBAUL ULUM';
    const schoolAddress = schoolInfo?.address || 'Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kec. Gunung Labuhan, Kab. Way Kanan';
    const headmasterName = schoolInfo?.headmaster || 'Muniroh';
    const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const subjectsText = (teacher.subjectsTaught && teacher.subjectsTaught.length > 0) 
        ? teacher.subjectsTaught.join(', ') 
        : 'Guru Kelas / Mata Pelajaran';

    const photoSrc = teacher.photoUrl || teacher.faceDataUrl || '';
    const rfidText = teacher.rfidCode ? teacher.rfidCode : '-';
    const faceText = teacher.faceRegistered ? '✓ Wajah' : '';
    const qrCodeText = teacher.qrCode || `SMK-GURU-G${teacher.id}`;

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
        <title>Cetak Kartu GTK - ${teacher.name}</title>
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
          .gtk-card {
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
            font-size: 8pt;
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
          .teacher-name {
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
            width: 28pt;
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
            max-width: 90pt;
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
            <div class="gtk-card">
              <div class="card-watermark">GTK</div>
              <div class="kop-header">
                <div class="kop-flex">
                  <div class="kop-logo">GTK</div>
                  <div class="kop-title">
                    <div class="sub1">PEMERINTAH KABUPATEN LAMPUNG SELATAN</div>
                    <div class="sub2">DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
                    <div class="main-school">${schoolName}</div>
                  </div>
                </div>
                <div class="line-double"></div>
                <div class="line-thin"></div>
                <div class="card-ribbon">KARTU IDENTITAS & PRESENSI PTK</div>
              </div>

              <div class="card-body">
                <div class="photo-container">
                  <div class="photo-frame">
                    ${photoSrc ? `<img src="${photoSrc}" alt="${teacher.name}" />` : `<div class="photo-placeholder">👤</div>`}
                  </div>
                  <div class="badge-active">GTK AKTIF</div>
                </div>

                <div class="info-block">
                  <div class="teacher-name">${teacher.name}</div>
                  <table class="info-table">
                    <tr>
                      <td class="label-col">NIP</td>
                      <td class="colon-col">:</td>
                      <td class="val-col" style="font-family:monospace;">${teacher.nip || '-'}</td>
                    </tr>
                    <tr>
                      <td class="label-col">ID GTK</td>
                      <td class="colon-col">:</td>
                      <td class="val-col" style="font-family:monospace;">G-${teacher.id}</td>
                    </tr>
                    <tr>
                      <td class="label-col">Tugas</td>
                      <td class="colon-col">:</td>
                      <td class="val-col">${subjectsText}</td>
                    </tr>
                    <tr>
                      <td class="label-col">RFID/Bio</td>
                      <td class="colon-col">:</td>
                      <td class="val-col">${rfidText} ${faceText}</td>
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
            <div class="gtk-card">
              <div class="card-watermark">GTK</div>
              <div>
                <div class="rules-title">KETENTUAN KARTU PRESENSI GTK</div>
                <ol class="rules-list">
                  <li>Kartu ini adalah identitas resmi Pendidik & Tenaga Kependidikan ${schoolName}.</li>
                  <li>Wajib dibawa saat bertugas untuk autentikasi presensi harian (QR / Face / RFID).</li>
                  <li>Dilarang memindahtangankan atau menyalahgunakan kartu ini kepada pihak lain.</li>
                  <li>Bila menemukan kartu ini, mohon kembalikan ke kantor ${schoolName}.</li>
                </ol>
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

// Professional Teacher ID Card component for printing & visual preview (Default White Background, Black Text, Standard Black QR)
interface TeacherCardProps {
    teacher: Teacher;
    qrDataUrl: string;
    schoolInfo?: SchoolInfo;
    activeTab?: 'both' | 'front' | 'back';
}

const TeacherDigitalIdCard: React.FC<TeacherCardProps> = ({ teacher, qrDataUrl, schoolInfo, activeTab = 'both' }) => {
    const schoolName = schoolInfo?.officialName || schoolInfo?.name || 'SMK MANBAUL ULUM';
    const schoolAddress = schoolInfo?.address || 'Jl. Pamuka Jaya, Dusun 01 Labuhan Jaya, Kec. Gunung Labuhan, Kab. Way Kanan';
    const headmasterName = schoolInfo?.headmaster || 'Muniroh';
    const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const subjectsText = (teacher.subjectsTaught && teacher.subjectsTaught.length > 0) 
        ? teacher.subjectsTaught.join(', ') 
        : 'Guru Kelas / Mata Pelajaran';

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 print:flex-row print:gap-4 print:items-start max-w-full overflow-x-auto p-1">
            {/* --- KARTU BAGIAN DEPAN (FRONT) --- */}
            {(activeTab === 'both' || activeTab === 'front') && (
                <div 
                    id="teacher-card-front"
                    className="w-[336px] h-[214px] bg-white rounded-xl border-2 border-slate-900 p-3 shadow-md relative overflow-hidden flex flex-col justify-between print:shadow-none print:border-slate-900 print:m-0 flex-shrink-0"
                    style={{ 
                        pageBreakInside: 'avoid',
                        printColorAdjust: 'exact',
                        WebkitPrintColorAdjust: 'exact'
                    }}
                >
                    {/* Background Pattern Watermark */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                        <TeacherIcon className="w-52 h-52 text-slate-950" />
                    </div>

                    {/* KOP RESMI SEKOLAH */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 pb-1">
                            {/* Logo Bulat Resmi */}
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center p-0.5 flex-shrink-0 shadow-xs border border-slate-900 overflow-hidden">
                                {schoolInfo?.logoUrl ? (
                                    <img src={schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                    <TeacherIcon className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-center pr-1">
                                <h5 className="text-[6.5px] font-bold tracking-wider text-slate-800 uppercase leading-tight">PEMERINTAH KABUPATEN LAMPUNG SELATAN</h5>
                                <h5 className="text-[7px] font-black tracking-wider text-slate-900 uppercase leading-tight">DINAS PENDIDIKAN DAN KEBUDAYAAN</h5>
                                <h4 className="text-[10px] font-black tracking-widest text-slate-950 uppercase leading-tight mt-0.5">{schoolName}</h4>
                            </div>
                        </div>

                        {/* Garis Ganda Pembatas KOP */}
                        <div className="border-b-2 border-slate-900 mt-0.5"></div>
                        <div className="border-b border-slate-400 mt-[1.5px]"></div>

                        {/* Ribbon Judul Kartu */}
                        <div className="bg-slate-900 text-white text-center py-0.5 my-1 rounded-xs">
                            <span className="text-[7.5px] font-black tracking-widest uppercase">KARTU IDENTITAS & PRESENSI PTK</span>
                        </div>
                    </div>

                    {/* ISI KARTU (PAS FOTO + TABEL IDENTITAS + QR CODE) */}
                    <div className="relative z-10 flex items-center gap-2.5 flex-1 my-auto">
                        {/* 1. PAS FOTO RESMI (3x4) */}
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-[66px] h-[84px] rounded border-2 border-slate-800 bg-slate-100 overflow-hidden shadow-xs flex items-center justify-center">
                                {teacher.photoUrl ? (
                                    <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
                                ) : teacher.faceDataUrl ? (
                                    <img src={teacher.faceDataUrl} alt={teacher.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-10 h-10 text-slate-400" />
                                )}
                            </div>
                            <span className="text-[6px] font-black text-slate-900 bg-slate-100 border border-slate-300 rounded px-1 py-0.2 mt-0.5 uppercase tracking-tight">
                                GTK AKTIF
                            </span>
                        </div>

                        {/* 2. TABEL DATA GURU */}
                        <div className="flex-1 min-w-0 text-slate-950 flex flex-col justify-center">
                            <h3 className="font-black text-[10.5px] text-slate-950 uppercase truncate leading-tight border-b border-slate-300 pb-0.5">
                                {teacher.name}
                            </h3>
                            
                            <table className="w-full text-[7.5px] mt-1 border-collapse leading-tight">
                                <tbody>
                                    <tr>
                                        <td className="font-bold text-slate-700 w-[42px] py-0.5">NIP</td>
                                        <td className="w-[6px] text-center font-bold">:</td>
                                        <td className="font-mono font-bold text-slate-950 truncate">{teacher.nip || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-slate-700 py-0.5">ID GTK</td>
                                        <td className="text-center font-bold">:</td>
                                        <td className="font-mono font-bold text-slate-950">G-{teacher.id}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-slate-700 py-0.5">Tugas</td>
                                        <td className="text-center font-bold">:</td>
                                        <td className="font-semibold text-slate-900 truncate" title={subjectsText}>{subjectsText}</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold text-slate-700 py-0.5">RFID / Bio</td>
                                        <td className="text-center font-bold">:</td>
                                        <td className="text-[7px] text-slate-900 font-medium truncate">
                                            {teacher.rfidCode ? <span className="font-mono font-bold">{teacher.rfidCode}</span> : '-'} 
                                            {teacher.faceRegistered && <span className="ml-1 text-emerald-800 font-bold">✓ Wajah</span>}
                                        </td>
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
                        <span className="truncate max-w-[210px]">{schoolAddress}</span>
                        <span className="font-mono font-bold text-slate-800">{teacher.qrCode || `SMK-GURU-G${teacher.id}`}</span>
                    </div>
                </div>
            )}

            {/* --- KARTU BAGIAN BELAKANG (BACK) --- */}
            {(activeTab === 'both' || activeTab === 'back') && (
                <div 
                    id="teacher-card-back"
                    className="w-[336px] h-[214px] bg-white rounded-xl border-2 border-slate-900 p-3 shadow-md relative overflow-hidden flex flex-col justify-between print:shadow-none print:border-slate-900 print:m-0 flex-shrink-0"
                    style={{ 
                        pageBreakInside: 'avoid',
                        printColorAdjust: 'exact',
                        WebkitPrintColorAdjust: 'exact'
                    }}
                >
                    {/* Watermark Logo Center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                        <TeacherIcon className="w-48 h-48 text-slate-950" />
                    </div>

                    <div className="relative z-10">
                        {/* Header Tata Tertib */}
                        <div className="bg-slate-900 text-white text-center py-0.5 rounded-xs mb-1.5">
                            <h4 className="text-[7.5px] font-black uppercase tracking-widest">KETENTUAN KARTU PRESENSI GTK</h4>
                        </div>

                        {/* Butir Tata Tertib */}
                        <ol className="list-decimal list-inside text-[6.5px] text-slate-800 space-y-1 leading-snug pl-0.5">
                            <li>Kartu ini adalah identitas resmi Pendidik & Tenaga Kependidikan {schoolName}.</li>
                            <li>Wajib dibawa saat bertugas untuk autentikasi presensi harian (QR / Face / RFID).</li>
                            <li>Dilarang memindahtangankan atau menyalahgunakan kartu ini kepada pihak lain.</li>
                            <li>Bila menemukan kartu ini, mohon kembalikan ke kantor {schoolName}.</li>
                        </ol>
                    </div>

                    {/* Pengesahan Kepala Sekolah */}
                    <div className="relative z-10 flex items-end justify-between pt-1 border-t border-slate-300">
                        <div className="text-[5.5px] text-slate-500 italic max-w-[130px] leading-tight">
                            * Simpan kartu dengan baik dan hindari goresan pada area kode QR.
                        </div>

                        <div className="text-center min-w-[130px]">
                            <p className="text-[6.5px] text-slate-700">{schoolInfo?.district || 'Gunung Labuhan'}, {todayFormatted}</p>
                            <p className="text-[6.5px] font-bold text-slate-900 leading-tight">Kepala Sekolah,</p>
                            <div className="h-6 flex items-center justify-center">
                                <span className="text-[8px] font-serif text-slate-300 italic tracking-widest">[ TTD / STEMPEL ]</span>
                            </div>
                            <p className="text-[7px] font-black text-slate-950 uppercase border-b border-slate-800 inline-block leading-none pb-0.5">
                                {headmasterName}
                            </p>
                            <p className="text-[6px] font-mono text-slate-700 leading-none mt-0.5">NIP. -</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LinkModal: React.FC<{ teacher: Teacher | null; onClose: () => void }> = ({ teacher, onClose }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Salin Tautan');
    
    const portalUrl = useMemo(() => {
        if (!teacher) return '';
        return `${window.location.origin}${window.location.pathname}#/teacher-portal/${teacher.id}`;
    }, [teacher]);

    useEffect(() => {
        if (teacher && portalUrl) {
            QRCode.toDataURL(portalUrl, { width: 256, margin: 2 }, (err: any, url: string) => {
                if (err) console.error(err);
                else setQrCodeUrl(url);
            });
        }
    }, [teacher, portalUrl]);

    const handleCopy = () => {
        navigator.clipboard.writeText(portalUrl).then(() => {
            setCopyButtonText('Tersalin!');
            setTimeout(() => setCopyButtonText('Salin Tautan'), 2000);
        });
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Akses Portal Guru - ${teacher?.name}`,
                text: `Yth. Bapak/Ibu ${teacher?.name}, berikut adalah tautan akses portal guru untuk:\n1. Melakukan Absensi Kehadiran Diri (Harian)\n2. Menginput Absensi Siswa di Kelas\n\nHarap simpan tautan ini.`,
                url: portalUrl,
            });
        }
    };
    
    if (!teacher) return null;

    return (
        <Modal isOpen={!!teacher} onClose={onClose} title="Bagikan Akses Guru">
            <div className="flex flex-col items-center text-center gap-4">
                <Card className="p-3 bg-blue-50 text-blue-800 text-sm w-full text-left">
                    <p><strong>Fungsi Tautan:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Untuk <strong>Absensi Mandiri</strong> guru (muncul otomatis saat dibuka).</li>
                        <li>Untuk <strong>Absensi Siswa</strong> sesuai jadwal mengajar.</li>
                    </ul>
                </Card>
                {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt={`QR Code for ${teacher.name}`} className="w-48 h-48 rounded-lg shadow-lg border-4 border-white" />
                ) : (
                    <div className="w-48 h-48 bg-slate-200 flex items-center justify-center rounded-lg"><LoadingSpinner /></div>
                )}
                <div>
                    <p className="font-bold text-lg text-slate-800">{teacher.name}</p>
                    <p className="text-xs text-slate-500">Scan QR atau salin link di bawah</p>
                </div>
                
                <div className="w-full flex flex-col sm:flex-row gap-2 mt-2">
                    <button onClick={handleCopy} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 bg-slate-600 text-white shadow-md hover:bg-slate-700 shimmer-active">
                        {copyButtonText}
                    </button>
                    {navigator.share && (
                        <button onClick={handleShare} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 shimmer-active flex items-center justify-center gap-2">
                            <span>Kirim via WA/Email</span>
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};


export const TeachersView: React.FC<TeachersViewProps> = ({ teachers, schedule, subjects, schoolType, schoolInfo, onAdd, onEdit, onDelete, isProcessing, onMenuClick, notifications, onNotificationsOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTeacher, setDetailTeacher] = useState<Teacher | null>(null);
  const [linkModalTeacher, setLinkModalTeacher] = useState<Teacher | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [formInstanceKey, setFormInstanceKey] = useState(0);

  // Biometric Face Capture States
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [scanTargetTeacher, setScanTargetTeacher] = useState<Teacher | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFaceUploading, setIsFaceUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Unique QR Code & ID Card Modal States
  const [qrModalTeacher, setQrModalTeacher] = useState<Teacher | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');
  const [isCopiedQr, setIsCopiedQr] = useState<boolean>(false);
  const [detailQrDataUrl, setDetailQrDataUrl] = useState<string>('');
  const [cardPrintTab, setCardPrintTab] = useState<'both' | 'front' | 'back'>('both');

  // Biometric Preview Modal State
  const [biometricModalTeacher, setBiometricModalTeacher] = useState<Teacher | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const openQrModal = async (teacher: Teacher) => {
    const qrValue = teacher.qrCode || generateUniqueTeacherQr(teacher);
    const url = await generateTeacherQrDataUrl(qrValue, { width: 350, margin: 1 });
    setQrModalTeacher({ ...teacher, qrCode: qrValue });
    setQrModalDataUrl(url);
    setCardPrintTab('both');
    setIsCopiedQr(false);
  };

  const handleCopyQrToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setIsCopiedQr(true);
    setTimeout(() => setIsCopiedQr(false), 2500);
  };

  const handlePrintTeacherCard = () => {
    if (!qrModalTeacher) return;
    printTeacherCardDirectly(qrModalTeacher, qrModalDataUrl, schoolInfo, cardPrintTab);
  };

  const handleDownloadQrImage = (teacher: Teacher, dataUrl: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_SMK_GURU_${teacher.name.replace(/\s+/g, '_')}_${teacher.id}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (detailTeacher) {
      const qrValue = detailTeacher.qrCode || generateUniqueTeacherQr(detailTeacher);
      generateTeacherQrDataUrl(qrValue, { width: 200, margin: 1 }).then(url => setDetailQrDataUrl(url));
    } else {
      setDetailQrDataUrl('');
    }
  }, [detailTeacher]);

  // Camera Face Capture methods
  const startCamera = async (teacher: Teacher) => {
    setScanTargetTeacher(teacher);
    setIsCapturingFace(true);

    const strategies = [
      { video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } } },
      { video: { facingMode: facingMode } },
      { video: { facingMode: facingMode === 'user' ? 'environment' : 'user' } },
      { video: true }
    ];

    let stream: MediaStream | null = null;
    for (const constraints of strategies) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) break;
      } catch (err) {
        // fallback
      }
    }

    if (stream) {
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error(e));
        }
      }, 100);
    } else {
      alert("Gagal mengakses kamera. Pastikan izin kamera telah diberikan pada browser atau HP.");
      setIsCapturingFace(false);
      setScanTargetTeacher(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturingFace(false);
    setScanTargetTeacher(null);
  };

  const captureFace = async () => {
    if (videoRef.current && scanTargetTeacher) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);

        // Validasi keberadaan wajah sebelum disimpan
        const presence = detectFacePresence(canvas);
        if (!presence.hasFace) {
          alert("❌ Wajah guru tidak terdeteksi dengan jelas di kamera. Pastikan wajah tegak lurus di depan kamera dengan pencahayaan memadai.");
          return;
        }

        const base64 = canvas.toDataURL('image/jpeg', 0.88);
        const nowStr = new Date().toLocaleString('id-ID');
        const biometricHash = `BIO-FACE-GURU-${scanTargetTeacher.id}-${Date.now().toString(36).toUpperCase()}`;

        // Ekstraksi fitur biometrik visual langsung
        const bioFeatures = await extractBiometricFeatures(canvas);
        const bioDescriptor = bioFeatures ? JSON.stringify(bioFeatures) : undefined;

        const updatedTeacher: Teacher = {
          ...scanTargetTeacher,
          faceDataUrl: base64,
          faceRegistered: true,
          faceRegisteredAt: nowStr,
          faceBiometricHash: biometricHash,
          faceBiometricDescriptor: bioDescriptor,
        };

        invalidateTeacherBiometricCache(scanTargetTeacher.id);
        await onEdit(schoolType, updatedTeacher);
        if (detailTeacher && detailTeacher.id === scanTargetTeacher.id) {
          setDetailTeacher(updatedTeacher);
        }
        if (biometricModalTeacher && biometricModalTeacher.id === scanTargetTeacher.id) {
          setBiometricModalTeacher(updatedTeacher);
        }
        stopCamera();
        alert(`✓ BERHASIL: Biometrik wajah ${scanTargetTeacher.name} telah didaftarkan dan disimpan ke Master Data Guru Pengajar!`);
      }
    }
  };

  const handleUploadFacePhoto = (teacher: Teacher, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFaceUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const nowStr = new Date().toLocaleString('id-ID');
        const biometricHash = `BIO-FACE-GURU-${teacher.id}-${Date.now().toString(36).toUpperCase()}`;

        const bioFeatures = await extractBiometricFeatures(base64);
        if (!bioFeatures) {
          alert('❌ Foto tidak dapat diproses atau wajah tidak terdeteksi. Pastikan foto portrait jelas.');
          setIsFaceUploading(false);
          return;
        }
        const bioDescriptor = JSON.stringify(bioFeatures);

        const updatedTeacher: Teacher = {
          ...teacher,
          faceDataUrl: base64,
          faceRegistered: true,
          faceRegisteredAt: nowStr,
          faceBiometricHash: biometricHash,
          faceBiometricDescriptor: bioDescriptor,
        };

        invalidateTeacherBiometricCache(teacher.id);
        await onEdit(schoolType, updatedTeacher);
        if (detailTeacher && detailTeacher.id === teacher.id) {
          setDetailTeacher(updatedTeacher);
        }
        if (biometricModalTeacher && biometricModalTeacher.id === teacher.id) {
          setBiometricModalTeacher(updatedTeacher);
        }
        alert(`✓ BERHASIL: Foto biometrik wajah untuk ${teacher.name} berhasil disimpan!`);
      }
      setIsFaceUploading(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca file gambar.');
      setIsFaceUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFaceBiometric = async (teacher: Teacher) => {
    if (window.confirm(`Hapus data biometrik wajah untuk "${teacher.name}"?\nSetelah dihapus, guru ini tidak dapat melakukan absensi scan wajah sampai didaftarkan kembali.`)) {
      const updatedTeacher: Teacher = {
        ...teacher,
        faceDataUrl: undefined,
        faceRegistered: false,
        faceRegisteredAt: undefined,
        faceBiometricHash: undefined,
        faceBiometricDescriptor: undefined
      };
      invalidateTeacherBiometricCache(teacher.id);
      await onEdit(schoolType, updatedTeacher);
      if (detailTeacher && detailTeacher.id === teacher.id) {
        setDetailTeacher(updatedTeacher);
      }
      if (biometricModalTeacher && biometricModalTeacher.id === teacher.id) {
        setBiometricModalTeacher(null);
      }
      alert('Data biometrik wajah berhasil direset.');
    }
  };
  
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.code, s.name])), [subjects]);

  const schoolSpecificTeachers = useMemo(() => {
    const schoolSubjectCodes = new Set(subjects.map(s => s.code));
    return teachers.filter(teacher => {
        if (teacher.subjectsTaught.length === 0) return true;
        return teacher.subjectsTaught.some(taughtCode => schoolSubjectCodes.has(taughtCode));
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [teachers, subjects, schoolType]);

  const filteredTeachers = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (!lowercasedQuery) return schoolSpecificTeachers;

    return schoolSpecificTeachers.filter(teacher =>
        teacher.name.toLowerCase().includes(lowercasedQuery) ||
        (teacher.nip && teacher.nip.toLowerCase().includes(lowercasedQuery)) ||
        (teacher.rfidCode && teacher.rfidCode.toLowerCase().includes(lowercasedQuery)) ||
        (teacher.qrCode && teacher.qrCode.toLowerCase().includes(lowercasedQuery))
    );
  }, [schoolSpecificTeachers, searchQuery]);

  const visibleTeachers = isExpanded ? filteredTeachers : filteredTeachers.slice(0, 10);

  const displaySubjects = (subjectCodes: string[]): string => {
    if (!subjectCodes || subjectCodes.length === 0) return 'Staf/Bimbingan';
    return subjectCodes
      .map(code => subjectMap.get(code))
      .filter(Boolean)
      .join(', ');
  };

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormInstanceKey(Date.now());
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(JSON.parse(JSON.stringify(teacher)));
    setFormInstanceKey(Date.now());
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const handleSave = async (data: Omit<Teacher, 'id'>) => {
    if (editingTeacher) {
      await onEdit(schoolType, { ...editingTeacher, ...data });
    } else {
      await onAdd(schoolType, data);
    }
    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (isProcessing) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus guru ini?')) {
        await onDelete(schoolType, id);
    }
  };

  const handleExportToExcel = () => {
    const dataForExport = filteredTeachers.map(teacher => ({
        'ID Guru': `G-${teacher.id}`,
        'Nama Lengkap': teacher.name,
        'NIP': teacher.nip || '-',
        'Kode RFID': teacher.rfidCode || '-',
        'Kode QR Unik': teacher.qrCode || '-',
        'Status Biometrik': teacher.faceRegistered ? 'Terdaftar' : 'Belum',
        'Mata Pelajaran Diampu': displaySubjects(teacher.subjectsTaught),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru');

    worksheet['!cols'] = [ { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 16 }, { wch: 30 }, { wch: 16 }, { wch: 35 } ];

    XLSX.writeFile(workbook, `data_guru_${schoolType.toUpperCase()}.xlsx`);
  };

  const teacherScheduleSummary = useMemo(() => {
    if (!detailTeacher || !schedule) return {};
    
    const summary: { [day: string]: { time: string; period: string | number; className: string; subjectName: string; }[] } = {};
    const daysOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];

    daysOrder.forEach(day => {
        const periods = schedule?.[day];
        if (periods) {
            periods.forEach(period => {
                for (const className in period.classes) {
                    const entry = period.classes[className];
                    if (entry.teacherCode === detailTeacher.id && !['ISTIRAHAT', 'ISHOMA', 'TADARUS'].includes(entry.subjectCode)) {
                        if (!summary[day]) summary[day] = [];
                        summary[day].push({
                            time: period.time,
                            period: period.period,
                            className,
                            subjectName: subjectMap.get(entry.subjectCode) || 'N/A'
                        });
                    }
                }
            });
        }
    });
    return summary;
  }, [detailTeacher, schedule, subjectMap]);

  return (
    <div className="flex flex-col gap-6 h-full animate-fade-in">
      <LinkModal teacher={linkModalTeacher} onClose={() => setLinkModalTeacher(null)} />
      
      {/* MODAL LIHAT & KELOLA DATA BIOMETRIK WAJAH GURU */}
      <Modal 
          isOpen={!!biometricModalTeacher} 
          onClose={() => setBiometricModalTeacher(null)} 
          title="Data Biometrik Wajah Guru"
          size="md"
      >
          {biometricModalTeacher && (
              <div className="flex flex-col items-center gap-4 p-2 text-center animate-slide-up-fade">
                  <div className="relative">
                      <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-emerald-500 shadow-xl bg-slate-900 flex items-center justify-center">
                          {biometricModalTeacher.faceDataUrl ? (
                              <img 
                                  src={biometricModalTeacher.faceDataUrl} 
                                  alt={`Biometrik Wajah ${biometricModalTeacher.name}`} 
                                  className="w-full h-full object-cover"
                              />
                          ) : (
                              <div className="flex flex-col items-center justify-center p-4 text-slate-400">
                                  <FaceScanIcon className="w-16 h-16 text-slate-500 mb-2" />
                                  <span className="text-xs">Belum ada rekaman biometrik wajah</span>
                              </div>
                          )}
                      </div>
                      {biometricModalTeacher.faceRegistered && (
                          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 border-2 border-white whitespace-nowrap">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Biometrik Terverifikasi
                          </span>
                      )}
                  </div>

                  <div className="w-full mt-2">
                      <h3 className="text-lg font-bold text-slate-800">{biometricModalTeacher.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">NIP: {biometricModalTeacher.nip || '-'} • ID: G-{biometricModalTeacher.id}</p>
                      
                      <div className="mt-3 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-left text-xs space-y-2">
                          <div className="flex justify-between items-center">
                              <span className="text-slate-600 font-medium">Status Perekaman:</span>
                              <span className="font-bold text-emerald-800">
                                  {biometricModalTeacher.faceRegistered ? '✓ Aktif untuk Presensi Wajah' : 'Belum Terdaftar'}
                              </span>
                          </div>
                          {biometricModalTeacher.faceRegisteredAt && (
                              <div className="flex justify-between items-center">
                                  <span className="text-slate-600 font-medium">Waktu Perekaman:</span>
                                  <span className="font-mono text-slate-700">{biometricModalTeacher.faceRegisteredAt}</span>
                              </div>
                          )}
                          {biometricModalTeacher.faceBiometricHash && (
                              <div className="flex justify-between items-center">
                                  <span className="text-slate-600 font-medium">Token Hash Biometrik:</span>
                                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 text-slate-700 truncate max-w-[180px]">
                                      {biometricModalTeacher.faceBiometricHash}
                                  </span>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-3 border-t border-slate-200">
                      <button
                          type="button"
                          onClick={() => {
                              const target = biometricModalTeacher;
                              setBiometricModalTeacher(null);
                              startCamera(target);
                          }}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                          <CameraIcon className="w-4 h-4" />
                          <span>{biometricModalTeacher.faceRegistered ? 'Rekam Ulang Wajah' : 'Mulai Perekaman Kamera'}</span>
                      </button>
                      <label className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer flex items-center gap-1.5 transition-all">
                          <span>Unggah Foto</span>
                          <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                  const target = biometricModalTeacher;
                                  handleUploadFacePhoto(target, e);
                                  setBiometricModalTeacher(null);
                              }} 
                          />
                      </label>
                      {biometricModalTeacher.faceRegistered && (
                          <button
                              type="button"
                              onClick={() => {
                                  const target = biometricModalTeacher;
                                  handleDeleteFaceBiometric(target);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                          >
                              <TrashIcon className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                          </button>
                      )}
                  </div>
              </div>
          )}
      </Modal>

      {/* UNIQUE TEACHER QR CODE & DIGITAL ID CARD MODAL */}
      <Modal isOpen={!!qrModalTeacher} onClose={() => setQrModalTeacher(null)} title="QR Code & Kartu Presensi Pendidik / GTK" size="xl">
        {qrModalTeacher && (
            <div className="flex flex-col items-center gap-5 p-1 sm:p-2">
                {/* View/Print Mode Selector Tabs */}
                <div className="flex items-center justify-center p-1 bg-slate-100 rounded-xl border border-slate-200 no-print w-full max-w-md">
                    <button
                        type="button"
                        onClick={() => setCardPrintTab('both')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${cardPrintTab === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Depan & Belakang
                    </button>
                    <button
                        type="button"
                        onClick={() => setCardPrintTab('front')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${cardPrintTab === 'front' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Tampak Depan
                    </button>
                    <button
                        type="button"
                        onClick={() => setCardPrintTab('back')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${cardPrintTab === 'back' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Tampak Belakang
                    </button>
                </div>

                {/* Visual ID Card Preview / Print Container */}
                <div id="teacher-print-area" className="w-full flex items-center justify-center overflow-x-auto py-2">
                    <TeacherDigitalIdCard 
                        teacher={qrModalTeacher} 
                        qrDataUrl={qrModalDataUrl} 
                        schoolInfo={schoolInfo}
                        activeTab={cardPrintTab}
                    />
                </div>

                {/* Big QR Code Inspection Box */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xs no-print">
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 flex-shrink-0">
                        {qrModalDataUrl ? (
                            <img src={qrModalDataUrl} alt="QR Code" className="w-28 h-28 object-contain" />
                        ) : (
                            <div className="w-28 h-28 flex items-center justify-center"><LoadingSpinner /></div>
                        )}
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-200 px-2 py-0.5 rounded">Payload QR Presensi</span>
                            <span className="text-[10px] font-mono font-bold text-slate-600">G-{qrModalTeacher.id}</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-slate-900 break-all bg-white p-2 rounded-lg border border-slate-200 mt-1.5 shadow-2xs">
                            {qrModalTeacher.qrCode || generateUniqueTeacherQr(qrModalTeacher)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            QR Code ini terdaftar untuk <strong className="text-slate-800">{qrModalTeacher.name}</strong> dan siap dipindai di mesin scanner / kamera absensi.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 w-full border-t border-slate-200 pt-4 no-print">
                    <button
                        type="button"
                        onClick={() => handleCopyQrToken(qrModalTeacher.qrCode || generateUniqueTeacherQr(qrModalTeacher))}
                        className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-slate-800 text-white shadow-xs hover:bg-slate-900 flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                        <span>{isCopiedQr ? '✓ Token Tersalin!' : 'Salin Token QR'}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDownloadQrImage(qrModalTeacher, qrModalDataUrl)}
                        className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                        <DownloadIcon className="w-4 h-4 text-slate-700" />
                        <span>Unduh QR Code (.png)</span>
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintTeacherCard}
                        className="py-2.5 px-5 rounded-xl text-xs font-black transition-all bg-slate-900 text-white shadow-md hover:bg-black flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                        <QrCodeIcon className="w-4 h-4 text-emerald-400" />
                        <span>Cetak Kartu GTK</span>
                    </button>
                </div>

                <style>{`
                    @media print {
                        body * { visibility: hidden !important; }
                        #teacher-print-area, #teacher-print-area * { visibility: visible !important; }
                        #teacher-print-area { 
                            position: absolute !important; 
                            left: 50% !important; 
                            top: 24px !important; 
                            transform: translateX(-50%) !important; 
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            display: flex !important;
                            justify-content: center !important;
                            align-items: flex-start !important;
                        }
                        .no-print { display: none !important; }
                        #teacher-card-front, #teacher-card-back {
                            box-shadow: none !important;
                            border: 2px solid #000 !important;
                            page-break-inside: avoid !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                `}</style>
            </div>
        )}
      </Modal>

      {/* FULLSCREEN BIOMETRIC CAMERA MODAL FOR TEACHER */}
      {isCapturingFace && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-fade-in p-4">
              <div className="relative w-full h-full max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
                  <div className="text-center mb-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black uppercase tracking-wider mb-1">
                          <FaceScanIcon className="w-4 h-4 text-emerald-400" />
                          <span>Perekaman Biometrik Wajah Guru & PTK</span>
                      </div>
                      {scanTargetTeacher && (
                          <h3 className="text-white text-xl sm:text-2xl font-black uppercase tracking-tight">
                              {scanTargetTeacher.name} <span className="text-emerald-400 text-sm font-bold font-mono">(ID: G-{scanTargetTeacher.id} • NIP: {scanTargetTeacher.nip || '-'})</span>
                          </h3>
                      )}
                  </div>
                  
                  <div className="relative w-full aspect-video max-h-[55vh] bg-slate-950 rounded-3xl overflow-hidden border-4 border-emerald-500/60 shadow-2xl flex items-center justify-center">
                      <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover scale-x-[-1]"
                      />

                      {/* Futuristic Biometric Frame */}
                      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                          <div className="flex justify-between">
                              <div className="w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_10px_#10b981]"></div>
                              <div className="w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_10px_#10b981]"></div>
                          </div>
                          <div className="flex justify-between">
                              <div className="w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_10px_#10b981]"></div>
                              <div className="w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_10px_#10b981]"></div>
                          </div>
                      </div>

                      {/* Oval Face Tracking Outline */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-dashed border-emerald-400/80 rounded-[50%] pointer-events-none flex items-center justify-center">
                          <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                      </div>

                      <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
                          <span className="bg-black/60 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg">
                              Posisikan Wajah Tegak di Tengah Oval • Pastikan Pencahayaan Ruangan Cukup
                          </span>
                      </div>

                      <button
                          type="button"
                          onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase backdrop-blur-md border border-white/20 transition-all"
                      >
                          Putar Kamera
                      </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                      <button 
                          onClick={stopCamera} 
                          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-all flex items-center gap-2"
                      >
                          <XIcon className="w-4 h-4"/> Batalkan
                      </button>
                      <button 
                          onClick={captureFace} 
                          className="px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-2"
                      >
                          <CameraIcon className="w-5 h-5"/> Rekam & Simpan Biometrik Wajah
                      </button>
                  </div>
              </div>
          </div>
      )}

      <Modal isOpen={isModalOpen} onClose={isProcessing ? () => {} : closeModal} title={editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}>
        <TeacherForm
            key={formInstanceKey}
            isModalOpen={isModalOpen}
            initialData={editingTeacher}
            subjects={subjects}
            onSave={handleSave}
            onCancel={closeModal}
            isProcessing={isProcessing}
        />
      </Modal>

      {/* DETAIL TEACHER MODAL */}
      <Modal isOpen={!!detailTeacher} onClose={() => setDetailTeacher(null)} title="Detail Informasi & Presensi Digital Guru" size="2xl">
          {detailTeacher && (
              <div className="relative -mt-4 animate-slide-up-fade">
                  <div className="bg-slate-200/50 h-24 rounded-t-2xl"></div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full shadow-xl border-4 border-[#e0e5ec] bg-slate-200 flex items-center justify-center overflow-hidden">
                      {detailTeacher.photoUrl ? (
                          <img src={detailTeacher.photoUrl} alt={detailTeacher.name} className="w-full h-full object-cover" />
                      ) : (
                          <UserIcon className="w-20 h-20 text-slate-400" />
                      )}
                  </div>
                  <div className="text-center pt-16 pb-4 px-4">
                       <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{detailTeacher.name}</h3>
                       <p className="text-slate-500 font-semibold mt-0.5">NIP: {detailTeacher.nip || '-'}</p>
                       <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                                ID: G-{detailTeacher.id}
                            </span>
                            {detailTeacher.rfidCode && (
                                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                                    RFID: {detailTeacher.rfidCode}
                                </span>
                            )}
                            {detailTeacher.faceRegistered ? (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                                    <FaceScanIcon className="w-3.5 h-3.5 text-emerald-600"/> Biometrik Wajah Aktif
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                                    <FaceScanIcon className="w-3.5 h-3.5 text-amber-600"/> Belum Daftar Wajah
                                </span>
                            )}
                       </div>
                  </div>

                  <div className="text-sm max-h-[50vh] overflow-y-auto px-6 pb-4 space-y-5 custom-scrollbar">
                      {/* SECTION 1: PRESENSI DIGITAL (QR, FACE, RFID) */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs">
                          <h4 className="font-black text-emerald-800 mb-3 text-xs uppercase tracking-widest flex items-center gap-2 border-b border-emerald-200 pb-1.5">
                              <FaceScanIcon className="w-4 h-4 text-emerald-600" />
                              Integrasi Presensi Digital Guru (Wajah, QR, RFID)
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Verifikasi Biometrik Wajah</span>
                                      {detailTeacher.faceRegistered && (
                                          <button
                                              type="button"
                                              onClick={() => setBiometricModalTeacher(detailTeacher)}
                                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                                          >
                                              Lihat Data Wajah
                                          </button>
                                      )}
                                  </div>
                                  <div className="mt-1 flex items-center justify-between">
                                      <span className={`text-xs font-bold ${detailTeacher.faceRegistered ? 'text-emerald-700' : 'text-amber-600'}`}>
                                          {detailTeacher.faceRegistered ? '✓ Terverifikasi' : 'Belum Ada Data'}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                          <button
                                              type="button"
                                              onClick={() => startCamera(detailTeacher)}
                                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1"
                                          >
                                              <CameraIcon className="w-3 h-3" /> Rekam
                                          </button>
                                          <label className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-300 cursor-pointer">
                                              Unggah
                                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadFacePhoto(detailTeacher, e)} />
                                          </label>
                                          {detailTeacher.faceRegistered && (
                                              <button
                                                  type="button"
                                                  onClick={() => handleDeleteFaceBiometric(detailTeacher)}
                                                  className="p-1 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                                                  title="Hapus Biometrik"
                                              >
                                                  <TrashIcon className="w-3.5 h-3.5" />
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Kartu RFID Terdaftar</span>
                                  <div className="mt-1 flex items-center justify-between">
                                      <span className="text-xs font-mono font-bold text-slate-800">
                                          {detailTeacher.rfidCode || 'Belum Ditetapkan'}
                                      </span>
                                      <button
                                          type="button"
                                          onClick={() => {
                                              const newRfid = prompt('Masukkan UID Kartu RFID Guru:', detailTeacher.rfidCode || '');
                                              if (newRfid !== null) {
                                                  const updated = { ...detailTeacher, rfidCode: newRfid.trim() };
                                                  onEdit(schoolType, updated);
                                                  setDetailTeacher(updated);
                                              }
                                          }}
                                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                                      >
                                          Atur RFID
                                      </button>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-3 min-w-0">
                                  {detailQrDataUrl ? (
                                      <img src={detailQrDataUrl} alt="QR" className="w-12 h-12 object-contain border border-slate-200 rounded-lg p-0.5 flex-shrink-0" />
                                  ) : (
                                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                          <QrCodeIcon className="w-6 h-6 text-slate-400" />
                                      </div>
                                  )}
                                  <div className="min-w-0">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">QR Code Unik Guru</span>
                                      <span className="text-xs font-mono font-bold text-slate-700 truncate block">
                                          {detailTeacher.qrCode || generateUniqueTeacherQr(detailTeacher)}
                                      </span>
                                  </div>
                              </div>
                              <button
                                  type="button"
                                  onClick={() => openQrModal(detailTeacher)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 flex-shrink-0"
                              >
                                  <QrCodeIcon className="w-3.5 h-3.5" />
                                  <span>Buka ID Card</span>
                              </button>
                          </div>
                      </div>

                      <div>
                          <h4 className="font-bold text-slate-700 mb-2 text-base border-b pb-1">Mata Pelajaran Diampu</h4>
                          <p className="text-slate-600 pl-2">{displaySubjects(detailTeacher.subjectsTaught)}</p>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-700 mb-2 text-base border-b pb-1">Rangkuman Jadwal Mengajar</h4>
                          <div className="space-y-3 pl-2">
                              {Object.keys(teacherScheduleSummary).length > 0 ? (
                                  Object.keys(teacherScheduleSummary).map(day => {
                                      const lessons = teacherScheduleSummary[day];
                                      return (
                                        <div key={day}>
                                            <p className="font-semibold text-slate-800">{day}</p>
                                            <ul className="list-disc list-inside text-slate-600 space-y-1 mt-1">
                                                {lessons.map((lesson, index) => (
                                                    <li key={index}>
                                                        <strong>{lesson.time}</strong> - {lesson.subjectName} (Kelas {lesson.className})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                      );
                                  })
                              ) : (
                                  <p className="text-slate-500 italic">Guru ini tidak memiliki jadwal mengajar.</p>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

       {/* Header Panel */}
        <Card className="p-4 sm:p-6 !border-l-[6px] !border-b-[4px] !border-blue-900 !border-t-0 !border-r-0">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Branding Section */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full hover:bg-slate-300/50 lg:hidden">
                        <MenuIcon className="w-6 h-6 text-slate-700" />
                    </button>
                    <div className="p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)]">
                        <TeacherIcon className="w-8 h-8 text-blue-900"/>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Guru Pengajar</h1>
                        <p className="text-slate-500 text-xs sm:text-sm">Manajemen Master Data & Kartu Absensi.</p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex w-full flex-wrap items-center justify-start gap-x-4 gap-y-3 lg:w-auto lg:justify-end lg:flex-nowrap">
                    {/* Action Buttons Group */}
                    <div className="flex gap-2 flex-shrink-0 order-2 lg:order-1">
                        <button
                            type="button"
                            onClick={handleExportToExcel}
                            className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-blue-600 text-white shadow-md hover:bg-blue-700 cursor-pointer flex items-center gap-2 shimmer-active"
                            title="Unduh data guru ke Excel"
                        >
                            <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                            <span className="hidden sm:inline">Unduh</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={openAddModal} 
                            disabled={isProcessing} 
                            className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-[#1e3a8a] text-white shadow-md hover:bg-blue-900 cursor-pointer flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed shimmer-active"
                        >
                            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                            <span className="hidden sm:inline">Tambah Guru</span>
                        </button>
                    </div>
                    
                    {/* Search & Notification Group */}
                    <div className="flex items-center gap-3 order-1 lg:order-2 w-full lg:w-auto">
                        <SearchBar
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            placeholder="Cari Guru (Nama, NIP, RFID, QR)..."
                        />
                        <NotificationBell notifications={notifications} onOpen={onNotificationsOpen} />
                    </div>
                </div>
            </div>
        </Card>

        {filteredTeachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {visibleTeachers.map((teacher) => (
              <Card 
                key={teacher.id} 
                className="p-4 text-center flex flex-col items-center justify-between relative overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* ICON BIOMETRIK WAJAH POJOK KIRI ATAS (ICON ONLY) */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (teacher.faceRegistered) {
                            setBiometricModalTeacher(teacher);
                        } else {
                            startCamera(teacher);
                        }
                    }}
                    className={`absolute top-3 left-3 z-10 p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer shadow-xs ${
                        teacher.faceRegistered 
                            ? 'bg-blue-900 hover:bg-blue-950 text-white shadow-blue-900/30 ring-1 ring-white/60 hover:scale-110' 
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 hover:scale-110'
                    }`}
                    title={teacher.faceRegistered ? "Lihat Data Biometrik Wajah Terdaftar" : "Daftarkan Biometrik Wajah"}
                >
                    <FaceScanIcon className="w-4 h-4" />
                </button>

                <div onClick={() => setDetailTeacher(teacher)} className="cursor-pointer w-full flex flex-col items-center pt-2">
                    {/* AVATAR FOTO PROFIL UTAMA (KHUSUS FOTO PROFIL UTAMA, TIDAK TERGANGGU BIOMETRIK) */}
                    <div className="relative mt-1">
                        <div className="w-24 h-24 rounded-full bg-[#e0e5ec] shadow-[inset_3px_3px_7px_#d1d9e6,inset_-3px_-3px_7px_rgba(255,255,255,0.5)] flex items-center justify-center overflow-hidden border-2 border-white">
                            {teacher.photoUrl ? (
                                <img src={teacher.photoUrl} alt={teacher.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-16 h-16 text-slate-400" />
                            )}
                        </div>
                        {teacher.faceRegistered && (
                            <span 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setBiometricModalTeacher(teacher);
                                }}
                                className="absolute bottom-0 right-0 p-1 bg-blue-900 text-white rounded-full shadow-md border-2 border-white hover:bg-blue-950 cursor-pointer" 
                                title="Biometrik Wajah Terverifikasi (Klik untuk lihat)"
                            >
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                            </span>
                        )}
                    </div>

                    <div className="text-center w-full mt-2">
                      <p className="font-semibold text-slate-800 truncate" title={teacher.name}>{teacher.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">NIP: {teacher.nip || '-'}</p>

                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          G-{teacher.id}
                        </span>
                        {teacher.rfidCode && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-mono" title={`RFID: ${teacher.rfidCode}`}>
                            RFID
                          </span>
                        )}
                        {teacher.qrCode && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono" title={`QR: ${teacher.qrCode}`}>
                            QR
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-blue-900 mt-1.5 px-1 truncate" title={displaySubjects(teacher.subjectsTaught)}>
                        {displaySubjects(teacher.subjectsTaught)}
                      </p>
                    </div>
                </div>

                {/* BOTTOM ACTION BUTTONS ROW (BERSIH & TIDAK MENUMPUK) */}
                <div className="flex justify-center gap-2 mt-4 w-full border-t border-slate-200 pt-3">
                    {/* QR Code & Digital ID Card button */}
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); openQrModal(teacher); }} 
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors" 
                        title="Buka QR Code & ID Card Guru"
                    >
                        <QrCodeIcon className="w-4 h-4" />
                    </button>

                    {/* Link Share button */}
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setLinkModalTeacher(teacher); }} 
                        className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors" 
                        title="Bagikan Tautan Akses Portal Guru"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>

                    {/* Edit button */}
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); openEditModal(teacher); }} 
                        disabled={isProcessing} 
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
                        title="Edit Data Guru"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(teacher.id); }} 
                        disabled={isProcessing} 
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed"
                        title="Hapus Data Guru"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
              </Card>
            ))}
             {filteredTeachers.length > 10 && (
                <div className="mt-6 text-center col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="py-2 px-4 rounded-full text-xs font-semibold transition-all duration-300 bg-slate-200/70 text-slate-600 hover:bg-slate-300/70 flex items-center gap-1.5 mx-auto"
                    >
                        {isExpanded ? 'Tampilkan Lebih Ringkas' : `Tampilkan Semua (${filteredTeachers.length})`}
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                </div>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center text-slate-500">
            <p>Tidak ada guru yang cocok dengan "{searchQuery}".</p>
          </Card>
        )}
    </div>
  );
};