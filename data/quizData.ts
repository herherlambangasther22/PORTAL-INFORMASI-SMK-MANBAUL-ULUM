import React from 'react';
import { getBankSoalKelasXQuestions } from './bankSoalKelasX';

export interface QuizQuestion {
  id: string;
  topicId: string; // e.g. 'x-1', 'xi-6', 'xii-1'
  classLevel: 'Kelas X' | 'Kelas XI' | 'Kelas XII';
  questionNumber: number;
  type: 'essay' | 'multiple_choice' | 'diagram_analysis';
  question: string;
  diagramSvg?: string; // SVG inline string or illustration type
  diagramCaption?: string;
  options?: string[]; // For multiple choice
  correctOptionIndex?: number;
  keywords: string[]; // Essential keywords required in essay response for automatic scoring
  modelAnswer: string; // Explanation / ideal answer for reference
  points: number; // e.g., 10 points
}

export interface QuizTopicInfo {
  id: string;
  title: string;
  level: 'Kelas X' | 'Kelas XI' | 'Kelas XII';
}

export const ACTIVE_TOPICS_STORAGE_KEY = 'learning_portal_active_quiz_topics_v1';

export const ALL_QUIZ_TOPICS: QuizTopicInfo[] = [
  // KELAS X (15 TOPIK)
  { id: 'x-1', title: '1. Komputer & Hardware', level: 'Kelas X' },
  { id: 'x-2', title: '2. Software & Sistem Operasi', level: 'Kelas X' },
  { id: 'x-3', title: '3. Instalasi OS', level: 'Kelas X' },
  { id: 'x-4', title: '4. Aplikasi Perkantoran', level: 'Kelas X' },
  { id: 'x-5', title: '5. Dasar Jaringan', level: 'Kelas X' },
  { id: 'x-6', title: '6. IP Address & Subnetting', level: 'Kelas X' },
  { id: 'x-7', title: '7. Kabel UTP & RJ-45', level: 'Kelas X' },
  { id: 'x-8', title: '8. Topologi Jaringan', level: 'Kelas X' },
  { id: 'x-9', title: '9. Konfigurasi Jaringan', level: 'Kelas X' },
  { id: 'x-10', title: '10. Tools Jaringan', level: 'Kelas X' },
  { id: 'x-11', title: '11. Perakitan Komputer', level: 'Kelas X' },
  { id: 'x-12', title: '12. Troubleshooting', level: 'Kelas X' },
  { id: 'x-13', title: '13. K3', level: 'Kelas X' },
  { id: 'x-14', title: '14. Etika & Keamanan Digital', level: 'Kelas X' },
  { id: 'x-15', title: '15. Virtualisasi & Proyek Jaringan', level: 'Kelas X' },

  // KELAS XI (15 TOPIK)
  { id: 'xi-1', title: '1. Subnetting Lanjutan', level: 'Kelas XI' },
  { id: 'xi-2', title: '2. CIDR (Classless Routing)', level: 'Kelas XI' },
  { id: 'xi-3', title: '3. VLSM (Variable Length Subnetting)', level: 'Kelas XI' },
  { id: 'xi-4', title: '4. Routing dan Switching Dasar', level: 'Kelas XI' },
  { id: 'xi-5', title: '5. VLAN dan Trunking (802.1Q)', level: 'Kelas XI' },
  { id: 'xi-6', title: '6. MikroTik RouterOS & Winbox', level: 'Kelas XI' },
  { id: 'xi-7', title: '7. Konfigurasi Dasar MikroTik', level: 'Kelas XI' },
  { id: 'xi-8', title: '8. Konfigurasi Routing MikroTik', level: 'Kelas XI' },
  { id: 'xi-9', title: '9. DHCP, DNS, NAT & Firewall MikroTik', level: 'Kelas XI' },
  { id: 'xi-10', title: '10. Bandwidth Management & QoS', level: 'Kelas XI' },
  { id: 'xi-11', title: '11. Wireless & Hotspot MikroTik', level: 'Kelas XI' },
  { id: 'xi-12', title: '12. Virtualisasi Server (VirtualBox)', level: 'Kelas XI' },
  { id: 'xi-13', title: '13. Debian Linux & Server CLI', level: 'Kelas XI' },
  { id: 'xi-14', title: '14. Layanan Server Debian (DNS/Web)', level: 'Kelas XI' },
  { id: 'xi-15', title: '15. Proyek MikroTik & Debian Server', level: 'Kelas XI' },

  // KELAS XII (15 TOPIK)
  { id: 'xii-1', title: '1. Cisco Networking & Cisco IOS', level: 'Kelas XII' },
  { id: 'xii-2', title: '2. Konfigurasi Dasar Cisco Router', level: 'Kelas XII' },
  { id: 'xii-3', title: '3. Konfigurasi Dasar Cisco Switch', level: 'Kelas XII' },
  { id: 'xii-4', title: '4. VLAN & Inter-VLAN Cisco', level: 'Kelas XII' },
  { id: 'xii-5', title: '5. Routing Cisco & Administrative Distance', level: 'Kelas XII' },
  { id: 'xii-6', title: '6. Routing Dinamis Cisco (OSPFv2)', level: 'Kelas XII' },
  { id: 'xii-7', title: '7. Infrastruktur Cisco Enterprise', level: 'Kelas XII' },
  { id: 'xii-8', title: '8. Administrasi Debian Lanjutan', level: 'Kelas XII' },
  { id: 'xii-9', title: '9. Web, DNS & DHCP Server Enterprise', level: 'Kelas XII' },
  { id: 'xii-10', title: '10. Samba, Database & Remote Server', level: 'Kelas XII' },
  { id: 'xii-11', title: '11. Firewall, Hardening & Backup Server', level: 'Kelas XII' },
  { id: 'xii-12', title: '12. Network Monitoring (Zabbix/Wireshark)', level: 'Kelas XII' },
  { id: 'xii-13', title: '13. Internet of Things (IoT) ESP32', level: 'Kelas XII' },
  { id: 'xii-14', title: '14. IoT MQTT Protocol & Dashboard', level: 'Kelas XII' },
  { id: 'xii-15', title: '15. Capstone Project Network & IoT', level: 'Kelas XII' },
];

export const getActiveTopicIds = (): string[] => {
  try {
    const raw = localStorage.getItem(ACTIVE_TOPICS_STORAGE_KEY);
    if (!raw) {
      // Default: ALL topics active on first load
      return ALL_QUIZ_TOPICS.map(t => t.id);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load active topics from storage:', e);
  }
  return ALL_QUIZ_TOPICS.map(t => t.id);
};

export const saveActiveTopicIds = (activeIds: string[]): void => {
  try {
    localStorage.setItem(ACTIVE_TOPICS_STORAGE_KEY, JSON.stringify(activeIds));
    // Dispatch custom window event so other tabs or components can re-sync dynamically
    window.dispatchEvent(new CustomEvent('quiz_active_topics_updated', { detail: activeIds }));
  } catch (e) {
    console.error('Failed to save active topics to storage:', e);
  }
};

export const isTopicActive = (topicId: string): boolean => {
  const activeIds = getActiveTopicIds();
  return activeIds.includes(topicId);
};

export interface QuestionResultItem {
  questionId: string;
  questionText?: string;
  questionType?: 'essay' | 'multiple_choice' | 'diagram_analysis';
  diagramSvg?: string;
  options?: string[];
  correctOptionIndex?: number;
  keywords?: string[];
  modelAnswer?: string;
  studentAnswer: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints?: number;
  feedback?: string;
  adminFeedback?: string;
}

export interface QuizResultRecord {
  id: string;
  timestamp: number;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentNis?: string;
  topicId: string;
  topicTitle: string;
  classLevel: 'Kelas X' | 'Kelas XI' | 'Kelas XII';
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  scorePercentage: number;
  pointsEarned: number;
  maxPossiblePoints?: number;
  timeSpentSeconds: number;
  isGradedByAdmin?: boolean;
  adminGradedAt?: number;
  adminNotes?: string;
  answers: QuizAnswerRecord[];
}

// =========================================================================
// SVG DIAGRAM ILLUSTRATIONS FOR QUIZZES
// =========================================================================

export const DIAGRAM_SVG = {
  // 1. OSI Layer Stack Diagram
  osiLayerStack: `
    <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-h-64 rounded-xl shadow-md bg-slate-900 p-2">
      <rect x="10" y="10" width="580" height="38" rx="6" fill="#3b82f6"/>
      <text x="300" y="34" fill="#ffffff" font-weight="bold" font-size="14" text-anchor="middle">7. Application Layer (HTTP, DNS, SSH, FTP)</text>
      <rect x="10" y="52" width="580" height="38" rx="6" fill="#2563eb"/>
      <text x="300" y="76" fill="#ffffff" font-weight="bold" font-size="14" text-anchor="middle">6. Presentation Layer (SSL/TLS, JPEG, ASCII)</text>
      <rect x="10" y="94" width="580" height="38" rx="6" fill="#1d4ed8"/>
      <text x="300" y="118" fill="#ffffff" font-weight="bold" font-size="14" text-anchor="middle">5. Session Layer (NetBIOS, PPTP, Sockets)</text>
      <rect x="10" y="136" width="580" height="38" rx="6" fill="#0284c7"/>
      <text x="300" y="160" fill="#ffffff" font-weight="bold" font-size="14" text-anchor="middle">4. Transport Layer (TCP, UDP, Segment, Port)</text>
      <rect x="10" y="178" width="580" height="38" rx="6" fill="#0d9488"/>
      <text x="300" y="202" fill="#ffffff" font-weight="bold" font-size="14" text-anchor="middle">3. Network Layer (IP Address, Router, Packet, OSPF)</text>
      <rect x="10" y="220" width="580" height="38" rx="6" fill="#16a34a"/>
      <text x="300" y="244" fill="#ffffff" font-weight="bold" font-size="14" text-anchor="middle">2. Data Link Layer (MAC Address, Switch, Frame, VLAN)</text>
      <rect x="10" y="262" width="580" height="38" rx="6" fill="#ca8a04"/>
      <text x="300" y="286" fill="#ffffff" font-weight="bold" font-size="14" text-anchor="middle">1. Physical Layer (Kabel UTP, Fiber Optic, Hub, Bit)</text>
    </svg>
  `,

  // 2. RJ45 Cable Pinout Diagram (T568B vs T568A)
  rj45Pinout: `
    <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-h-64 rounded-xl shadow-md bg-slate-800 p-3">
      <text x="300" y="25" fill="#f8fafc" font-weight="bold" font-size="16" text-anchor="middle">URUTAN KABEL UTP STANDAR T568B (STRAIGHT)</text>
      <!-- Pin 1 to 8 -->
      <g transform="translate(40, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#ea580c" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 1</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Putih-Oranye</text>
      </g>
      <g transform="translate(105, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#c2410c" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 2</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Oranye</text>
      </g>
      <g transform="translate(170, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#16a34a" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 3</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Putih-Hijau</text>
      </g>
      <g transform="translate(235, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 4</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Biru</text>
      </g>
      <g transform="translate(300, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 5</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Putih-Biru</text>
      </g>
      <g transform="translate(365, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#15803d" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 6</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Hijau</text>
      </g>
      <g transform="translate(430, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#78350f" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 7</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Putih-Cokelat</text>
      </g>
      <g transform="translate(495, 50)">
        <rect x="0" y="0" width="55" height="180" rx="6" fill="#451a03" stroke="#ffffff" stroke-width="2"/>
        <text x="27" y="-10" fill="#f8fafc" font-size="12" font-weight="bold" text-anchor="middle">Pin 8</text>
        <text x="27" y="90" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle" transform="rotate(-90 27 90)">Cokelat</text>
      </g>
      <text x="300" y="275" fill="#f1f5f9" font-size="12" text-anchor="middle">Kombinasi Pin TX (1,2) & RX (3,6) pada Fast Ethernet 100Mbps</text>
    </svg>
  `,

  // 3. Subnetting Breakdown Chart
  subnettingChart: `
    <svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-h-64 rounded-xl shadow-md bg-slate-900 p-3">
      <text x="300" y="30" fill="#38bdf8" font-weight="bold" font-size="16" text-anchor="middle">ANALISIS IP ADDRESS IPv4 & SUBNET MASK /26</text>
      <rect x="30" y="50" width="540" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="300" y="75" fill="#f8fafc" font-family="monospace" font-weight="bold" font-size="15" text-anchor="middle">IP: 192.168.10.75 /26 (Netmask: 255.255.255.192)</text>
      
      <g transform="translate(30, 110)">
        <rect x="0" y="0" width="120" height="60" rx="6" fill="#0f766e"/>
        <text x="60" y="25" fill="#a7f3d0" font-size="11" font-weight="bold" text-anchor="middle">NETWORK ID</text>
        <text x="60" y="45" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">192.168.10.64</text>
      </g>

      <g transform="translate(170, 110)">
        <rect x="0" y="0" width="120" height="60" rx="6" fill="#0369a1"/>
        <text x="60" y="25" fill="#bae6fd" font-size="11" font-weight="bold" text-anchor="middle">FIRST HOST</text>
        <text x="60" y="45" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">192.168.10.65</text>
      </g>

      <g transform="translate(310, 110)">
        <rect x="0" y="0" width="120" height="60" rx="6" fill="#1d4ed8"/>
        <text x="60" y="25" fill="#bfdbfe" font-size="11" font-weight="bold" text-anchor="middle">LAST HOST</text>
        <text x="60" y="45" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">192.168.10.126</text>
      </g>

      <g transform="translate(450, 110)">
        <rect x="0" y="0" width="120" height="60" rx="6" fill="#b91c1c"/>
        <text x="60" y="25" fill="#fecaca" font-size="11" font-weight="bold" text-anchor="middle">BROADCAST</text>
        <text x="60" y="45" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">192.168.10.127</text>
      </g>

      <rect x="30" y="190" width="540" height="60" rx="8" fill="#0f172a" stroke="#475569"/>
      <text x="300" y="215" fill="#e2e8f0" font-size="13" text-anchor="middle">Jumlah Host Terpakai: 62 Host Valid | Jumlah Subnet Total: 4 Subnet</text>
      <text x="300" y="235" fill="#94a3b8" font-size="11" text-anchor="middle">Rumus: 2^(32-26) - 2 = 64 - 2 = 62 Usable IPs</text>
    </svg>
  `,

  // 4. MikroTik RouterOS Architecture Topology
  mikrotikTopology: `
    <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-h-64 rounded-xl shadow-md bg-slate-900 p-3">
      <text x="300" y="25" fill="#38bdf8" font-weight="bold" font-size="15" text-anchor="middle">TOPOLOGI ROUTER MIKROTIK - LAN, VLAN & HOTSPOT SERVER</text>
      
      <!-- ISP Cloud -->
      <ellipse cx="300" cy="65" rx="50" ry="25" fill="#0284c7"/>
      <text x="300" y="70" fill="#ffffff" font-weight="bold" font-size="12" text-anchor="middle">INTERNET / ISP</text>
      
      <line x1="300" y1="90" x2="300" y2="130" stroke="#0ea5e9" stroke-width="3"/>
      <text x="315" y="115" fill="#38bdf8" font-size="10" font-weight="bold">ether1 (DHCP Client)</text>

      <!-- MikroTik Router -->
      <rect x="200" y="130" width="200" height="60" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
      <text x="300" y="155" fill="#ffffff" font-weight="bold" font-size="13" text-anchor="middle">MIKROTIK ROUTERBOARD</text>
      <text x="300" y="175" fill="#94a3b8" font-size="10" text-anchor="middle">NAT Masquerade + DNS + Firewall Filter</text>

      <!-- Lines to Switch & AP -->
      <line x1="240" y1="190" x2="140" y2="240" stroke="#22c55e" stroke-width="3"/>
      <line x1="360" y1="190" x2="460" y2="240" stroke="#eab308" stroke-width="3"/>

      <!-- Switch LAN -->
      <rect x="70" y="240" width="140" height="50" rx="8" fill="#15803d"/>
      <text x="140" y="262" fill="#ffffff" font-weight="bold" font-size="11" text-anchor="middle">SWITCH UNMANAGED</text>
      <text x="140" y="278" fill="#dcfce7" font-size="9" text-anchor="middle">ether2 (LAN 192.168.10.1/24)</text>

      <!-- Wireless AP Hotspot -->
      <rect x="390" y="240" width="140" height="50" rx="8" fill="#ca8a04"/>
      <text x="460" y="262" fill="#ffffff" font-weight="bold" font-size="11" text-anchor="middle">ACCESS POINT HOTSPOT</text>
      <text x="460" y="278" fill="#fef9c3" font-size="9" text-anchor="middle">wlan1 / Captive Portal</text>
    </svg>
  `,

  // 5. Cisco Enterprise Network Topology
  ciscoEnterpriseTopology: `
    <svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-h-64 rounded-xl shadow-md bg-slate-900 p-3">
      <text x="300" y="25" fill="#f43f5e" font-weight="bold" font-size="15" text-anchor="middle">INFRASTRUKTUR CISCO - ROUTER-ON-A-STICK & INTER-VLAN</text>
      
      <!-- Cisco Router -->
      <circle cx="300" cy="70" r="30" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
      <text x="300" y="74" fill="#ffffff" font-weight="bold" font-size="12" text-anchor="middle">R1 CISCO</text>
      <text x="300" y="115" fill="#38bdf8" font-size="10" font-weight="bold" text-anchor="middle">g0/0.10 (VLAN 10) | g0/0.20 (VLAN 20)</text>

      <!-- Trunk Line -->
      <line x1="300" y1="100" x2="300" y2="160" stroke="#f43f5e" stroke-width="4"/>
      <text x="315" y="140" fill="#fb7185" font-size="10" font-weight="bold">Trunk (802.1Q)</text>

      <!-- Core Switch -->
      <rect x="220" y="160" width="160" height="45" rx="8" fill="#334155" stroke="#f43f5e" stroke-width="2"/>
      <text x="300" y="187" fill="#ffffff" font-weight="bold" font-size="12" text-anchor="middle">SW-CORE (2960)</text>

      <!-- Downlinks -->
      <line x1="250" y1="205" x2="150" y2="250" stroke="#06b6d4" stroke-width="3"/>
      <line x1="350" y1="205" x2="450" y2="250" stroke="#a855f7" stroke-width="3"/>

      <!-- VLAN 10 -->
      <rect x="80" y="250" width="140" height="45" rx="8" fill="#0e7490"/>
      <text x="150" y="270" fill="#ffffff" font-weight="bold" font-size="11" text-anchor="middle">VLAN 10: GURU</text>
      <text x="150" y="285" fill="#cff4fc" font-size="9" text-anchor="middle">Subnet: 172.16.10.0/24</text>

      <!-- VLAN 20 -->
      <rect x="380" y="250" width="140" height="45" rx="8" fill="#7e22ce"/>
      <text x="450" y="270" fill="#ffffff" font-weight="bold" font-size="11" text-anchor="middle">VLAN 20: SISWA</text>
      <text x="450" y="285" fill="#f3e8ff" font-size="9" text-anchor="middle">Subnet: 172.16.20.0/24</text>
    </svg>
  `,

  // 6. IoT ESP32 & MQTT Architecture Diagram
  iotMqttArchitecture: `
    <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto max-h-64 rounded-xl shadow-md bg-slate-900 p-3">
      <text x="300" y="25" fill="#10b981" font-weight="bold" font-size="15" text-anchor="middle">ARSITEKTUR KOMUNIKASI IoT - PROTOKOL MQTT (PUBLISH/SUBSCRIBE)</text>
      
      <!-- ESP32 Publisher -->
      <g transform="translate(30, 80)">
        <rect x="0" y="0" width="130" height="130" rx="10" fill="#065f46" stroke="#10b981" stroke-width="2"/>
        <text x="65" y="30" fill="#ffffff" font-weight="bold" font-size="12" text-anchor="middle">ESP32 + DHT11</text>
        <text x="65" y="55" fill="#a7f3d0" font-size="10" text-anchor="middle">Publisher</text>
        <rect x="20" y="75" width="90" height="35" rx="4" fill="#047857"/>
        <text x="65" y="97" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle">Topic: /suhu/lab</text>
      </g>

      <!-- Publish Arrow -->
      <line x1="160" y1="145" x2="230" y2="145" stroke="#10b981" stroke-width="3" stroke-dasharray="5,5"/>
      <polygon points="230,140 240,145 230,150" fill="#10b981"/>
      <text x="195" y="135" fill="#34d399" font-size="10" font-weight="bold" text-anchor="middle">Publish Data</text>

      <!-- MQTT Broker -->
      <g transform="translate(240, 80)">
        <rect x="0" y="0" width="130" height="130" rx="10" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
        <text x="65" y="30" fill="#38bdf8" font-weight="bold" font-size="13" text-anchor="middle">MQTT BROKER</text>
        <text x="65" y="50" fill="#94a3b8" font-size="10" text-anchor="middle">(Mosquitto Port 1883)</text>
        <rect x="15" y="70" width="100" height="45" rx="6" fill="#0f172a"/>
        <text x="65" y="90" fill="#f8fafc" font-size="9" text-anchor="middle">Filter Topic &</text>
        <text x="65" y="104" fill="#f8fafc" font-size="9" text-anchor="middle">Distribusi Pesan</text>
      </g>

      <!-- Subscribe Arrow -->
      <line x1="370" y1="145" x2="440" y2="145" stroke="#38bdf8" stroke-width="3" stroke-dasharray="5,5"/>
      <polygon points="440,140 450,145 440,150" fill="#38bdf8"/>
      <text x="405" y="135" fill="#38bdf8" font-size="10" font-weight="bold" text-anchor="middle">Subscribe</text>

      <!-- Subscriber Dashboard -->
      <g transform="translate(450, 80)">
        <rect x="0" y="0" width="120" height="130" rx="10" fill="#6b21a8" stroke="#c084fc" stroke-width="2"/>
        <text x="60" y="30" fill="#ffffff" font-weight="bold" font-size="11" text-anchor="middle">DASHBOARD</text>
        <text x="60" y="50" fill="#e9d5ff" font-size="10" text-anchor="middle">Node-RED / Grafana</text>
        <text x="60" y="90" fill="#ffffff" font-size="18" font-weight="bold" text-anchor="middle">31.5 °C</text>
      </g>

      <text x="300" y="270" fill="#cbd5e1" font-size="11" text-anchor="middle">Protokol MQTT sangat ringan (lightweight) dan efisien untuk komunikasi M2M IoT.</text>
    </svg>
  `
};

// =========================================================================
// QUESTION BANK GENERATOR (COMPREHENSIVE FOR ALL 45 TOPICS)
// =========================================================================

export const generateQuizQuestionBank = (): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];

  // Helper function to push questions
  const addQ = (q: Omit<QuizQuestion, 'id'>) => {
    questions.push({
      ...q,
      id: `q-${q.topicId}-${q.questionNumber}`
    });
  };

  // -----------------------------------------------------------------------
  // 🟦 KELAS X - 25 TOPICS (FULL BANK SOAL MULTIPLE CHOICE)
  // -----------------------------------------------------------------------
  const bankX = getBankSoalKelasXQuestions();
  questions.push(...bankX);

  // -----------------------------------------------------------------------
  // 🟨 KELAS XI - 15 TOPICS (150 QUESTIONS TOTAL)
  // -----------------------------------------------------------------------

  // Topic XI-6: MikroTik RouterOS
  for (let i = 1; i <= 10; i++) {
    if (i === 1) {
      addQ({
        topicId: 'xi-6',
        classLevel: 'Kelas XI',
        questionNumber: i,
        type: 'diagram_analysis',
        question: 'Perhatikan diagram topologi jaringan MikroTik berikut! Sebutkan fungsi utama NAT Masquerade pada interface ether1 yang terhubung ke ISP!',
        diagramSvg: DIAGRAM_SVG.mikrotikTopology,
        diagramCaption: 'Topologi Jaringan MikroTik RouterBoard',
        keywords: ['nat', 'masquerade', 'ip private', 'ip public', 'internet'],
        modelAnswer: 'NAT Masquerade berfungsi memetakan/menerjemahkan banyak IP Private dari jaringan lokal (LAN) menjadi satu IP Public pada ether1 sehingga seluruh client dapat mengakses Internet.',
        points: 10
      });
    } else {
      addQ({
        topicId: 'xi-6',
        classLevel: 'Kelas XI',
        questionNumber: i,
        type: 'essay',
        question: `Soal MikroTik RouterOS XI (#${i}): Apa perbedaan utama antara aplikasi Winbox dan WebFig saat mengelola MikroTik RouterOS?`,
        keywords: ['winbox', 'webfig', 'gui', 'browser', 'mac address'],
        modelAnswer: 'Winbox adalah aplikasi desktop Win32 yang dapat meremote MikroTik via IP maupun MAC Address, sedangkan WebFig adalah antarmuka manajemen berbasis Web Browser yang memerlukan koneksi IP Address.',
        points: 10
      });
    }
  }

  // Generate XI topics 1-15
  for (let t = 1; t <= 15; t++) {
    if (t === 6) continue; // Skip already added
    const topicId = `xi-${t}`;
    for (let i = 1; i <= 10; i++) {
      if (i === 1 && (t === 1 || t === 3 || t === 7 || t === 9 || t === 13)) {
        addQ({
          topicId,
          classLevel: 'Kelas XI',
          questionNumber: i,
          type: 'diagram_analysis',
          question: t === 3 ? 'Perhatikan alokasi subnetting /26 berikut! Hitung jumlah host valid yang dapat digunakan untuk tiap subnet!' : 'Perhatikan diagram topologi Router MikroTik berikut! Jelaskan bagaimana lalu lintas dari client LAN dibatasi oleh Simple Queue!',
          diagramSvg: t === 3 ? DIAGRAM_SVG.subnettingChart : DIAGRAM_SVG.mikrotikTopology,
          diagramCaption: t === 3 ? 'Bagan Subnetting VLSM' : 'Topologi MikroTik Router',
          keywords: t === 3 ? ['62 host', 'usable ip', '2^6 - 2'] : ['simple queue', 'bandwidth', 'limit-at', 'max-limit', 'target'],
          modelAnswer: t === 3 ? 'Jumlah host valid per subnet /26 adalah 2^(32-26) - 2 = 64 - 2 = 62 Usable IP.' : 'Simple Queue membatasi kecepatan upload dan download berdasarkan IP Target dengan aturan Max-Limit dan Limit-At.',
          points: 10
        });
      } else {
        addQ({
          topicId,
          classLevel: 'Kelas XI',
          questionNumber: i,
          type: i % 2 === 0 ? 'essay' : 'multiple_choice',
          question: i % 2 === 0
            ? `Pertanyaan Esai Topik ${t} Kelas XI (#${i}): Jelaskan prosedur troubleshooting jika layanan server Debian atau MikroTik tidak merespon saat di-ping dari client!`
            : `Pilihan Ganda Topik ${t} Kelas XI (#${i}): Manakah perintah atau langkah konfigurasi yang paling tepat untuk memverifikasi status koneksi?`,
          options: i % 2 !== 0 ? ['Menjalankan perintah ping & traceroute', 'Mematikan paksa router', 'Menghapus seluruh IP Address', 'Mengganti kabel tanpa pengecekan'] : undefined,
          correctOptionIndex: i % 2 !== 0 ? 0 : undefined,
          keywords: ['ping', 'ip address', 'gateway', 'firewall', 'troubleshooting'],
          modelAnswer: 'Langkah troubleshooting meliputi: cek koneksi fisik kabel/link state, verifikasi IP Address & Netmask client, uji ping ke Gateway, dan pastikan aturan Firewall tidak memblokir paket ICMP.',
          points: 10
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // 🟥 KELAS XII - 15 TOPICS (150 QUESTIONS TOTAL)
  // -----------------------------------------------------------------------

  // Topic XII-1: Cisco Networking
  for (let i = 1; i <= 10; i++) {
    if (i === 1) {
      addQ({
        topicId: 'xii-1',
        classLevel: 'Kelas XII',
        questionNumber: i,
        type: 'diagram_analysis',
        question: 'Perhatikan diagram arsitektur Cisco Inter-VLAN Router-on-a-Stick berikut! Jelaskan fungsi enkapsulasi dot1Q pada subinterface router Cisco!',
        diagramSvg: DIAGRAM_SVG.ciscoEnterpriseTopology,
        diagramCaption: 'Infrastruktur Cisco Router-on-a-Stick Inter-VLAN',
        keywords: ['dot1q', 'encapsulation', 'vlan', 'trunk', 'subinterface', 'router-on-a-stick'],
        modelAnswer: 'Enkapsulasi IEEE 802.1Q (dot1Q) pada subinterface router Cisco bertugas menambahkan atau membaca tag VLAN ID pada header frame Ethernet sehingga router dapat memisahkan dan merutekan data antar-VLAN yang berbeda melalui satu kabel trunk fisik.',
        points: 10
      });
    } else {
      addQ({
        topicId: 'xii-1',
        classLevel: 'Kelas XII',
        questionNumber: i,
        type: 'essay',
        question: `Soal Cisco Networking XII (#${i}): Sebutkan 3 mode hirarki CLI pada Cisco IOS dan tuliskan perintah untuk berpindah dari User EXEC mode ke Global Configuration mode!`,
        keywords: ['user exec', 'privileged exec', 'global configuration', 'enable', 'configure terminal'],
        modelAnswer: '3 Mode CLI Cisco IOS: User EXEC (Router>), Privileged EXEC (Router#), dan Global Configuration (Router(config)#). Perintah pindahnya: ketik "enable" lalu ketik "configure terminal".',
        points: 10
      });
    }
  }

  // Topic XII-14: IoT MQTT & Dashboard
  for (let i = 1; i <= 10; i++) {
    if (i === 1) {
      addQ({
        topicId: 'xii-14',
        classLevel: 'Kelas XII',
        questionNumber: i,
        type: 'diagram_analysis',
        question: 'Perhatikan diagram arsitektur protokol MQTT IoT berikut! Jelaskan peran MQTT Broker (Mosquitto) dalam menghubungkan ESP32 Publisher dengan Dashboard Subscriber!',
        diagramSvg: DIAGRAM_SVG.iotMqttArchitecture,
        diagramCaption: 'Arsitektur Komunikasi IoT via MQTT Protocol',
        keywords: ['broker', 'mosquitto', 'publisher', 'subscriber', 'topic', 'publish'],
        modelAnswer: 'MQTT Broker (seperti Mosquitto) berfungsi sebagai server pusat penerima pesan dari Publisher (ESP32) berdasarkan Topic tertentu, kemudian meneruskan pesan tersebut secara efisien ke semua Subscriber (Dashboard Node-RED/Grafana) yang berlangganan topic tersebut.',
        points: 10
      });
    } else {
      addQ({
        topicId: 'xii-14',
        classLevel: 'Kelas XII',
        questionNumber: i,
        type: 'essay',
        question: `Soal IoT & MQTT XII (#${i}): Mengapa protokol MQTT lebih disukai untuk komunikasi mikrokontroler IoT dibanding protokol HTTP REST API biasa?`,
        keywords: ['lightweight', 'header kecil', 'bandwidth', 'publish-subscribe', 'realtime'],
        modelAnswer: 'MQTT bersifat sangat ringan (lightweight) dengan ukuran header yang sangat kecil (2 byte), konsumsi daya rendah, serta model Publish/Subscribe yang memungkinkan transmisi data sensor secara real-time dengan latensi rendah.',
        points: 10
      });
    }
  }

  // Generate XII topics 2-13 and 15
  for (let t = 2; t <= 15; t++) {
    if (t === 14) continue; // Skip topic 14
    const topicId = `xii-${t}`;
    for (let i = 1; i <= 10; i++) {
      if (i === 1 && (t === 4 || t === 6 || t === 7 || t === 12 || t === 13 || t === 15)) {
        addQ({
          topicId,
          classLevel: 'Kelas XII',
          questionNumber: i,
          type: 'diagram_analysis',
          question: t === 6 ? 'Perhatikan topologi Cisco berikut. Jelaskan bagaimana protokol OSPFv2 membentuk Neighbor Adjacency antar Router Cisco!' : 'Perhatikan diagram berikut. Jelaskan arsitektur integrasi sistem dalam Capstone Project TJKT Kelas XII!',
          diagramSvg: t === 6 ? DIAGRAM_SVG.ciscoEnterpriseTopology : DIAGRAM_SVG.iotMqttArchitecture,
          diagramCaption: t === 6 ? 'Topologi OSPF Cisco' : 'Diagram Capstone Project TJKT',
          keywords: t === 6 ? ['ospf', 'neighbor', 'hello packet', 'area 0', 'wildcard'] : ['cisco', 'mikrotik', 'debian', 'zabbix', 'iot', 'mqtt'],
          modelAnswer: t === 6 ? 'OSPF membentuk tetangga (Neighbor Adjacency) dengan saling menukar Hello Packet melalui multicast IP 224.0.0.5 pada Area yang sama dan Hello/Dead timer yang cocok.' : 'Capstone Project mengintegrasikan Infrastruktur Jaringan Cisco/MikroTik, Server Linux Debian, Network Monitoring Zabbix, serta Telemetri IoT ke dalam satu ekosistem enterprise terpadu.',
          points: 10
        });
      } else {
        addQ({
          topicId,
          classLevel: 'Kelas XII',
          questionNumber: i,
          type: i % 2 === 0 ? 'essay' : 'multiple_choice',
          question: i % 2 === 0
            ? `Soal Tantangan Esai Topik ${t} Kelas XII (#${i}): Analisis skenario di mana server mengalami lonjakan traffic dan jelaskan solusi hardening serta backup data yang tepat!`
            : `Pilihan Ganda Topik ${t} Kelas XII (#${i}): Apakah langkah pengamanan terbaik untuk mencegah serangan brute force pada port SSH Debian Server?`,
          options: i % 2 !== 0 ? ['Mengubah port default 22, memasang Fail2ban, & login via SSH Key', 'Membuka seluruh port tanpa firewall', 'Menggunakan password sederhana 123456', 'Mematikan service SSH secara permanen'] : undefined,
          correctOptionIndex: i % 2 !== 0 ? 0 : undefined,
          keywords: ['ssh key', 'fail2ban', 'port 22', 'firewall', 'hardening'],
          modelAnswer: 'Pengamanan SSH meliputi: mengganti port default 22, menonaktifkan password authentication dan menggunakan SSH Key Pair, serta memasang Fail2ban untuk memblokir IP pembobol secara otomatis.',
          points: 10
        });
      }
    }
  }

  return questions;
};

// Cached instance of Question Bank
export const ALL_QUIZ_QUESTIONS = generateQuizQuestionBank();

// Storage keys
export const QUIZ_RESULTS_STORAGE_KEY = 'learning_portal_quiz_results_v1';
export const STUDENT_POINTS_STORAGE_KEY = 'learning_portal_student_points_v1';

// Helper to get stored quiz results
export const getStoredQuizResults = (): QuizResultRecord[] => {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

// Helper to recalculate student points map from scratch across all results for 100% data consistency
export const recalculateStudentPointsMap = (): void => {
  try {
    const results = getStoredQuizResults();
    const pointsMap: Record<string, { totalPoints: number; quizzesTaken: number; studentName: string; studentClass: string }> = {};

    results.forEach(r => {
      const key = (r.studentId && r.studentId !== 'GUEST') 
        ? r.studentId 
        : r.studentName.trim().toLowerCase();

      if (!pointsMap[key]) {
        pointsMap[key] = {
          totalPoints: 0,
          quizzesTaken: 0,
          studentName: r.studentName,
          studentClass: r.studentClass
        };
      } else {
        pointsMap[key].studentName = r.studentName;
        pointsMap[key].studentClass = r.studentClass;
      }
      pointsMap[key].totalPoints += (r.pointsEarned || 0);
      pointsMap[key].quizzesTaken += 1;
    });

    localStorage.setItem(STUDENT_POINTS_STORAGE_KEY, JSON.stringify(pointsMap));
  } catch (e) {
    console.error('Error recalculating student points map:', e);
  }
};

// Helper to save quiz result
export const saveQuizResult = (record: QuizResultRecord): void => {
  try {
    const existing = getStoredQuizResults();
    const updated = [record, ...existing];
    localStorage.setItem(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(updated));
    recalculateStudentPointsMap();
  } catch (e) {
    console.error('Error saving quiz result:', e);
  }
};

// Update a quiz result record when graded by admin/teacher
export const updateQuizResultByAdmin = (updatedRecord: QuizResultRecord): void => {
  try {
    const existing = getStoredQuizResults();
    const index = existing.findIndex(r => r.id === updatedRecord.id);
    if (index !== -1) {
      existing[index] = {
        ...updatedRecord,
        isGradedByAdmin: true,
        adminGradedAt: Date.now()
      };
      localStorage.setItem(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(existing));
      recalculateStudentPointsMap();
    }
  } catch (e) {
    console.error('Error updating quiz result by admin:', e);
  }
};

// Delete a quiz result record
export const deleteQuizResultRecord = (id: string): void => {
  try {
    const existing = getStoredQuizResults();
    const filtered = existing.filter(r => r.id !== id);
    localStorage.setItem(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify(filtered));
    recalculateStudentPointsMap();
  } catch (e) {
    console.error('Error deleting quiz result:', e);
  }
};

// Helper to calculate smart essay score based on keywords & technical match
export const evaluateEssayAnswer = (userAnswer: string, keywords: string[], maxPoints: number = 10): { isCorrect: boolean; score: number; feedback: string } => {
  if (!userAnswer || userAnswer.trim().length < 5) {
    return {
      isCorrect: false,
      score: 0,
      feedback: 'Jawaban terlalu singkat atau kosong. Berikan penjelasan teknis yang lebih detail.'
    };
  }

  const normalized = userAnswer.toLowerCase();
  let matchedCount = 0;

  keywords.forEach(kw => {
    if (normalized.includes(kw.toLowerCase())) {
      matchedCount++;
    }
  });

  const matchRatio = keywords.length > 0 ? matchedCount / keywords.length : 1;

  if (matchRatio >= 0.7) {
    return {
      isCorrect: true,
      score: maxPoints,
      feedback: `Sangat Bagus! Penjelasan Anda sangat akurat dan mencakup poin kunci teknis (${matchedCount}/${keywords.length} istilah tepat).`
    };
  } else if (matchRatio >= 0.3) {
    const points = Math.round(maxPoints * 0.6);
    return {
      isCorrect: true,
      score: points,
      feedback: `Cukup Baik. Jawaban Anda sudah mengarah pada konsep yang benar (${matchedCount}/${keywords.length} istilah utama ditemukan).`
    };
  } else {
    return {
      isCorrect: false,
      score: 0,
      feedback: `Kurang Tepat. Jawaban Anda belum mencantumkan istilah/konsep teknis kunci seperti: ${keywords.slice(0, 3).join(', ')}.`
    };
  }
};
