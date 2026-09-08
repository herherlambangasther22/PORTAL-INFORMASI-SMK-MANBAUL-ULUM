/**
 * Comprehensive Audio & Spoken Voice Feedback System for Digital Attendance
 * SMK Manbaul Ulum
 * 
 * Works seamlessly across:
 * - Localhost / Linux Mint 22.2
 * - Local School Network (LAN / Offline WiFi)
 * - Public Cloud / Production Deployment
 * - Desktop & Mobile / Tablet Devices
 * 
 * Features:
 * 1. Dual-Engine Feedback:
 *    - Acoustic Chime & Industrial Buzzer (Web Audio API - 100% offline & zero dependencies)
 *    - Natural Indonesian Voice Announcements (SpeechSynthesis with auto-fallback)
 * 2. Status Coverage:
 *    - DITERIMA (Berhasil, Terlambat, Sudah Absen Hari Ini)
 *    - DITOLAK (Identitas tidak terdaftar, Salah portal Guru/Siswa, Wajah tidak cocok, QR tidak valid)
 * 3. Browser Autoplay Auto-Unlocker:
 *    - Primes AudioContext & SpeechSynthesis on the very first user interaction or scanner keystroke.
 *    - Manual "Uji Suara" test button with immediate vocal confirmation.
 */

class AttendanceAudioEngine {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Unlock AudioContext on touch / click / scanner keydown
   */
  public unlock() {
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play a silent 1ms buffer to satisfy browser autoplay security
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Loud, bright, celebratory confirmation chime (E5 -> A5 -> C#6)
   * Plays when attendance is successfully recorded.
   */
  public playSuccess() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, now);
      masterGain.connect(ctx.destination);

      // Dynamics compressor to maximize clarity and volume
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, now);
      compressor.knee.setValueAtTime(4, now);
      compressor.ratio.setValueAtTime(12, now);
      compressor.attack.setValueAtTime(0.002, now);
      compressor.release.setValueAtTime(0.1, now);
      compressor.connect(masterGain);

      // Notes: E5 (659.25Hz) -> A5 (880Hz) -> C#6 (1108.73Hz)
      const notes = [
        { freq: 659.25, time: 0.0, dur: 0.12 },
        { freq: 880.00, time: 0.08, dur: 0.14 },
        { freq: 1108.73, time: 0.16, dur: 0.38 }
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now + time);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now + time); // 1-octave harmonic sparkle

        noteGain.gain.setValueAtTime(0, now + time);
        noteGain.gain.linearRampToValueAtTime(0.85, now + time + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc1.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(compressor);

        osc1.start(now + time);
        osc1.stop(now + time + dur + 0.05);
        osc2.start(now + time);
        osc2.stop(now + time + dur + 0.05);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Loud, urgent, authoritative Warning & Error Alarm Buzzer
   * Played when attendance is REJECTED / DITOLAK
   */
  public playError() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.95, now);
      masterGain.connect(ctx.destination);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-6, now);
      compressor.knee.setValueAtTime(1, now);
      compressor.ratio.setValueAtTime(20, now);
      compressor.attack.setValueAtTime(0.001, now);
      compressor.release.setValueAtTime(0.06, now);
      compressor.connect(masterGain);

      // High-impact dual-burst warning alarm:
      // Burst 1: t = 0.0s (High-to-low urgent buzz)
      // Burst 2: t = 0.15s (Secondary louder rejection siren)
      const bursts = [
        { time: 0.0, dur: 0.13, startFreq: 340, endFreq: 196, subStartFreq: 170, subEndFreq: 98 },
        { time: 0.15, dur: 0.25, startFreq: 320, endFreq: 174.6, subStartFreq: 160, subEndFreq: 87.3 }
      ];

      bursts.forEach(({ time, dur, startFreq, endFreq, subStartFreq, subEndFreq }) => {
        const oscSaw = ctx.createOscillator();
        const oscSquare = ctx.createOscillator();
        const oscNoise = ctx.createOscillator();
        const pulseGain = ctx.createGain();

        oscSaw.type = 'sawtooth';
        oscSaw.frequency.setValueAtTime(startFreq, now + time);
        oscSaw.frequency.exponentialRampToValueAtTime(Math.max(50, endFreq), now + time + dur);

        oscSquare.type = 'square';
        oscSquare.frequency.setValueAtTime(subStartFreq, now + time);
        oscSquare.frequency.exponentialRampToValueAtTime(Math.max(40, subEndFreq), now + time + dur);

        oscNoise.type = 'sawtooth';
        oscNoise.frequency.setValueAtTime(startFreq * 1.414, now + time); // Tritone dissonance
        oscNoise.frequency.exponentialRampToValueAtTime(endFreq * 1.414, now + time + dur);

        pulseGain.gain.setValueAtTime(0, now + time);
        pulseGain.gain.linearRampToValueAtTime(0.95, now + time + 0.012);
        pulseGain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);

        oscSaw.connect(pulseGain);
        oscSquare.connect(pulseGain);
        oscNoise.connect(pulseGain);
        pulseGain.connect(compressor);

        oscSaw.start(now + time);
        oscSaw.stop(now + time + dur + 0.04);
        oscSquare.start(now + time);
        oscSquare.stop(now + time + dur + 0.04);
        oscNoise.start(now + time);
        oscNoise.stop(now + time + dur + 0.04);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Informative double-tone bell for "Sudah Absen Hari Ini"
   */
  public playAlready() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.8, now);
      masterGain.connect(ctx.destination);

      const dings = [
        { freq: 493.88, time: 0.0, dur: 0.18 }, // B4
        { freq: 659.25, time: 0.14, dur: 0.32 }  // E5
      ];

      dings.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.85, now + time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Pleasant 4-note ascending chord for Audio/Speaker Testing
   * (C5 -> E5 -> G5 -> C6)
   */
  public playVoiceTestChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.8, now);
      masterGain.connect(ctx.destination);

      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.1, dur: 0.12 }, // E5
        { freq: 783.99, time: 0.2, dur: 0.14 }, // G5
        { freq: 1046.50, time: 0.3, dur: 0.35 } // C6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.8, now + time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch (e) {
      console.warn('Audio test chime error:', e);
    }
  }

  /**
   * Unified dispatcher method
   */
  public play(type: 'success' | 'error' | 'already' | 'reject' | 'test' = 'success') {
    if (type === 'success') {
      this.playSuccess();
    } else if (type === 'already') {
      this.playAlready();
    } else if (type === 'test') {
      this.playVoiceTestChime();
    } else {
      this.playError();
    }
  }
}

/**
 * Peta Nama Panggilan Resmi untuk Suara Notifikasi Presensi (Text-to-Speech)
 * Mengutamakan penyebutan nama panggilan ramah, natural & tidak disingkat
 */
export const STUDENT_SPOKEN_NICKNAMES: Record<string, string> = {
  // --- GURU PENGAJAR TJKT ---
  'HERLAMBANG LASENA, S.T.': 'Pak Beng',
  'HERLAMBANG LASENA': 'Pak Beng',
  'HERLAMBANG': 'Pak Beng',
  'PAK HERLAMBANG': 'Pak Beng',
  'PAK BENG': 'Pak Beng',
  'BENG': 'Pak Beng',
  'SMK-GURU-G1': 'Pak Beng',
  '198501012010011001': 'Pak Beng',
  '1653761770': 'Pak Beng',

  // --- KELAS X TJKT ---
  'ANISA': 'Anisa',
  'HAFIZATUN NAILA FAUZIYAH': 'Pijah',
  'HAFIZATUN NAILA': 'Pijah',
  'HAFIZATUN': 'Pijah',
  'KEVIN ARIYANTO': 'Kevin',
  'KEVIN': 'Kevin',
  'ALKA REZA SAPUTRA': 'Alka',
  'ALKA REZA': 'Alka',
  'ALKA': 'Alka',
  'M. ULUL JAUHARI ILMI': 'Ulul',
  'M ULUL JAUHARI ILMI': 'Ulul',
  'M. ULUL JAUHARI': 'Ulul',
  'M ULUL JAUHARI': 'Ulul',
  'ULUL JAUHARI ILMI': 'Ulul',
  'ULUL JAUHARI': 'Ulul',
  'ULUL': 'Ulul',
  'NADIA MARSELA': 'Nadia',
  'NADIA': 'Nadia',
  'QONITA AULIA RIFQIYAH': 'Nita',
  'QONITA AULIA': 'Nita',
  'QONITA': 'Nita',
  'SHELA SANDRA': 'Sela',
  'SHELA': 'Sela',
  'SINTA FITRIANI': 'Sinta',
  'SINTA': 'Sinta',
  'ZAHRA OLIVIA': 'Zahra',
  'ZAHRA': 'Zahra',
  'ZAHWA AQILA': 'Zahwa',
  'ZAHWA': 'Zahwa',

  // --- KELAS XI TJKT ---
  'AHMAD SAMSUDIN': 'Udin',
  'AHMAD SAMSUDIN - KLS XI TJKT': 'Udin',
  'SAMSUDIN': 'Udin',
  'UDIN': 'Udin',
  "AS'AD MAULIDAH ROING KANAH": 'Lida',
  'ASAD MAULIDAH ROING KANAH': 'Lida',
  "AS'AD MAULIDAH": 'Lida',
  'MAULIDAH ROING KANAH': 'Lida',
  'MAULIDAH': 'Lida',
  'LIDA': 'Lida',
  'DIMAS SUSENO': 'Dimas',
  'DIMAS': 'Dimas',
  'HUSNI ZAKI MAHLUFI': 'Zaki',
  'HUSNI ZAKI': 'Zaki',
  'ZAKI MAHLUFI': 'Zaki',
  'ZAKI': 'Zaki',

  // --- KELAS XII TJKT ---
  'ASSYFA TUNNAZAH': 'Sipet',
  'ASSYFA': 'Sipet',
  'SIPET': 'Sipet',
  'JENI RAMADHANI': 'Jeni',
  'JENI': 'Jeni',
  'MIRSA TRISANTA PUTRI': 'Mirsa',
  'MIRSA TRISANTA': 'Mirsa',
  'MIRSA': 'Mirsa',
  'NABILA KHOIRUNISA ISLAMI': 'Nabila',
  'NABILA KHOIRUNISA': 'Nabila',
  'NABILA': 'Nabila',
  'RHELOVI KHAYLA ANEKSHA': 'Kayla',
  'RHELOVI KHAYLA': 'Kayla',
  'RHELOVI': 'Kayla',
  'KHAYLA': 'Kayla',
  'KAYLA': 'Kayla',
  'SRI WININGSIH': 'Sri',
  'SRI': 'Sri',
  'SYIFA MUTIA SARI': 'Bilqis',
  'SYIFA MUTIA': 'Bilqis',
  'SYIFA': 'Bilqis',
  'BILQIS': 'Bilqis',
  'M. TEGUH ANDRIAN AMSAH': 'Teguh',
  'M TEGUH ANDRIAN AMSAH': 'Teguh',
  'M. TEGUH': 'Teguh',
  'M TEGUH': 'Teguh',
  'TEGUH ANDRIAN AMSAH': 'Teguh',
  'TEGUH': 'Teguh',

  // Berdasarkan NIS Siswa
  '2401': 'Anisa',
  '2402': 'Pijah',
  '2403': 'Kevin',
  '2404': 'Alka',
  '2405': 'Ulul',
  '2406': 'Nadia',
  '2407': 'Nita',
  '2408': 'Sela',
  '2409': 'Sinta',
  '2410': 'Zahra',
  '2411': 'Zahwa',
  '2301': 'Udin',
  '2302': 'Lida',
  '2303': 'Dimas',
  '2304': 'Zaki',
  '2201': 'Sipet',
  '2202': 'Jeni',
  '2203': 'Mirsa',
  '2204': 'Nabila',
  '2205': 'Kayla',
  '2206': 'Sri',
  '2207': 'Bilqis',
  '2208': 'Teguh',

  // Berdasarkan ID Siswa
  'SMK-X-01': 'Anisa',
  'SMK-X-02': 'Pijah',
  'SMK-X-03': 'Kevin',
  'SMK-X-04': 'Alka',
  'SMK-X-05': 'Ulul',
  'SMK-X-06': 'Nadia',
  'SMK-X-07': 'Nita',
  'SMK-X-08': 'Sela',
  'SMK-X-09': 'Sinta',
  'SMK-X-10': 'Zahra',
  'SMK-X-11': 'Zahwa',
  'SMK-XI-01': 'Udin',
  'SMK-XI-02': 'Lida',
  'SMK-XI-03': 'Dimas',
  'SMK-XI-04': 'Zaki',
  'SMK-XII-01': 'Sipet',
  'SMK-XII-02': 'Jeni',
  'SMK-XII-03': 'Mirsa',
  'SMK-XII-04': 'Nabila',
  'SMK-XII-05': 'Kayla',
  'SMK-XII-06': 'Sri',
  'SMK-XII-07': 'Bilqis',
  'SMK-XII-08': 'Teguh',
};

/**
 * Ekstraksi nama panggilan yang ramah & natural untuk pesan suara
 */
export function getSpokenName(input: string | any): string {
  if (!input) return 'Siswa';

  if (typeof input === 'object') {
    if (input.nip === '198501012010011001' || /herlambang|lasena|beng/i.test(input.name || '')) {
      return 'Pak Beng';
    }
    if (input.nis && STUDENT_SPOKEN_NICKNAMES[input.nis]) {
      return STUDENT_SPOKEN_NICKNAMES[input.nis];
    }
    if (input.id && STUDENT_SPOKEN_NICKNAMES[input.id]) {
      return STUDENT_SPOKEN_NICKNAMES[input.id];
    }
    input = input.fullName || input.name || '';
  }

  let str = String(input).trim();

  // Khusus Guru Herlambang Lasena (Panggilan Resmi: Pak Beng)
  if (/herlambang|lasena|beng/i.test(str)) {
    return 'Pak Beng';
  }

  // 1. Bersihkan suffix kelas (contoh: "- Kls X TJKT", "- Kelas X", "(X TJKT)", dll)
  str = str.replace(/[-–]\s*Kls\s+[A-Z0-9\s]+$/i, '').trim();
  str = str.replace(/[-–]\s*Kelas\s+[A-Z0-9\s]+$/i, '').trim();
  str = str.replace(/\s*\([^)]*\)$/i, '').trim();

  // 2. Bersihkan prefix formal jika ada
  str = str.replace(/^(Bpk\.|Ibu|Pak|Sdr\.|Ananda)\s*/i, '').trim();

  const upperStr = str.toUpperCase().trim();

  // 3. Cek langsung kecocokan di kamus nama panggilan
  if (STUDENT_SPOKEN_NICKNAMES[upperStr]) {
    return STUDENT_SPOKEN_NICKNAMES[upperStr];
  }

  // 4. Cek apakah ada key yang terkandung dalam nama lengkap
  for (const [key, nickname] of Object.entries(STUDENT_SPOKEN_NICKNAMES)) {
    if (key.length >= 3 && (upperStr === key || upperStr.startsWith(key + ' ') || upperStr.includes(key))) {
      return nickname;
    }
  }

  // 5. Fallback cerdas agar penyebutan nama tidak disingkat & terdengar natural:
  // Hapus gelar akademik di akhir
  let cleanName = str.replace(/,\s*[A-Z.\s]+$/i, '').trim();

  // Jika nama diawali dengan 'M.', 'Moh.', 'Muhammad', ambil kata sesudahnya agar tidak mengeja "Em titik"
  cleanName = cleanName.replace(/^(M\.|Moh\.|Muhammad|Mhd\.)\s+/i, '');

  // Ambil kata pertama sebagai panggilan
  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const firstWord = words[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }

  return cleanName || 'Siswa';
}

class AttendanceVoiceEngine {
  private voices: SpeechSynthesisVoice[] = [];
  private isVoiceLoaded: boolean = false;
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
    }
  }

  private initVoices() {
    try {
      const load = () => {
        this.voices = window.speechSynthesis.getVoices() || [];
        if (this.voices.length > 0) {
          this.isVoiceLoaded = true;
        }
      };

      load();
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = load;
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Mendeteksi suara Bahasa Indonesia berkualitas tertinggi & paling natural (Google / Microsoft Natural)
   */
  private getBestVoice(): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.voices = window.speechSynthesis.getVoices() || [];
      }
    }

    if (!this.voices || this.voices.length === 0) return null;

    // 1. Prioritaskan suara Bahasa Indonesia Natural / Neural / Google
    const naturalIdVoice = this.voices.find(v => 
      (v.lang === 'id-ID' || v.lang.toLowerCase() === 'id_id' || v.lang.toLowerCase().startsWith('id')) &&
      /natural|google|neural|online|indonesian/i.test(v.name)
    );
    if (naturalIdVoice) return naturalIdVoice;

    // 2. Prioritaskan suara Bahasa Indonesia murni (id-ID)
    const idVoice = this.voices.find(v => 
      v.lang === 'id-ID' || 
      v.lang.toLowerCase() === 'id_id' || 
      v.lang.toLowerCase().startsWith('id')
    );
    if (idVoice) return idVoice;

    // 3. Cek suara dengan kata kunci Indonesia / Bahasa
    const nameMatch = this.voices.find(v => 
      /indonesia|bahasa|gadis|andika|ardi|damayanti|siti/i.test(v.name)
    );
    if (nameMatch) return nameMatch;

    // 4. Fallback ke voice default sistem
    const defaultVoice = this.voices.find(v => v.default);
    return defaultVoice || this.voices[0] || null;
  }

  /**
   * Unlock SpeechSynthesis on user interaction
   */
  public unlock() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Core speech dispatcher dengan intonasi natural seperti manusia
   */
  public speak(text: string, options: { rate?: number; pitch?: number; onEnd?: () => void } = {}) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Cancel previous speech to keep announcements rapid and responsive
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = options.rate ?? 0.98; // Kecepatan tempo 0.98 agar intonasi terdengar santai, natural & hangat
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = 1.0;

      const bestVoice = this.getBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
        if (bestVoice.lang) utterance.lang = bestVoice.lang;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      // Resume in case browser suspended speech queue
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failure:', e);
    }
  }

  /**
   * Suara Notifikasi Presensi DITERIMA (Berhasil)
   * Menyebutkan nama panggilan siswa/guru secara ramah, luwes, dan natural seperti manusia
   */
  public speakGreeting(nameOrStudent: string | any, isLate: boolean = false, isAlready: boolean = false) {
    const spokenName = getSpokenName(nameOrStudent);

    let text = `Selamat datang, ${spokenName}. Absensi Anda berhasil dicatat.`;
    if (isAlready) {
      text = `Pemberitahuan, ${spokenName} sudah melakukan absensi hari ini.`;
    } else if (isLate) {
      text = `Selamat datang, ${spokenName}. Kehadiran Anda tercatat terlambat.`;
    }

    this.speak(text, { rate: 0.98, pitch: 1.0 });
  }

  /**
   * Suara Notifikasi Presensi PULANG
   */
  public speakCheckout(nameOrStudent: string | any) {
    const spokenName = getSpokenName(nameOrStudent);
    const text = `Terima kasih, ${spokenName}. Absensi pulang Anda berhasil dicatat. Selamat beristirahat dan hati-hati di jalan!`;
    this.speak(text, { rate: 0.98, pitch: 1.0 });
  }

  /**
   * Suara Notifikasi Presensi DITOLAK (Gagal / Invalid)
   * Mengumumkan penolakan dan alasan penolakan secara tegas & jelas
   */
  public speakRejection(reason: string) {
    let cleanMsg = reason.trim();

    // Custom voice announcements requested for early check-in or early check-out
    if (/cuy/i.test(cleanMsg) || /belum masuk/i.test(cleanMsg) || /belum waktunya keluar/i.test(cleanMsg)) {
      // Speak the exact custom phrase without extra prefix
    } else if (/terdeteksi sebagai siswa/i.test(cleanMsg)) {
      cleanMsg = 'Absensi ditolak. Terdeteksi sebagai siswa, silakan gunakan kiosk absensi siswa.';
    } else if (/terdeteksi sebagai guru/i.test(cleanMsg)) {
      cleanMsg = 'Absensi ditolak. Terdeteksi sebagai guru, silakan gunakan portal absensi guru.';
    } else if (/tidak terdaftar|tidak ditemukan|tidak dikenali/i.test(cleanMsg)) {
      cleanMsg = 'Absensi ditolak. Identitas tidak terdaftar di sistem.';
    } else if (/wajah tidak cocok|tidak terverifikasi/i.test(cleanMsg)) {
      cleanMsg = 'Absensi ditolak. Wajah tidak cocok, silakan posisikan wajah tegak di kamera.';
    } else if (/tidak ada wajah|wajah tidak terdeteksi/i.test(cleanMsg)) {
      cleanMsg = 'Pemberitahuan. Posisikan wajah Anda tepat di depan bingkai kamera.';
    } else if (/belum ada data|database.*kosong/i.test(cleanMsg)) {
      cleanMsg = 'Absensi ditolak. Belum ada data terdaftar di database sistem.';
    } else if (/qr code tidak terdeteksi|tidak terbaca/i.test(cleanMsg)) {
      cleanMsg = 'Absensi ditolak. Kode QR tidak terbaca, coba dekatkan ke scanner.';
    } else if (!cleanMsg.toLowerCase().startsWith('absensi ditolak') && !/cuy/i.test(cleanMsg)) {
      cleanMsg = `Absensi ditolak. ${cleanMsg}`;
    }

    this.speak(cleanMsg, { rate: 1.02, pitch: 0.98 });
  }

  /**
   * Test audio & vocal notification
   */
  public test() {
    attendanceAudio.playVoiceTestChime();
    setTimeout(() => {
      this.speak('Sistem notifikasi suara SMK Manbaul Ulum aktif. Selamat datang di sistem absensi.');
    }, 450);
  }

  /**
   * Get current voice status for diagnostic / indicator
   */
  public getStatus() {
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const bestVoice = this.getBestVoice();
    const isIndonesian = bestVoice ? (bestVoice.lang.toLowerCase().startsWith('id') || /indonesia|bahasa/i.test(bestVoice.name)) : false;

    return {
      isSupported,
      hasVoice: !!bestVoice,
      voiceName: bestVoice ? bestVoice.name : 'Default Browser Voice',
      isIndonesian,
      totalVoices: this.voices.length
    };
  }
}

export const attendanceAudio = new AttendanceAudioEngine();
export const attendanceVoice = new AttendanceVoiceEngine();

/**
 * Main helper functions exported for components
 */
export const playAttendanceSound = (type: 'success' | 'error' | 'already' | 'reject' | 'test' = 'success') => {
  attendanceAudio.play(type);
};

export const speakAttendanceGreeting = (nameOrStudent: string | any, isLate: boolean = false, isAlready: boolean = false) => {
  attendanceVoice.speakGreeting(nameOrStudent, isLate, isAlready);
};

export const speakAttendanceCheckout = (nameOrStudent: string | any) => {
  attendanceVoice.speakCheckout(nameOrStudent);
};

export const speakAttendanceRejection = (reason: string) => {
  attendanceVoice.speakRejection(reason);
};

export const testVoiceAudio = () => {
  attendanceAudio.unlock();
  attendanceVoice.unlock();
  attendanceVoice.test();
};

export const unlockAudioManually = () => {
  attendanceAudio.unlock();
  attendanceVoice.unlock();
};

export const getAudioStatus = () => {
  return attendanceVoice.getStatus();
};

// Global Autoplay Unlocker
if (typeof window !== 'undefined') {
  const autoUnlock = () => {
    attendanceAudio.unlock();
    attendanceVoice.unlock();
    window.removeEventListener('click', autoUnlock);
    window.removeEventListener('touchstart', autoUnlock);
    window.removeEventListener('keydown', autoUnlock);
    window.removeEventListener('pointerdown', autoUnlock);
  };

  window.addEventListener('click', autoUnlock, { passive: true });
  window.addEventListener('touchstart', autoUnlock, { passive: true });
  window.addEventListener('keydown', autoUnlock, { passive: true });
  window.addEventListener('pointerdown', autoUnlock, { passive: true });
}
