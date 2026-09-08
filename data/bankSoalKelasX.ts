import { QuizQuestion } from './quizData';

// DATA BANK SOAL KELAS X TJKT (15 MATERI / QUIZ, MASING-MASING 15 SOAL LENGKAP & UNIK)
export const RAW_BANK_SOAL_X = [
  // =========================================================================
  // QUIZ 1: KOMPUTER & HARDWARE (x-1) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-1',
    qNum: 1,
    q: "Komponen utama komputer yang berfungsi sebagai otak pemrosesan instruksi dan data adalah...",
    opts: ["Random Access Memory (RAM)","Hard Disk Drive (HDD)","Central Processing Unit (CPU)","Power Supply Unit (PSU)"],
    ans: 2
  },
  {
    topicId: 'x-1',
    qNum: 2,
    q: "Perangkat keras yang berfungsi menghubungkan seluruh komponen internal komputer seperti CPU, RAM, dan kartu ekspansi adalah...",
    opts: ["Heatsink","Motherboard","Casing Komputer","Sound Card"],
    ans: 1
  },
  {
    topicId: 'x-1',
    qNum: 3,
    q: "Memori komputer yang bersifat volatile (data hilang ketika arus listrik mati) adalah...",
    opts: ["RAM (Random Access Memory)","ROM (Read Only Memory)","SSD (Solid State Drive)","Flashdisk"],
    ans: 0
  },
  {
    topicId: 'x-1',
    qNum: 4,
    q: "Perangkat keras yang berfungsi mengubah arus bolak-balik (AC) dari PLN menjadi arus searah (DC) untuk komponen PC adalah...",
    opts: ["Inverter","Stabilizer","Uninterruptible Power Supply (UPS)","Power Supply Unit (PSU)"],
    ans: 3
  },
  {
    topicId: 'x-1',
    qNum: 5,
    q: "Media penyimpanan berbasis non-volatile yang menggunakan flash memory dan memiliki kecepatan baca-tulis jauh lebih tinggi dari HDD mekanik adalah...",
    opts: ["Optical Disc Drive","Floppy Disk","Solid State Drive (SSD)","Magnetic Tape"],
    ans: 2
  },
  {
    topicId: 'x-1',
    qNum: 6,
    q: "Manakah dari perangkat berikut yang termasuk ke dalam kategori perangkat masukan (Input Device)?",
    opts: ["Monitor dan Speaker","Barcode Scanner dan Keyboard","Printer dan Plotter","Proyektor dan Headset"],
    ans: 1
  },
  {
    topicId: 'x-1',
    qNum: 7,
    q: "Perangkat output yang berfungsi menampilkan visual grafis antarmuka sistem kepada pengguna adalah...",
    opts: ["Monitor","Digitizer","Trackball","Scanner"],
    ans: 0
  },
  {
    topicId: 'x-1',
    qNum: 8,
    q: "Komponen hardware yang bertugas khusus mengolah komputasi grafis 3D dan rendering visual adalah...",
    opts: ["Network Interface Card (NIC)","Sound Card","Capture Card","Graphics Processing Unit (GPU/VGA)"],
    ans: 3
  },
  {
    topicId: 'x-1',
    qNum: 9,
    q: "Fungsi utama dari pasta termal (thermal paste) yang dioleskan di atas prosesor adalah...",
    opts: ["Sebagai isolator listrik agar CPU tidak korslet","Merekatkan prosesor ke socket motherboard secara permanen","Menyalurkan panas dari IHS prosesor ke heatsink pendingin secara optimal","Meningkatkan frekuensi clock CPU secara otomatis"],
    ans: 2
  },
  {
    topicId: 'x-1',
    qNum: 10,
    q: "Slot ekspansi pada motherboard modern yang umum digunakan untuk memasang kartu grafis (GPU) berkecepatan tinggi adalah...",
    opts: ["Slot PCI Standar","Slot PCIe x16","Slot AGP","Slot ISA"],
    ans: 1
  },
  {
    topicId: 'x-1',
    qNum: 11,
    q: "Port antarmuka display visual modern yang mampu mentransmisikan sinyal video resolusi tinggi beserta sinyal audio digital sekaligus adalah...",
    opts: ["HDMI dan DisplayPort","VGA (D-Sub 15 pin)","DVI-A","PS/2"],
    ans: 0
  },
  {
    topicId: 'x-1',
    qNum: 12,
    q: "Satuan kecepatan clock rate pada prosesor modern saat ini umumnya diukur dalam...",
    opts: ["Megabyte (MB)","Gigabit per second (Gbps)","Revolutions per minute (RPM)","Gigahertz (GHz)"],
    ans: 3
  },
  {
    topicId: 'x-1',
    qNum: 13,
    q: "Media penyimpanan optik yang membaca dan menulis data menggunakan sinar laser inframerah atau biru adalah...",
    opts: ["NVMe M.2","eMMC","CD/DVD/Blu-ray Disc","Harddisk SAS"],
    ans: 2
  },
  {
    topicId: 'x-1',
    qNum: 14,
    q: "Perangkat keras yang berfungsi memberikan daya listrik cadangan sementara saat listrik padam agar komputer tidak mati mendadak adalah...",
    opts: ["AVR (Automatic Voltage Regulator)","UPS (Uninterruptible Power Supply)","Power Bank","Surge Protector"],
    ans: 1
  },
  {
    topicId: 'x-1',
    qNum: 15,
    q: "Komponen memori internal berkecepatan paling tinggi yang terletak di dalam inti silikon CPU untuk menyimpan data instruksi yang sedang diproses disebut...",
    opts: ["CPU Cache (L1/L2/L3)","Virtual Memory","CMOS RAM","DDR RAM"],
    ans: 0
  },
  // =========================================================================
  // QUIZ 2: SOFTWARE & SISTEM OPERASI (x-2) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-2',
    qNum: 1,
    q: "Pengertian sistem operasi (Operating System) yang paling tepat adalah...",
    opts: ["Aplikasi untuk mengedit video dan audio profesional","Perangkat lunak dasar yang menjembatani interaksi antara pengguna, aplikasi, dan perangkat keras","Perangkat keras yang mengatur tegangan listrik komputer","Protokol untuk menghubungkan komputer ke server internet"],
    ans: 1
  },
  {
    topicId: 'x-2',
    qNum: 2,
    q: "Manakah di bawah ini yang merupakan contoh sistem operasi open-source dengan kernel Linux?",
    opts: ["Ubuntu Linux","Microsoft Windows 11","Apple macOS Sonoma","MS-DOS"],
    ans: 0
  },
  {
    topicId: 'x-2',
    qNum: 3,
    q: "Bagian terdalam dan paling mendasar dari sistem operasi yang mengontrol manajemen memori, proses, dan periferal hardware disebut...",
    opts: ["Shell","User Interface","Compiler","Kernel"],
    ans: 3
  },
  {
    topicId: 'x-2',
    qNum: 4,
    q: "Antarmuka sistem operasi yang memungkinkan interaksi melalui ikon visual, jendela, dan penunjuk mouse disebut...",
    opts: ["Command Line Interface (CLI)","Text-based Interface (TUI)","Graphical User Interface (GUI)","Batch Processing Interface"],
    ans: 2
  },
  {
    topicId: 'x-2',
    qNum: 5,
    q: "Program perangkat lunak khusus yang memungkinkan sistem operasi mengenali dan berkomunikasi dengan perangkat keras tertentu disebut...",
    opts: ["Firmware Flash","Device Driver","BIOS Patch","Application Add-on"],
    ans: 1
  },
  {
    topicId: 'x-2',
    qNum: 6,
    q: "Di bawah ini yang tergolong ke dalam Application Software (Perangkat Lunak Aplikasi) adalah...",
    opts: ["Web Browser Chrome dan LibreOffice","Windows 10 dan Linux Mint","BIOS dan Device Driver","Kernel FreeBSD dan Android OS"],
    ans: 0
  },
  {
    topicId: 'x-2',
    qNum: 7,
    q: "Sistem operasi mobile yang dikembangkan oleh Google berbasis kernel Linux untuk smartphone dan tablet adalah...",
    opts: ["iOS","Windows Phone","Symbian","Android"],
    ans: 3
  },
  {
    topicId: 'x-2',
    qNum: 8,
    q: "Konsep perangkat lunak di mana kode sumbernya terbuka untuk dilihat, dimodifikasi, dan didistribusikan secara bebas dikenal dengan istilah...",
    opts: ["Proprietary Software","Freeware Tertutup","Open Source Software","Commercial Ware"],
    ans: 2
  },
  {
    topicId: 'x-2',
    qNum: 9,
    q: "Fitur pada sistem operasi modern yang memungkinkan eksekusi beberapa proses atau aplikasi secara bersamaan disebut...",
    opts: ["Single-threading","Multitasking","Overclocking","Defragmenting"],
    ans: 1
  },
  {
    topicId: 'x-2',
    qNum: 10,
    q: "Perangkat lunak utilitas pada Windows yang digunakan untuk melihat daftar proses yang sedang berjalan, penggunaan CPU, dan memori adalah...",
    opts: ["Task Manager","Device Manager","Disk Cleanup","Registry Editor"],
    ans: 0
  },
  {
    topicId: 'x-2',
    qNum: 11,
    q: "Perangkat lunak yang berfungsi melindungi sistem komputer dari ancaman virus, trojan, spyware, dan ransomware adalah...",
    opts: ["Archiver","Virtual Machine","Media Player","Antivirus / Anti-Malware"],
    ans: 3
  },
  {
    topicId: 'x-2',
    qNum: 12,
    q: "Struktur hierarki penyimpanan file pada sistem operasi Linux dimulai dari direktori akar yang dilambangkan dengan simbol...",
    opts: ["C:\\","root:\\","/ (slash)","~ (tilde)"],
    ans: 2
  },
  {
    topicId: 'x-2',
    qNum: 13,
    q: "Perangkat lunak yang didistribusikan secara gratis namun hanya untuk periode percobaan tertentu dengan fitur terbatas disebut...",
    opts: ["Open Source","Shareware / Trialware","Public Domain","Abandonware"],
    ans: 1
  },
  {
    topicId: 'x-2',
    qNum: 14,
    q: "Perintah terminal CLI pada sistem Linux yang digunakan untuk melihat daftar file dan folder pada direktori aktif adalah...",
    opts: ["ls","dir /w","show","list-files"],
    ans: 0
  },
  {
    topicId: 'x-2',
    qNum: 15,
    q: "Pemberian hak akses baca (read), tulis (write), dan eksekusi (execute) pada file di sistem operasi Unix/Linux diatur menggunakan perintah...",
    opts: ["chown","attrib","permission","chmod"],
    ans: 3
  },
  // =========================================================================
  // QUIZ 3: INSTALASI OS (x-3) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-3',
    qNum: 1,
    q: "Langkah persiapan awal yang paling krusial sebelum melakukan instalasi ulang sistem operasi pada komputer yang sudah terpakai adalah...",
    opts: ["Melakukan backup data penting pengguna ke media penyimpanan eksternal","Membersihkan debu pada kipas casing","Membongkar motherboard dan RAM","Mengganti kabel power supply"],
    ans: 0
  },
  {
    topicId: 'x-3',
    qNum: 2,
    q: "Aplikasi populer yang sering digunakan untuk membuat media instalasi Bootable USB Flashdisk dari file ISO Windows atau Linux adalah...",
    opts: ["Adobe Photoshop","VLC Media Player","WinRAR","Rufus dan Ventoy"],
    ans: 3
  },
  {
    topicId: 'x-3',
    qNum: 3,
    q: "Program firmware pada motherboard yang bertugas menginisialisasi hardware dan menentukan urutan perangkat booting (boot order) adalah...",
    opts: ["Operating System","DirectX","BIOS / UEFI","Master Boot Record"],
    ans: 2
  },
  {
    topicId: 'x-3',
    qNum: 4,
    q: "Tombol keyboard yang umumnya ditekan berulang saat komputer baru dinyalakan untuk masuk ke menu BIOS/UEFI setup adalah...",
    opts: ["Spasi atau Tab","Del, F2, atau F12","Ctrl + Alt + Delete","Enter atau Esc saja"],
    ans: 1
  },
  {
    topicId: 'x-3',
    qNum: 5,
    q: "Tipe skema partisi modern yang mendukung kapasitas disk di atas 2 TB serta mampu membuat partisi hingga 128 partisi primer pada UEFI adalah...",
    opts: ["GPT (GUID Partition Table)","MBR (Master Boot Record)","FAT16","Ext2"],
    ans: 0
  },
  {
    topicId: 'x-3',
    qNum: 6,
    q: "Sistem berkas (file system) default dan standar yang digunakan pada instalasi sistem operasi Microsoft Windows modern adalah...",
    opts: ["EXT4","HFS+","FAT32","NTFS"],
    ans: 3
  },
  {
    topicId: 'x-3',
    qNum: 7,
    q: "Sistem berkas standar yang paling umum digunakan pada instalasi distribusi Linux seperti Ubuntu atau Debian adalah...",
    opts: ["NTFS","FAT32","EXT4","exFAT"],
    ans: 2
  },
  {
    topicId: 'x-3',
    qNum: 8,
    q: "Fitur keamanan pada firmware UEFI yang mencegah pemuatan driver atau sistem operasi yang tidak bersertifikat sah saat boot dinamakan...",
    opts: ["Overclock Guard","Secure Boot","Quick Boot","Shadow RAM"],
    ans: 1
  },
  {
    topicId: 'x-3',
    qNum: 9,
    q: "Kondisi di mana sebuah komputer memiliki dua sistem operasi berbeda yang terpasang bersamaan dalam satu drive atau drive berbeda disebut...",
    opts: ["Dual Boot","Overclocking","Virtual Memory","Clustering"],
    ans: 0
  },
  {
    topicId: 'x-3',
    qNum: 10,
    q: "Proses pembagian ruang pada hard disk atau SSD menjadi beberapa drive logis yang independen disebut...",
    opts: ["Formatting","Defragmenting","Compressing","Partisi Disk (Partitioning)"],
    ans: 3
  },
  {
    topicId: 'x-3',
    qNum: 11,
    q: "Proses penataan sistem berkas pada suatu partisi dan pengosongan struktur data lama agar siap ditulisi data baru disebut...",
    opts: ["Partition","Mount","Format","Defrag"],
    ans: 2
  },
  {
    topicId: 'x-3',
    qNum: 12,
    q: "Jika saat booting muncul pesan kesalahan \"Reboot and Select proper Boot device\", kemungkinan penyebab utamanya adalah...",
    opts: ["Monitor tidak mendapatkan sinyal HDMI","Urutan boot order salah atau media penyimpanan sistem operasi tidak terdeteksi","Kapasitas RAM terlalu besar","Kipas pendingin prosesor berputar lambat"],
    ans: 1
  },
  {
    topicId: 'x-3',
    qNum: 13,
    q: "Langkah pertama yang wajib dilakukan segera setelah proses instalasi sistem operasi Windows berhasil diselesaikan adalah...",
    opts: ["Menginstal driver motherboard, chipset, grafis, dan jaringan yang sesuai","Menginstal game berat berukuran puluhan gigabyte","Mematikan sistem keamanan firewall Windows","Menghapus partisi system reserved"],
    ans: 0
  },
  {
    topicId: 'x-3',
    qNum: 14,
    q: "File citra cadangan (disk image) dari CD/DVD instalasi sistem operasi yang biasa diunduh dan digunakan untuk instalasi berekstensi...",
    opts: [".exe",".docx",".mp4",".iso"],
    ans: 3
  },
  {
    topicId: 'x-3',
    qNum: 15,
    q: "Partisi khusus pada sistem operasi Linux yang berfungsi sebagai memori cadangan virtual ketika kapasitas RAM fisik penuh disebut...",
    opts: ["Home Partition","Boot Partition","Swap Partition","Root Partition"],
    ans: 2
  },
  // =========================================================================
  // QUIZ 4: APLIKASI PERKANTORAN (x-4) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-4',
    qNum: 1,
    q: "Perangkat lunak pengolah kata (word processor) standar dari paket Microsoft Office adalah...",
    opts: ["Microsoft Excel","Microsoft Access","Microsoft PowerPoint","Microsoft Word"],
    ans: 3
  },
  {
    topicId: 'x-4',
    qNum: 2,
    q: "Fungsi kombinasi tombol keyboard (shortcut) Ctrl + C dan Ctrl + V pada aplikasi pengolah kata berturut-turut adalah...",
    opts: ["Memotong (Cut) dan Menempel (Paste)","Menyimpan (Save) dan Mencetak (Print)","Menyalin (Copy) dan Menempel (Paste)","Membatalkan (Undo) dan Mengulang (Redo)"],
    ans: 2
  },
  {
    topicId: 'x-4',
    qNum: 3,
    q: "Kombinasi tombol keyboard untuk membatalkan perintah tindakan terakhir (Undo) adalah...",
    opts: ["Ctrl + Y","Ctrl + Z","Ctrl + S","Ctrl + X"],
    ans: 1
  },
  {
    topicId: 'x-4',
    qNum: 4,
    q: "Pertemuan antara kolom (huruf) dan baris (angka) pada lembar kerja Microsoft Excel dinamakan...",
    opts: ["Cell (Sel)","Range","Worksheet","Formula Bar"],
    ans: 0
  },
  {
    topicId: 'x-4',
    qNum: 5,
    q: "Penulisan rumus atau formula perhitungan pada Microsoft Excel harus selalu diawali dengan tanda...",
    opts: ["Tanda Titik Dua (:)","Tanda Tambah (+)","Tanda Koma (,)","Tanda Sama Dengan (=)"],
    ans: 3
  },
  {
    topicId: 'x-4',
    qNum: 6,
    q: "Fungsi statistik pada Microsoft Excel yang digunakan untuk menghitung nilai rata-rata dari sekumpulan data angka adalah...",
    opts: ["=SUM()","=COUNT()","=AVERAGE()","=MAX()"],
    ans: 2
  },
  {
    topicId: 'x-4',
    qNum: 7,
    q: "Fungsi Excel yang digunakan untuk mencari nilai data terkecil dari sebuah rentang sel adalah...",
    opts: ["=MAX()","=MIN()","=MEDIAN()","=SMALLER()"],
    ans: 1
  },
  {
    topicId: 'x-4',
    qNum: 8,
    q: "Fungsi logika pada Excel yang digunakan untuk menghasilkan nilai berdasarkan pengujian syarat kondisi tertentu bernilai benar atau salah adalah...",
    opts: ["=IF()","=VLOOKUP()","=AND()","=CONCATENATE()"],
    ans: 0
  },
  {
    topicId: 'x-4',
    qNum: 9,
    q: "Aplikasi perkantoran alternatif open-source dan gratis yang setara dengan Microsoft Office di sistem Linux adalah...",
    opts: ["Corel Draw","Adobe Premiere","AutoCAD","LibreOffice / OpenOffice"],
    ans: 3
  },
  {
    topicId: 'x-4',
    qNum: 10,
    q: "Format ekstensi file standar bawaan dari dokumen Microsoft Excel versi modern (2007 ke atas) adalah...",
    opts: [".docx",".pptx",".xlsx",".pdf"],
    ans: 2
  },
  {
    topicId: 'x-4',
    qNum: 11,
    q: "Fitur pada Microsoft Word yang digunakan untuk membuat surat massal kepada banyak penerima dengan template yang sama secara otomatis disebut...",
    opts: ["Track Changes","Mail Merge","WordArt","Cross-reference"],
    ans: 1
  },
  {
    topicId: 'x-4',
    qNum: 12,
    q: "Kombinasi tombol keyboard pada Microsoft PowerPoint yang berfungsi untuk memulai slide show presentasi dari slide pertama adalah...",
    opts: ["F5","Shift + F5","Ctrl + F5","Alt + F5"],
    ans: 0
  },
  {
    topicId: 'x-4',
    qNum: 13,
    q: "Format dokumen portabel lintas platform yang mempertahankan tata letak huruf dan gambar agar tidak berubah saat dibuka di komputer lain adalah...",
    opts: [".txt",".rtf",".csv",".pdf"],
    ans: 3
  },
  {
    topicId: 'x-4',
    qNum: 14,
    q: "Untuk mengunci alamat referensi sel pada formula Excel agar tidak bergeser saat disalin ke sel lain digunakan simbol absolut yaitu...",
    opts: ["Simbol Pagar (#)","Simbol Persen (%)","Simbol Dollar ($)","Simbol Ampersand (&)"],
    ans: 2
  },
  {
    topicId: 'x-4',
    qNum: 15,
    q: "Fungsi pencarian vertikal pada Excel untuk mengambil data dari tabel referensi berdasarkan kunci nilai tertentu adalah...",
    opts: ["=HLOOKUP()","=VLOOKUP()","=MATCH()","=INDEX()"],
    ans: 1
  },
  // =========================================================================
  // QUIZ 5: DASAR JARINGAN (x-5) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-5',
    qNum: 1,
    q: "Definisi dari jaringan komputer (computer network) adalah...",
    opts: ["Sekumpulan komputer yang dirakit dalam satu casing yang sama","Program aplikasi untuk memperbaiki kerusakan komponen komputer","Sistem interkoneksi antara dua atau lebih komputer/perangkat untuk saling bertukar data dan berbagi sumber daya","Kumpulan kabel listrik bertegangan tinggi di laboratorium"],
    ans: 2
  },
  {
    topicId: 'x-5',
    qNum: 2,
    q: "Klasifikasi jaringan komputer dengan jangkauan area lokal terbatas seperti di dalam satu ruangan laboratorium atau gedung sekolah adalah...",
    opts: ["WAN (Wide Area Network)","LAN (Local Area Network)","MAN (Metropolitan Area Network)","GAN (Global Area Network)"],
    ans: 1
  },
  {
    topicId: 'x-5',
    qNum: 3,
    q: "Jaringan komputer yang mencakup area geografis sangat luas hingga antar kota, pulau, bahkan antar negara di seluruh dunia disebut...",
    opts: ["WAN (Wide Area Network)","LAN (Local Area Network)","PAN (Personal Area Network)","WLAN (Wireless LAN)"],
    ans: 0
  },
  {
    topicId: 'x-5',
    qNum: 4,
    q: "Model referensi standar arsitektur komunikasi jaringan terbuka yang terdiri dari 7 lapisan protokol disebut...",
    opts: ["TCP/IP Model","IEEE 802 Model","Cisco Network Model","OSI 7 Layer Reference Model"],
    ans: 3
  },
  {
    topicId: 'x-5',
    qNum: 5,
    q: "Urutan lapisan OSI Layer dari lapisan terbawah (Layer 1) hingga lapisan teratas (Layer 7) yang benar adalah...",
    opts: ["Application, Presentation, Session, Transport, Network, Data Link, Physical","Physical, Network, Data Link, Transport, Session, Presentation, Application","Physical, Data Link, Network, Transport, Session, Presentation, Application","Data Link, Physical, Network, Transport, Application, Presentation, Session"],
    ans: 2
  },
  {
    topicId: 'x-5',
    qNum: 6,
    q: "Perangkat keras jaringan yang beroperasi pada OSI Layer 3 dan bertugas meneruskan paket data antar subnet/network yang berbeda adalah...",
    opts: ["Hub","Router","Repeater","Unmanaged Switch"],
    ans: 1
  },
  {
    topicId: 'x-5',
    qNum: 7,
    q: "Perangkat jaringan yang berfungsi menghubungkan perangkat-perangkat dalam satu segmen LAN menggunakan tabel MAC Address (Layer 2) adalah...",
    opts: ["Switch","Router","Modem","Access Point Repeater"],
    ans: 0
  },
  {
    topicId: 'x-5',
    qNum: 8,
    q: "Protokol transfer data halaman web standar di internet yang berjalan pada port 80 dan port 443 yang terenkripsi adalah...",
    opts: ["FTP dan SFTP","SMTP dan POP3","Telnet dan SSH","HTTP dan HTTPS"],
    ans: 3
  },
  {
    topicId: 'x-5',
    qNum: 9,
    q: "Layanan protokol jaringan yang bertugas menerjemahkan nama domain (seperti smkmu.sch.id) menjadi alamat IP adalah...",
    opts: ["DHCP (Dynamic Host Configuration Protocol)","FTP (File Transfer Protocol)","DNS (Domain Name System)","NTP (Network Time Protocol)"],
    ans: 2
  },
  {
    topicId: 'x-5',
    qNum: 10,
    q: "Layanan jaringan yang memberikan konfigurasi alamat IP, subnet mask, dan gateway kepada perangkat client secara otomatis adalah...",
    opts: ["DNS Server","DHCP Server","Web Server","Proxy Server"],
    ans: 1
  },
  {
    topicId: 'x-5',
    qNum: 11,
    q: "Jaringan nirkabel pribadi jarak sangat dekat yang biasa menghubungkan smartphone dengan smartwatch atau headset TWS (contohnya Bluetooth) tergolong dalam...",
    opts: ["PAN (Personal Area Network)","MAN (Metropolitan Area Network)","WAN (Wide Area Network)","SAN (Storage Area Network)"],
    ans: 0
  },
  {
    topicId: 'x-5',
    qNum: 12,
    q: "Protokol pada Transport Layer yang bersifat connection-oriented, handal (reliable), dan memastikan data sampai tanpa kesalahan adalah...",
    opts: ["UDP (User Datagram Protocol)","IP (Internet Protocol)","ICMP (Internet Control Message Protocol)","TCP (Transmission Control Protocol)"],
    ans: 3
  },
  {
    topicId: 'x-5',
    qNum: 13,
    q: "Alamat fisik permanen (hardware address) berukuran 48-bit yang tertanam pada kartu jaringan (NIC) pabrikan dinamakan...",
    opts: ["IP Address","Port Number","MAC Address","Subnet Mask"],
    ans: 2
  },
  {
    topicId: 'x-5',
    qNum: 14,
    q: "Media transmisi kabel jaringan berkecepatan sangat tinggi yang mentransmisikan data dalam bentuk pulsa cahaya melalui serat kaca adalah...",
    opts: ["Kabel Koaksial","Kabel Fiber Optic (Serat Optik)","Kabel UTP Cat6","Kabel STP"],
    ans: 1
  },
  {
    topicId: 'x-5',
    qNum: 15,
    q: "Protokol remote terminal terenkripsi yang aman dan biasa berjalan pada port standar 22 untuk mengelola server jarak jauh adalah...",
    opts: ["SSH (Secure Shell)","Telnet","FTP","SNMP"],
    ans: 0
  },
  // =========================================================================
  // QUIZ 6: IP ADDRESS & SUBNETTING (x-6) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-6',
    qNum: 1,
    q: "Panjang total bit dari sebuah alamat IPv4 standar adalah...",
    opts: ["16 bit","32 bit","64 bit","128 bit"],
    ans: 1
  },
  {
    topicId: 'x-6',
    qNum: 2,
    q: "Panjang total bit dari format alamat IPv6 modern adalah...",
    opts: ["128 bit","32 bit","64 bit","256 bit"],
    ans: 0
  },
  {
    topicId: 'x-6',
    qNum: 3,
    q: "Rentang nilai oktet pertama untuk alamat IPv4 Kelas C standar adalah...",
    opts: ["1 – 126","128 – 191","224 – 239","192 – 223"],
    ans: 3
  },
  {
    topicId: 'x-6',
    qNum: 4,
    q: "Manakah di bawah ini yang merupakan blok alamat IP Private Kelas C yang biasa digunakan untuk jaringan lokal (LAN)?",
    opts: ["10.0.0.0/8","172.16.0.0/12","192.168.0.0/16","8.8.8.8/32"],
    ans: 2
  },
  {
    topicId: 'x-6',
    qNum: 5,
    q: "Subnet mask desimal default untuk alamat jaringan IPv4 Kelas C dengan notasi prefix /24 adalah...",
    opts: ["255.0.0.0","255.255.255.0","255.255.0.0","255.255.255.255"],
    ans: 1
  },
  {
    topicId: 'x-6',
    qNum: 6,
    q: "Jumlah total alamat IP yang tersedia pada sebuah subnet dengan notasi prefix /26 adalah...",
    opts: ["64 IP","32 IP","128 IP","256 IP"],
    ans: 0
  },
  {
    topicId: 'x-6',
    qNum: 7,
    q: "Rumus matematis standar untuk menghitung jumlah Host yang dapat digunakan (usable host) pada suatu subnet dengan n adalah jumlah bit host yang tersisa adalah...",
    opts: ["2^n","2^n + 2","n^2 - 2","2^n - 2"],
    ans: 3
  },
  {
    topicId: 'x-6',
    qNum: 8,
    q: "Berapa jumlah host valid (usable host) yang dapat dialokasikan untuk komputer client pada subnet dengan prefix /28?",
    opts: ["6 Host","30 Host","14 Host","62 Host"],
    ans: 2
  },
  {
    topicId: 'x-6',
    qNum: 9,
    q: "Jika sebuah komputer memiliki IP 192.168.1.100 dengan netmask 255.255.255.0 (/24), maka Network ID dari jaringan tersebut adalah...",
    opts: ["192.168.1.1","192.168.1.0","192.168.1.254","192.168.1.255"],
    ans: 1
  },
  {
    topicId: 'x-6',
    qNum: 10,
    q: "Alamat Broadcast ID untuk jaringan 192.168.1.0/24 adalah...",
    opts: ["192.168.1.255","192.168.1.1","192.168.1.100","192.168.1.254"],
    ans: 0
  },
  {
    topicId: 'x-6',
    qNum: 11,
    q: "Nilai desimal subnet mask dari prefix CIDR /27 adalah...",
    opts: ["255.255.255.192","255.255.255.240","255.255.255.248","255.255.255.224"],
    ans: 3
  },
  {
    topicId: 'x-6',
    qNum: 12,
    q: "Alamat IP 127.0.0.1 dalam arsitektur TCP/IP secara khusus direservasi dan berfungsi sebagai alamat...",
    opts: ["Default Gateway","Public DNS Server","Loopback Address (Localhost)","DHCP Broadcast Relay"],
    ans: 2
  },
  {
    topicId: 'x-6',
    qNum: 13,
    q: "Teknik membagi satu jaringan besar menjadi beberapa sub-jaringan logis yang lebih kecil dan efisien disebut...",
    opts: ["Routing","Subnetting","Bridging","Switching"],
    ans: 1
  },
  {
    topicId: 'x-6',
    qNum: 14,
    q: "Notasi CIDR singkatan dari...",
    opts: ["Classless Inter-Domain Routing","Computer Interface Data Rate","Central Internet Domain Registry","Classful Internet Digital Relay"],
    ans: 0
  },
  {
    topicId: 'x-6',
    qNum: 15,
    q: "Prefix subnet mask paling efisien yang tepat digunakan untuk menghubungkan link point-to-point antar 2 router saja adalah...",
    opts: ["/28","/29","/32","/30"],
    ans: 3
  },
  // =========================================================================
  // QUIZ 7: KABEL UTP & RJ-45 (x-7) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-7',
    qNum: 1,
    q: "UTP adalah singkatan dari...",
    opts: ["Unshielded Twisted Pair","Universal Twisted Protocol","Unified Transmission Pipe","Universal Terminal Port"],
    ans: 0
  },
  {
    topicId: 'x-7',
    qNum: 2,
    q: "Jumlah total helai kawat tembaga konduktor yang terdapat di dalam sebuah kabel UTP standar adalah...",
    opts: ["4 helai (2 pasang)","6 helai (3 pasang)","10 helai (5 pasang)","8 helai (4 pasang)"],
    ans: 3
  },
  {
    topicId: 'x-7',
    qNum: 3,
    q: "Konektor standar berpin 8 yang digunakan pada ujung kabel jaringan UTP untuk port LAN Ethernet adalah...",
    opts: ["RJ-11","BNC","RJ-45","SC/UPC"],
    ans: 2
  },
  {
    topicId: 'x-7',
    qNum: 4,
    q: "Urutan warna standar kabel UTP untuk standar T568B dari pin 1 hingga pin 8 yang benar adalah...",
    opts: ["Putih Hijau, Hijau, Putih Oranye, Biru, Putih Biru, Oranye, Putih Cokelat, Cokelat","Putih Oranye, Oranye, Putih Hijau, Biru, Putih Biru, Hijau, Putih Cokelat, Cokelat","Putih Biru, Biru, Putih Oranye, Oranye, Putih Hijau, Hijau, Putih Cokelat, Cokelat","Oranye, Putih Oranye, Hijau, Putih Hijau, Biru, Putih Biru, Cokelat, Putih Cokelat"],
    ans: 1
  },
  {
    topicId: 'x-7',
    qNum: 5,
    q: "Urutan warna standar kabel UTP untuk standar T568A dari pin 1 hingga pin 8 yang benar adalah...",
    opts: ["Putih Hijau, Hijau, Putih Oranye, Biru, Putih Biru, Oranye, Putih Cokelat, Cokelat","Putih Oranye, Oranye, Putih Hijau, Biru, Putih Biru, Hijau, Putih Cokelat, Cokelat","Putih Cokelat, Cokelat, Putih Hijau, Hijau, Putih Biru, Biru, Putih Oranye, Oranye","Hijau, Putih Hijau, Oranye, Putih Oranye, Biru, Putih Biru, Cokelat, Putih Cokelat"],
    ans: 0
  },
  {
    topicId: 'x-7',
    qNum: 6,
    q: "Jenis susunan kabel UTP di mana kedua ujungnya menggunakan urutan standar yang sama (misal T568B ke T568B) dinamakan...",
    opts: ["Cross-Over Cable","Rollover Cable","Console Cable","Straight-Through Cable"],
    ans: 3
  },
  {
    topicId: 'x-7',
    qNum: 7,
    q: "Kabel UTP tipe Straight-Through umumnya digunakan untuk menghubungkan dua perangkat yang...",
    opts: ["Sama jenis (misal PC ke PC atau Switch ke Switch)","Menghubungkan konsol ke terminal COM","Berbeda jenis (misal PC ke Switch atau Switch ke Router)","Menghubungkan langsung router ke router tanpa switch"],
    ans: 2
  },
  {
    topicId: 'x-7',
    qNum: 8,
    q: "Jenis susunan kabel UTP di mana satu ujung menggunakan standar T568A dan ujung lainnya T568B dinamakan...",
    opts: ["Straight-Through Cable","Cross-Over Cable","Serial Null Cable","Patch Cord Standar"],
    ans: 1
  },
  {
    topicId: 'x-7',
    qNum: 9,
    q: "Kabel UTP tipe Cross-Over zaman dahulu sebelum era auto-MDIX wajib digunakan untuk menghubungkan dua perangkat yang...",
    opts: ["Sama jenis (seperti PC langsung ke PC atau Switch ke Switch)","Berbeda jenis (PC ke Switch)","PC ke Printer USB","Router ke Modem ADSL"],
    ans: 0
  },
  {
    topicId: 'x-7',
    qNum: 10,
    q: "Alat perkakas tangan khusus yang digunakan untuk mengunci dan mengepress pin kuningan konektor RJ-45 ke kabel UTP adalah...",
    opts: ["Tang Potong Biasa","Obeng Plus Minus","Solder Listrik","Crimping Tool (Tang Crimping)"],
    ans: 3
  },
  {
    topicId: 'x-7',
    qNum: 11,
    q: "Alat uji bertenaga baterai dengan deretan lampu LED indikator 1 s/d 8 yang digunakan untuk memeriksa kontinuitas koneksi kabel UTP adalah...",
    opts: ["Multimeter Analog","Optical Power Meter (OPM)","LAN Cable Tester","Spectrum Analyzer"],
    ans: 2
  },
  {
    topicId: 'x-7',
    qNum: 12,
    q: "Alat kupas jaket pelindung luar kabel UTP tanpa merusak insulasi kawat tembaga di dalamnya adalah...",
    opts: ["Tang Lancip","Wire Stripper / Peeler","Gergaji Mini","Cutter Kasar"],
    ans: 1
  },
  {
    topicId: 'x-7',
    qNum: 13,
    q: "Jarak maksimum transmisi data standar yang direkomendasikan untuk segmen kabel UTP Ethernet (misal Cat5e/Cat6) tanpa penguat sinyal repeater adalah...",
    opts: ["100 meter","10 meter","50 meter","500 meter"],
    ans: 0
  },
  {
    topicId: 'x-7',
    qNum: 14,
    q: "Perbedaan utama antara kabel UTP dan kabel STP (Shielded Twisted Pair) terletak pada...",
    opts: ["Kabel STP memiliki 12 kawat tembaga di dalamnya","Kabel STP menggunakan konektor RJ-11","Kabel STP hanya dapat dialiri arus searah","Kabel STP memiliki lapisan pelindung foil logam aluminium untuk meredam interferensi elektromagnetik (EMI)"],
    ans: 3
  },
  {
    topicId: 'x-7',
    qNum: 15,
    q: "Kategori kabel UTP modern yang mampu mendukung bandwidth transmisi data hingga 1 Gbps (Gigabit Ethernet) dan 10 Gbps pada jarak pendek adalah...",
    opts: ["Cat 3","Cat 5","Cat 6 / Cat 6A","Cat 1"],
    ans: 2
  },
  // =========================================================================
  // QUIZ 8: TOPOLOGI JARINGAN (x-8) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-8',
    qNum: 1,
    q: "Topologi jaringan komputer adalah...",
    opts: ["Jenis sistem operasi yang terpasang pada router","Kapasitas hard disk yang dipasang pada server","Panjang total kabel listrik yang digunakan","Bentuk geometris dan pola interkoneksi struktural antar node/perangkat dalam jaringan"],
    ans: 3
  },
  {
    topicId: 'x-8',
    qNum: 2,
    q: "Topologi jaringan yang menggunakan satu kabel utama tunggal (backbone) di mana semua node terhubung padanya dengan terminator di kedua ujungnya adalah...",
    opts: ["Topologi Star","Topologi Ring","Topologi Bus","Topologi Mesh"],
    ans: 2
  },
  {
    topicId: 'x-8',
    qNum: 3,
    q: "Topologi jaringan paling populer saat ini di mana seluruh perangkat client terhubung memusat ke satu perangkat konsentrator (Switch/Hub) adalah...",
    opts: ["Topologi Ring","Topologi Star (Bintang)","Topologi Bus","Topologi Linier"],
    ans: 1
  },
  {
    topicId: 'x-8',
    qNum: 4,
    q: "Keuntungan utama dari penggunaan Topologi Star dibandingkan Topologi Bus adalah...",
    opts: ["Jika satu kabel client terputus, jaringan komputer client lainnya tetap berfungsi normal","Tidak membutuhkan perangkat Switch sama sekali","Biaya kabel jauh lebih murah daripada topologi bus","Tidak memerlukan kartu jaringan (NIC)"],
    ans: 0
  },
  {
    topicId: 'x-8',
    qNum: 5,
    q: "Topologi jaringan di mana setiap node terhubung ke dua node tetangganya sehingga membentuk jalur lingkaran tertutup searah disebut...",
    opts: ["Topologi Bus","Topologi Star","Topologi Tree","Topologi Ring (Cincin)"],
    ans: 3
  },
  {
    topicId: 'x-8',
    qNum: 6,
    q: "Topologi jaringan di mana setiap komputer terhubung langsung ke seluruh komputer lainnya (point-to-point) sehingga memiliki tingkat redundansi tertinggi adalah...",
    opts: ["Topologi Star","Topologi Bus","Topologi Mesh (Jala)","Topologi Ring"],
    ans: 2
  },
  {
    topicId: 'x-8',
    qNum: 7,
    q: "Rumus untuk menghitung jumlah total link kabel yang dibutuhkan pada Topologi Full Mesh dengan N adalah jumlah komputer adalah...",
    opts: ["N - 1","N * (N - 1) / 2","N * 2","N^2"],
    ans: 1
  },
  {
    topicId: 'x-8',
    qNum: 8,
    q: "Topologi bertingkat yang merupakan kombinasi hierarki antara Topologi Star dengan Topologi Bus atau kumpulan switch bertingkat dinamakan...",
    opts: ["Topologi Tree (Pohon / Hierarki)","Topologi Mesh Penuh","Topologi Ring Murni","Topologi Daisy Chain"],
    ans: 0
  },
  {
    topicId: 'x-8',
    qNum: 9,
    q: "Topologi jaringan yang menggabungkan dua atau lebih bentuk topologi fisik yang berbeda dalam satu infrastruktur disebut...",
    opts: ["Topologi Mesh","Topologi Bus","Topologi Point-to-Point","Topologi Hibrida (Hybrid)"],
    ans: 3
  },
  {
    topicId: 'x-8',
    qNum: 10,
    q: "Kelemahan paling fatal dari Topologi Bus klasik adalah...",
    opts: ["Membutuhkan banyak switch mahal","Instalasi kabel sangat rumit dan tebal","Jika kabel backbone utama terputus di tengah, seluruh jaringan langsung lumpuh total","Sulit dihubungkan ke komputer server"],
    ans: 2
  },
  {
    topicId: 'x-8',
    qNum: 11,
    q: "Kelemahan utama dari Topologi Mesh Penuh (Full Mesh) adalah...",
    opts: ["Sangat mudah terjadi tabrakan data (collision)","Biaya pengadaan kabel dan kartu port jaringan sangat tinggi dan instalasi sangat rumit","Jika satu node mati, seluruh jaringan ikut mati","Kecepatan transfer data sangat lambat"],
    ans: 1
  },
  {
    topicId: 'x-8',
    qNum: 12,
    q: "Perangkat konsentrator yang menjadi titik pusat penghubung kabel pada Topologi Star modern di laboratorium sekolah adalah...",
    opts: ["Switch LAN","Terminator 50 Ohm","Kabel Coaxial","BNC T-Connector"],
    ans: 0
  },
  {
    topicId: 'x-8',
    qNum: 13,
    q: "Perbedaan antara topologi fisik (Physical Topology) dan topologi logika (Logical Topology) adalah...",
    opts: ["Topologi fisik hanya untuk jaringan nirkabel, sedangkan logika untuk kabel","Topologi fisik diatur oleh software, logika diatur oleh hardware","Tidak ada perbedaan sama sekali","Topologi fisik menggambarkan tata letak nyata kabel/perangkat, sedangkan topologi logika menggambarkan bagaimana data mengalir di dalam jaringan"],
    ans: 3
  },
  {
    topicId: 'x-8',
    qNum: 14,
    q: "Pada topologi Ring tradisional, metode kontrol akses media yang digunakan untuk menghindari collision pengiriman data adalah...",
    opts: ["CSMA/CD","Broadcast Polling","Token Passing","Random Access"],
    ans: 2
  },
  {
    topicId: 'x-8',
    qNum: 15,
    q: "Topologi yang paling efisien, mudah dikembangkan (scalable), dan paling banyak diimplementasikan pada gedung perkantoran modern saat ini adalah...",
    opts: ["Topologi Bus Tunggal","Topologi Extended Star / Tree","Topologi Ring Murni","Topologi Point-to-Point Tunggal"],
    ans: 1
  },
  // =========================================================================
  // QUIZ 9: KONFIGURASI JARINGAN (x-9) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-9',
    qNum: 1,
    q: "Pengaturan IP Address di mana administrator menetapkan nomor IP, netmask, dan gateway secara manual pada pengaturan adapter client disebut...",
    opts: ["Dynamic IP Configuration (DHCP)","APIPA (Automatic Private IP)","Static IP Configuration","Loopback Assignment"],
    ans: 2
  },
  {
    topicId: 'x-9',
    qNum: 2,
    q: "Pengaturan IP Address di mana komputer client secara otomatis meminta dan mendapatkan alamat IP dari server di jaringan disebut...",
    opts: ["Static IP","Dynamic IP (DHCP Client)","Manual IP","Fixed IP"],
    ans: 1
  },
  {
    topicId: 'x-9',
    qNum: 3,
    q: "Fungsi dari Default Gateway yang dikonfigurasi pada komputer client adalah...",
    opts: ["Alamat IP router yang menjadi pintu keluar paket data menuju jaringan/subnet lain atau internet","Alamat server untuk memutar video YouTube","Alamat fisik dari kartu grafis komputer","Alamat port printer di jaringan lokal"],
    ans: 0
  },
  {
    topicId: 'x-9',
    qNum: 4,
    q: "Jika pada sistem Windows adapter jaringan diatur \"Obtain an IP address automatically\" namun DHCP Server mati, Windows akan memberikan alamat IP sementara berawalan 169.254.x.x yang dikenal sebagai...",
    opts: ["Public Static IP","Multicast IP","Loopback Local","APIPA (Automatic Private IP Addressing)"],
    ans: 3
  },
  {
    topicId: 'x-9',
    qNum: 5,
    q: "Layanan DNS Server publik milik Google yang sangat populer dan sering dikonfigurasi pada adapter jaringan adalah...",
    opts: ["1.1.1.1 dan 1.0.0.1","208.67.222.222","8.8.8.8 dan 8.8.4.4","192.168.1.1"],
    ans: 2
  },
  {
    topicId: 'x-9',
    qNum: 6,
    q: "File Sharing pada jaringan lokal Windows memungkinkan beberapa komputer untuk...",
    opts: ["Menambah kapasitas memori RAM komputer lain","Saling berbagi akses membaca atau menulis folder dokumen melalui jaringan","Mengganti password administrator secara otomatis","Menggandakan kecepatan processor client"],
    ans: 1
  },
  {
    topicId: 'x-9',
    qNum: 7,
    q: "Fitur keamanan bawaan sistem operasi Windows yang bertugas menyaring, mengizinkan, atau memblokir lalu lintas port jaringan yang masuk dan keluar adalah...",
    opts: ["Windows Defender Firewall","Device Manager","Disk Management","Event Viewer"],
    ans: 0
  },
  {
    topicId: 'x-9',
    qNum: 8,
    q: "Untuk menghubungkan komputer ke jaringan Wi-Fi, parameter nama identitas sinyal nirkabel yang harus dipilih dinamakan...",
    opts: ["BSSID MAC","WPA3 Hash","WEP Key","SSID (Service Set Identifier)"],
    ans: 3
  },
  {
    topicId: 'x-9',
    qNum: 9,
    q: "Protokol keamanan nirkabel modern yang paling aman dan direkomendasikan saat mengkonfigurasi Access Point Wi-Fi adalah...",
    opts: ["WEP (Wired Equivalent Privacy)","Open Network Tanpa Enkripsi","WPA2-PSK / WPA3-Personal","WPS PIN Standar"],
    ans: 2
  },
  {
    topicId: 'x-9',
    qNum: 10,
    q: "Alamat IP default yang paling sering digunakan pada router rumahan / modem ISP (seperti ZTE atau Huawei) saat pertama kali dikonfigurasi melalui browser adalah...",
    opts: ["10.10.10.1","192.168.1.1 atau 192.168.0.1","172.31.255.254","127.0.0.1"],
    ans: 1
  },
  {
    topicId: 'x-9',
    qNum: 11,
    q: "Untuk membagikan koneksi internet dari satu komputer yang memiliki dua adapter ke komputer lain pada Windows dapat memanfaatkan fitur bawaan...",
    opts: ["Internet Connection Sharing (ICS)","Remote Desktop Protocol","BitLocker Drive","DirectX Network"],
    ans: 0
  },
  {
    topicId: 'x-9',
    qNum: 12,
    q: "Grup kerja logis standar pada sistem operasi Windows yang memudahkan penemuan komputer lain di satu jaringan lokal dinamakan...",
    opts: ["DOMAIN-SERVER","HOMENET","LOCALNET","WORKGROUP"],
    ans: 3
  },
  {
    topicId: 'x-9',
    qNum: 13,
    q: "Jika dua komputer dalam satu jaringan lokal diberikan IP Address yang persis sama, masalah yang akan terjadi adalah...",
    opts: ["Koneksi internet menjadi dua kali lebih cepat","Data kedua komputer otomatis bergabung","IP Conflict (terjadi benturan IP sehingga salah satu atau kedua perangkat tidak bisa berkomunikasi)","Komputer langsung mati seketika"],
    ans: 2
  },
  {
    topicId: 'x-9',
    qNum: 14,
    q: "Fitur pada Access Point yang membatasi perangkat mana saja yang boleh terhubung berdasarkan alamat fisik perangkatnya disebut...",
    opts: ["IP Static Mapping","MAC Address Filtering","Port Forwarding","DMZ Host"],
    ans: 1
  },
  {
    topicId: 'x-9',
    qNum: 15,
    q: "Fasilitas pada sistem operasi Windows yang memungkinkan kita mengendalikan desktop komputer lain dari jarak jauh melalui jaringan adalah...",
    opts: ["Remote Desktop Connection (RDC)","Snipping Tool","Hyper-V Manager","Paint 3D"],
    ans: 0
  },
  // =========================================================================
  // QUIZ 10: TOOLS JARINGAN (x-10) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-10',
    qNum: 1,
    q: "Perintah command line (CLI) pada Windows yang digunakan untuk menguji konektivitas dan mengukur waktu respon (latency) ke alamat host tujuan adalah...",
    opts: ["ipconfig","ping","netstat","tracert"],
    ans: 1
  },
  {
    topicId: 'x-10',
    qNum: 2,
    q: "Perintah CLI pada Windows yang digunakan untuk melihat konfigurasi IP Address, Subnet Mask, dan Default Gateway pada seluruh adapter jaringan adalah...",
    opts: ["ipconfig","ifconfig","ping","route print"],
    ans: 0
  },
  {
    topicId: 'x-10',
    qNum: 3,
    q: "Opsi parameter pada perintah Windows untuk menampilkan informasi konfigurasi jaringan secara detail lengkap beserta MAC Address dan DHCP Server adalah...",
    opts: ["ipconfig /renew","ipconfig /release","ipconfig /flushdns","ipconfig /all"],
    ans: 3
  },
  {
    topicId: 'x-10',
    qNum: 4,
    q: "Perintah CLI yang digunakan untuk melacak rute (hops) lompatan router yang dilalui paket data dari komputer kita menuju server tujuan di internet adalah...",
    opts: ["ping -t","nslookup","tracert (Windows) / traceroute (Linux)","netstat -a"],
    ans: 2
  },
  {
    topicId: 'x-10',
    qNum: 5,
    q: "Perintah CLI yang digunakan untuk melakukan query DNS guna mengetahui IP Address dari suatu nama domain (atau sebaliknya) adalah...",
    opts: ["ipconfig","nslookup","getmac","arp -a"],
    ans: 1
  },
  {
    topicId: 'x-10',
    qNum: 6,
    q: "Perintah CLI yang digunakan untuk melihat daftar tabel pemetaan antara IP Address dan MAC Address perangkat di jaringan lokal adalah...",
    opts: ["arp -a","netstat","route print","hostname"],
    ans: 0
  },
  {
    topicId: 'x-10',
    qNum: 7,
    q: "Perintah CLI yang digunakan untuk melihat status koneksi jaringan aktif, port yang sedang terbuka (listening), dan tabel routing sistem adalah...",
    opts: ["tasklist","chkdsk","sfc /scannow","netstat"],
    ans: 3
  },
  {
    topicId: 'x-10',
    qNum: 8,
    q: "Aplikasi network packet analyzer open-source populer yang digunakan untuk menangkap (capture) dan menganalisis paket data jaringan secara real-time adalah...",
    opts: ["WinRAR","VLC Player","Wireshark","Notepad++"],
    ans: 2
  },
  {
    topicId: 'x-10',
    qNum: 9,
    q: "Aplikasi simulator jaringan interaktif yang dikembangkan oleh Cisco untuk mendesain dan menguji konfigurasi topologi jaringan secara virtual adalah...",
    opts: ["VirtualBox","Cisco Packet Tracer","PuTTY","FileZilla"],
    ans: 1
  },
  {
    topicId: 'x-10',
    qNum: 10,
    q: "Aplikasi remote client SSH dan Telnet gratis yang sangat ringan dan sering digunakan untuk meremote terminal server Linux atau router adalah...",
    opts: ["PuTTY","Winbox","Rufus","BalenaEtcher"],
    ans: 0
  },
  {
    topicId: 'x-10',
    qNum: 11,
    q: "Aplikasi utilitas GUI resmi yang digunakan khusus untuk mengkonfigurasi dan memanajemen router MikroTik RouterOS secara visual adalah...",
    opts: ["PuTTY","Packet Tracer","Wireshark","Winbox"],
    ans: 3
  },
  {
    topicId: 'x-10',
    qNum: 12,
    q: "Perintah CLI pada Windows yang digunakan untuk menghapus cache rekaman DNS lokal yang tersimpan agar mengambil IP DNS terbaru adalah...",
    opts: ["ipconfig /release","ipconfig /renew","ipconfig /flushdns","ping -flush"],
    ans: 2
  },
  {
    topicId: 'x-10',
    qNum: 13,
    q: "Pesan balasan ping \"Request Timed Out (RTO)\" menunjukkan bahwa...",
    opts: ["Kabel LAN terputus secara fisik dari komputer lokal","Komputer pengirim tidak menerima paket balasan (echo reply) dari host tujuan dalam batas waktu tertentu","Alamat IP tujuan sama dengan alamat IP lokal","Kecepatan internet sedang sangat cepat"],
    ans: 1
  },
  {
    topicId: 'x-10',
    qNum: 14,
    q: "Pesan balasan ping \"Destination Host Unreachable\" umumnya menandakan bahwa...",
    opts: ["Router tidak menemukan rute (jalur) yang valid untuk mencapai alamat subnet tujuan","Website sedang memutar video","Komputer lokal tidak memiliki RAM","Password komputer salah"],
    ans: 0
  },
  {
    topicId: 'x-10',
    qNum: 15,
    q: "Perintah pada terminal Linux yang memiliki fungsi serupa dengan \"ipconfig\" pada Windows untuk melihat IP interface adalah...",
    opts: ["show-ip","netinfo","traceroute","ip addr show atau ifconfig"],
    ans: 3
  },
  // =========================================================================
  // QUIZ 11: PERAKITAN KOMPUTER (x-11) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-11',
    qNum: 1,
    q: "Langkah pertama yang paling awal dilakukan sebelum memasang motherboard ke dalam casing komputer saat merakit PC adalah...",
    opts: ["Memasang CPU Prosesor, Thermal Paste, dan Heatsink/Cooler pada socket motherboard di luar casing","Memasang monitor dan keyboard terlebih dahulu","Mencolokkan kabel power ke stopkontak PLN","Menginstal sistem operasi Windows"],
    ans: 0
  },
  {
    topicId: 'x-11',
    qNum: 2,
    q: "Konektor daya utama dari Power Supply yang dihubungkan ke motherboard modern umumnya memiliki pin berjumlah...",
    opts: ["4-Pin Molex","15-Pin SATA Power","6-Pin PCIe","24-Pin ATX Power Connector"],
    ans: 3
  },
  {
    topicId: 'x-11',
    qNum: 3,
    q: "Konektor daya tambahan dari Power Supply yang wajib dipasang khusus untuk menyuplai daya ke prosesor (CPU) adalah...",
    opts: ["24-Pin Main Power","SATA Power Connector","4-Pin / 8-Pin ATX 12V EPS Connector","Floppy Drive Connector"],
    ans: 2
  },
  {
    topicId: 'x-11',
    qNum: 4,
    q: "Baut penyangga berbahan kuningan yang dipasang di antara plat casing dan motherboard untuk mencegah korsleting listrik dinamakan...",
    opts: ["Baut Fan Casing","Standoff Screw (Baut Spacer)","Thumb Screw","Jumper Header"],
    ans: 1
  },
  {
    topicId: 'x-11',
    qNum: 5,
    q: "Pelat logam tipis berlubang yang dipasang pada bagian belakang casing sebelum motherboard ditaruh untuk melindungi port I/O motherboard disebut...",
    opts: ["I/O Shield Backplate","Expansion Slot Cover","Dust Filter Casing","Drive Bay Bracket"],
    ans: 0
  },
  {
    topicId: 'x-11',
    qNum: 6,
    q: "Pin header pada motherboard tempat menghubungkan tombol Power On, tombol Reset, LED Power, dan LED HDD pada casing disebut...",
    opts: ["Audio Header (AAFP)","USB 3.0 Header","RGB Header 12V","Front Panel Header (F_PANEL)"],
    ans: 3
  },
  {
    topicId: 'x-11',
    qNum: 7,
    q: "Proses diagnosa mandiri yang dilakukan BIOS/UEFI saat pertama kali komputer dinyalakan untuk memeriksa kesiapan hardware dasar adalah...",
    opts: ["Formatting System","Overclocking Scan","POST (Power-On Self-Test)","Defragmentation"],
    ans: 2
  },
  {
    topicId: 'x-11',
    qNum: 8,
    q: "Bunyi \"Beep\" 1 kali pendek bernada normal saat komputer pertama kali dinyalakan menandakan bahwa...",
    opts: ["RAM mengalami kerusakan total","Sistem berhasil melewati proses POST tanpa adanya kesalahan hardware","VGA Card tidak terdeteksi","Kabel monitor terputus"],
    ans: 1
  },
  {
    topicId: 'x-11',
    qNum: 9,
    q: "Tanda segitiga kecil emas pada salah satu sudut prosesor dan socket motherboard berfungsi sebagai...",
    opts: ["Penanda orientasi posisi (alignment) agar prosesor tidak dipasang terbalik","Hiasan estetika pabrik","Penunjuk kutub positif daya","Jalur pendingin khusus"],
    ans: 0
  },
  {
    topicId: 'x-11',
    qNum: 10,
    q: "Alat pelindung diri (APD) yang dipakai teknisi pada pergelangan tangan untuk membuang muatan listrik statis tubuh ke ground saat merakit PC adalah...",
    opts: ["Sarung Tangan Karet Tebal","Masker Debu","Sepatu Boot Karet","Gelang Antistatis (Anti-Static Wrist Strap)"],
    ans: 3
  },
  {
    topicId: 'x-11',
    qNum: 11,
    q: "Socket prosesor tipe LGA (Land Grid Array) memiliki ciri fisik di mana pin-pin konektor logam berada pada...",
    opts: ["Bagian bawah prosesor, sedangkan socket berupa lubang","Kabel Power Supply","Motherboard (socket), sedangkan bagian bawah prosesor berupa titik kontak datar","Modul keping RAM"],
    ans: 2
  },
  {
    topicId: 'x-11',
    qNum: 12,
    q: "Kabel data bertransmisi 6 Gbps yang menghubungkan storage SATA HDD/SSD 2.5 inci ke port motherboard adalah...",
    opts: ["Kabel IDE PATA","Kabel Data SATA","Kabel SAS","Kabel Molex"],
    ans: 1
  },
  {
    topicId: 'x-11',
    qNum: 13,
    q: "Jika RAM dipasang pada motherboard dengan konfigurasi Dual Channel, keping RAM sebaiknya dipasang pada slot...",
    opts: ["Slot dengan warna yang sama / slot 2 dan 4 (A2 & B2)","Slot bebas sembarangan","Slot 1 saja tanpa pasangan","Slot PCIe grafis"],
    ans: 0
  },
  {
    topicId: 'x-11',
    qNum: 14,
    q: "Baterai kancing lithium bulat tipe CR2032 yang terpasang pada motherboard berfungsi untuk...",
    opts: ["Menghidupkan kipas prosesor","Menyuplai arus ke monitor","Mengisi daya baterai laptop","Menyuplai daya ke chip CMOS agar setelan BIOS, jam, dan tanggal sistem tetap tersimpan saat listrik mati"],
    ans: 3
  },
  {
    topicId: 'x-11',
    qNum: 15,
    q: "Urutan pengetesan rakitan PC minimal (Test Bench) sebelum dimasukkan ke dalam casing melibatkan komponen dasar yaitu...",
    opts: ["Casing, Harddisk 5 buah, DVD ROM, Speaker","Keyboard, Mouse, Printer, Scanner saja","Motherboard, CPU + Cooler, 1 Keping RAM, Power Supply, dan Display Output","Hanya Power Supply dan Kipas Casing"],
    ans: 2
  },
  // =========================================================================
  // QUIZ 12: TROUBLESHOOTING (x-12) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-12',
    qNum: 1,
    q: "Ketika tombol power ditekan, lampu LED casing menyala, kipas CPU berputar kencang, namun layar monitor gelap total (No Display), langkah awal yang tepat adalah...",
    opts: ["Langsung membuang motherboard ke tempat sampah","Membeli harddisk baru berkapasitas lebih besar","Mengganti kabel keyboard","Melepas, membersihkan pin tembaga RAM dengan penghapus karet bersih, lalu memasangnya kembali dengan rapat"],
    ans: 3
  },
  {
    topicId: 'x-12',
    qNum: 2,
    q: "Jika komputer sering tiba-tiba mati sendiri (shutdown mendadak) setelah dipakai bermain game berat selama 15 menit, penyebab paling umum adalah...",
    opts: ["Kapasitas keyboard penuh","Mouse tidak memiliki sensor laser","Overheating (prosesor atau GPU mengalami panas berlebih akibat pasta kering atau fan macet)","Kabel LAN terlepas"],
    ans: 2
  },
  {
    topicId: 'x-12',
    qNum: 3,
    q: "Layar biru berisi pesan kesalahan kritis pada sistem Windows yang memaksa komputer restart otomatis dikenal dengan istilah...",
    opts: ["Black Screen of Doom","BSOD (Blue Screen of Death)","Kernel Panic Error","Dead Lock Screen"],
    ans: 1
  },
  {
    topicId: 'x-12',
    qNum: 4,
    q: "Jika setiap kali komputer dinyalakan jam dan tanggal selalu kembali ke tahun lampau (misal 1 Januari 2000), tindakan solusinya adalah...",
    opts: ["Mengganti baterai CMOS (CR2032) pada motherboard dengan yang baru","Menginstal ulang Windows 11","Menambah kapasitas RAM","Mengganti monitor LCD"],
    ans: 0
  },
  {
    topicId: 'x-12',
    qNum: 5,
    q: "Pesan kesalahan BIOS \"Hard Disk Not Detected\" atau \"No Bootable Device Found\" dapat disebabkan oleh...",
    opts: ["Driver printer belum diinstal","Resolusi layar monitor terlalu tinggi","Kipas casing berputar terlalu kencang","Kabel data SATA / power SATA harddisk kendor atau harddisk mengalami kerusakan fisik/bad sector"],
    ans: 3
  },
  {
    topicId: 'x-12',
    qNum: 6,
    q: "Jika monitor menampilkan garis-garis aneh, warna pecah (artifact), atau kedip-kedip saat membuka aplikasi 3D, komponen yang dicurigai bermasalah adalah...",
    opts: ["Sound Card internal","Kabel power supply CPU 8-pin","VGA Card / GPU atau driver grafis yang corrupt","Optical drive CD-ROM"],
    ans: 2
  },
  {
    topicId: 'x-12',
    qNum: 7,
    q: "Mode diagnosis khusus pada Windows yang menjalankan sistem hanya dengan driver dan layanan paling minimal untuk mempermudah perbaikan disebut...",
    opts: ["Fast Startup Mode","Safe Mode","Gaming Mode","Sleep Mode"],
    ans: 1
  },
  {
    topicId: 'x-12',
    qNum: 8,
    q: "Perintah command prompt (CMD) bawaan Windows yang berfungsi memindai dan memperbaiki file sistem Windows yang rusak atau korup adalah...",
    opts: ["sfc /scannow","chkdsk /f","format c:","ipconfig /all"],
    ans: 0
  },
  {
    topicId: 'x-12',
    qNum: 9,
    q: "Jika komputer menyala tetapi mengeluarkan bunyi beep berulang-ulang panjang tanpa henti, kode beep tersebut umumnya mengindikasikan masalah pada...",
    opts: ["Keyboard tidak terdeteksi","Kipas casing mati","Speaker audio rusak","Modul RAM tidak terpasang sempurna atau rusak"],
    ans: 3
  },
  {
    topicId: 'x-12',
    qNum: 10,
    q: "Gejala harddisk mekanik (HDD) yang berbunyi ketukan logam keras \"clicking noise\" menandakan bahwa...",
    opts: ["Harddisk sedang melakukan defragmentasi normal","Kapasitas harddisk masih sangat kosong","Head mekanik harddisk mengalami kerusakan fisik parah dan data harus segera diselamatkan (backup)","Kabel LAN sedang mentransfer data cepat"],
    ans: 2
  },
  {
    topicId: 'x-12',
    qNum: 11,
    q: "Untuk mengembalikan pengaturan BIOS/UEFI ke setelan default pabrik ketika sistem gagal boot akibat salah konfigurasi, kita dapat melakukan...",
    opts: ["Memformat harddisk Windows","Clear CMOS (melepas baterai CMOS atau menjumper pin CLRTC selama 10 detik)","Melepas kabel VGA","Menekan tombol restart 10 kali"],
    ans: 1
  },
  {
    topicId: 'x-12',
    qNum: 12,
    q: "Jika sebuah laptop tidak bisa mengisi daya baterai meskipun adaptor charger dicolokkan ke listrik, komponen pertama yang harus diperiksa dengan multimeter adalah...",
    opts: ["Tegangan output adaptor charger dan kondisi jack konektor DC","Kamera webcam laptop","Kapasitas touchpad","Tombol keyboard spacebar"],
    ans: 0
  },
  {
    topicId: 'x-12',
    qNum: 13,
    q: "Penyebab utama komputer menjadi sangat lambat saat membuka aplikasi multitasking dan respon harddisk 100% di Task Manager adalah...",
    opts: ["Resolusi layar monitor terlalu kecil","Kabel mouse terlalu panjang","Warna casing komputer terlalu gelap","Kapasitas RAM tidak mencukupi sehingga sistem mengandalkan virtual memory di harddisk yang lambat"],
    ans: 3
  },
  {
    topicId: 'x-12',
    qNum: 14,
    q: "Alat diagnostik kartu PCI/PCIe yang memiliki display 2 digit hexadecimal untuk membaca kode error motherboard saat proses POST dinamakan...",
    opts: ["LAN Tester","Crimping Tool","POST Card Diagnostic Analyzer","Tone Generator"],
    ans: 2
  },
  {
    topicId: 'x-12',
    qNum: 15,
    q: "Jika ikon koneksi jaringan di taskbar Windows bertanda silang merah (Red Cross), artinya adalah...",
    opts: ["Internet sedang lambat","Kabel jaringan fisik tidak terhubung atau adapter jaringan dinonaktifkan (disabled)","Password Wi-Fi salah","DNS Server penuh"],
    ans: 1
  },
  // =========================================================================
  // QUIZ 13: K3 (x-13) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-13',
    qNum: 1,
    q: "Kepanjangan dari K3LH dalam lingkungan pendidikan kejuruan dan industri adalah...",
    opts: ["Kerapian, Kebersihan, Keindahan Lingkungan Halaman","Ketertiban, Keamanan, Kelancaran Lalu Lintas Harian","Kesehatan, Keselamatan Kerja dan Lingkungan Hidup","Keterampilan, Kreativitas, Kualitas Laboratorium Komputer"],
    ans: 2
  },
  {
    topicId: 'x-13',
    qNum: 2,
    q: "Tujuan utama dari penerapan K3LH di laboratorium perakitan komputer dan jaringan adalah...",
    opts: ["Mempersulit siswa dalam melakukan praktikum perakitan","Mencegah kecelakaan kerja, melindungi praktikan dari bahaya listrik/fisik, serta menjaga keawetan peralatan","Menambah anggaran pengadaan alat laboratorium","Mempercepat habisnya masa pakai komputer"],
    ans: 1
  },
  {
    topicId: 'x-13',
    qNum: 3,
    q: "Sebelum membuka casing komputer atau membongkar power supply, tindakan keselamatan listrik yang mutlak wajib dilakukan adalah...",
    opts: ["Mencabut kabel power dari stopkontak listrik PLN dan menekan tombol power beberapa detik untuk membuang sisa arus kapasitor","Menyiram casing dengan cairan pembersih","Membiarkan kabel listrik tetap tercolok agar komponen tetap hangat","Menggunakan obeng tanpa isolator"],
    ans: 0
  },
  {
    topicId: 'x-13',
    qNum: 4,
    q: "Jarak pandang ideal yang direkomendasikan antara mata dengan layar monitor komputer saat bekerja agar tidak cepat lelah adalah...",
    opts: ["10 – 20 cm","100 – 150 cm","Kurang dari 15 cm","45 – 70 cm (kira-kira sepanjang rentangan satu lengan)"],
    ans: 3
  },
  {
    topicId: 'x-13',
    qNum: 5,
    q: "Posisi duduk yang ergonomis di depan komputer mengharuskan posisi punggung berada dalam sudut...",
    opts: ["Membungkuk ke depan sedekat mungkin dengan layar","Miring ke samping kanan bersandar pada meja","Tegak dan bersandar nyaman sekitar 90° – 100° dengan kaki menapak rata di lantai","Setengah berbaring di kursi"],
    ans: 2
  },
  {
    topicId: 'x-13',
    qNum: 6,
    q: "Jenis alat pemadam api ringan (APAR) yang paling aman dan tepat digunakan untuk memadamkan kebakaran akibat korsleting listrik pada perangkat komputer adalah...",
    opts: ["Air Bertekanan Tinggi","APAR Karbon Dioksida (CO2) atau Clean Agent Gas","Busa Basah (Foam)","Minyak Tanah"],
    ans: 1
  },
  {
    topicId: 'x-13',
    qNum: 7,
    q: "Bahaya utama dari menumpuk terlalu banyak steker listrik pada satu stopkontak (overload T-plug) di laboratorium adalah...",
    opts: ["Dapat menimbulkan panas berlebih (overheat), percikan api, dan resiko kebakaran korsleting listrik","Komputer menjadi lebih cepat kinerjanya","Tagihan listrik menjadi lebih murah","Tegangan listrik otomatis naik dua kali lipat"],
    ans: 0
  },
  {
    topicId: 'x-13',
    qNum: 8,
    q: "Aturan 20-20-20 dalam ergonomi penggunaan komputer bertujuan untuk mengistirahatkan mata, yaitu...",
    opts: ["Bekerja 20 jam tanpa henti lalu istirahat 20 menit","Mengedipkan mata 20 kali setiap 20 detik","Menyetel kecerahan monitor pada angka 20%","Setiap 20 menit bekerja di depan layar, alihkan pandangan melihat objek berjarak 20 kaki (6 meter) selama 20 detik"],
    ans: 3
  },
  {
    topicId: 'x-13',
    qNum: 9,
    q: "Saat bekerja di ketinggian (misal memasang antena wireless outdoor atau kabel jaringan di plafon), alat pelindung diri wajib yang harus digunakan adalah...",
    opts: ["Jas Hujan dan Sandal Jepit","Kacamata Hitam biasa","Safety Helmet, Full Body Harness / Safety Belt, dan Sepatu Safety Anti-Slip","Sarung Tangan Kain Tipis saja"],
    ans: 2
  },
  {
    topicId: 'x-13',
    qNum: 10,
    q: "Limbah elektronik komputer seperti motherboard rusak, baterai CMOS bekas, dan tabung monitor tergolong ke dalam jenis limbah...",
    opts: ["Limbah Organik Rumah Tangga","Limbah B3 (Bahan Berbahaya dan Beracun)","Limbah Kompos Basah","Limbah Daur Ulang Alami"],
    ans: 1
  },
  {
    topicId: 'x-13',
    qNum: 11,
    q: "Mengapa kita dilarang membawa makanan dan minuman terbuka ke dalam ruangan laboratorium komputer?",
    opts: ["Tumpahan cairan dapat mengenai stopkontak atau casing dan menimbulkan korsleting listrik serta remah makanan dapat merusak sela-sela keyboard","Makanan dapat menyerap sinyal Wi-Fi","Dapat menurunkan kecepatan clock prosesor","Monitor komputer tidak tahan aroma makanan"],
    ans: 0
  },
  {
    topicId: 'x-13',
    qNum: 12,
    q: "Kabel instalasi jaringan yang melintang di lantai ruangan tanpa pelindung ducting/protector sangat berbahaya karena...",
    opts: ["Mengurangi kecepatan internet secara drastis","Membuat komputer mati seketika","Menyebabkan kabel berubah warna","Dapat menyebabkan orang tersandung jatuh dan kabel mudah terkelupas terinjak"],
    ans: 3
  },
  {
    topicId: 'x-13',
    qNum: 13,
    q: "Ventilasi udara dan sirkulasi pendingin (AC) yang baik di ruang server/laboratorium sangat penting karena...",
    opts: ["Agar kabel jaringan tidak membeku","Mencegah virus software masuk ke komputer","Menjaga suhu operasional perangkat tetap dingin agar terhindar dari panas berlebih yang merusak komponen elektronik","Membuat layar monitor tampak lebih jernih"],
    ans: 2
  },
  {
    topicId: 'x-13',
    qNum: 14,
    q: "Saat memotong kabel UTP atau mengupas kabel, arah mata pisau pemotong sebaiknya...",
    opts: ["Mengarah lurus ke arah dada praktikan","Mengarah menjauhi tubuh dan jari tangan praktikan","Ditekan menggunakan telapak tangan langsung","Dilakukan dengan mata tertutup"],
    ans: 1
  },
  {
    topicId: 'x-13',
    qNum: 15,
    q: "Simbol tanda bahaya berwarna kuning dengan gambar segitiga dan kilat petir di laboratorium mengindikasikan adanya...",
    opts: ["Bahaya Tegangan Listrik Tinggi (High Voltage Hazard)","Area Dilarang Merokok","Bahaya Bahan Kimia Korosif","Area Jalur Evakuasi"],
    ans: 0
  },
  // =========================================================================
  // QUIZ 14: ETIKA & KEAMANAN DIGITAL (x-14) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-14',
    qNum: 1,
    q: "Metode kejahatan siber di mana penipu menyamar sebagai lembaga resmi melalui email atau tautan web palsu untuk mencuri data rahasia seperti username, password, dan PIN dinamakan...",
    opts: ["Defacing","Phishing","Overclocking","Subnetting"],
    ans: 1
  },
  {
    topicId: 'x-14',
    qNum: 2,
    q: "Jenis malware berbahaya yang mengenkripsi (mengunci) file penting korban dan menuntut tebusan uang untuk kunci dekripsi disebut...",
    opts: ["Ransomware","Adware","Freeware","Spyware"],
    ans: 0
  },
  {
    topicId: 'x-14',
    qNum: 3,
    q: "Sistem keamanan akun yang mewajibkan dua lapis verifikasi identitas (misal password ditambah kode OTP via SMS/Aplikasi Authenticator) dinamakan...",
    opts: ["Single Sign-On (SSO)","Plaintext Login","CAPTCHA Security","2FA (Two-Factor Authentication) / MFA"],
    ans: 3
  },
  {
    topicId: 'x-14',
    qNum: 4,
    q: "Manakah di bawah ini yang merupakan contoh kata sandi (password) yang paling kuat dan aman dari serangan brute-force?",
    opts: ["12345678","namasaya123","P@ssw0rd#SmkMu2026!","adminadmin"],
    ans: 2
  },
  {
    topicId: 'x-14',
    qNum: 5,
    q: "Undang-Undang di Indonesia yang secara khusus mengatur tentang transaksi elektronik, etika bermedia digital, dan tindak pidana siber adalah...",
    opts: ["UU Ketenagakerjaan","UU ITE (Informasi dan Transaksi Elektronik)","UU Hak Cipta Musik","UU Perpajakan"],
    ans: 1
  },
  {
    topicId: 'x-14',
    qNum: 6,
    q: "Tindakan menyebarkan informasi palsu, fitnah, kebencian, atau merundung orang lain secara online di media sosial dikenal sebagai...",
    opts: ["Cyberbullying & Hoax","Cyber Defense","Ethical Hacking","Digital Marketing"],
    ans: 0
  },
  {
    topicId: 'x-14',
    qNum: 7,
    q: "Teknik manipulasi psikologis manusia untuk membujuk korban agar memberikan informasi rahasia atau membuka akses sistem disebut...",
    opts: ["Buffer Overflow","SQL Injection","Man in the Middle","Social Engineering (Rekayasa Sosial)"],
    ans: 3
  },
  {
    topicId: 'x-14',
    qNum: 8,
    q: "Program tersembunyi yang merekam setiap ketukan tombol keyboard pengguna tanpa izin untuk mencuri kata sandi yang diketik dinamakan...",
    opts: ["Screen Saver","Task Scheduler","Keylogger","Text Editor"],
    ans: 2
  },
  {
    topicId: 'x-14',
    qNum: 9,
    q: "Mengapa sangat berbahaya melakukan transaksi perbankan atau login akun penting saat terhubung ke jaringan Wi-Fi publik tanpa proteksi password di tempat umum?",
    opts: ["Dapat membuat kuota HP pribadi langsung habis","Lalu lintas data dapat disadap (eavesdropping/packet sniffing) oleh pihak ketiga yang berada di satu jaringan nirkabel yang sama","Dapat merusak layar monitor smartphone","Wi-Fi publik otomatis mematikan daya baterai"],
    ans: 1
  },
  {
    topicId: 'x-14',
    qNum: 10,
    q: "Jejak digital (digital footprint) adalah...",
    opts: ["Rekam jejak seluruh riwayat aktivitas, postingan, pencarian, dan data yang ditinggalkan pengguna saat beraktivitas di internet","Koleksi foto di dalam memory card","Ukuran fisik kartu SIM card","Sertifikat kelulusan sekolah"],
    ans: 0
  },
  {
    topicId: 'x-14',
    qNum: 11,
    q: "Indikator gembok terkunci pada bilah alamat web browser dan awalan protokol \"https://\" menandakan bahwa...",
    opts: ["Website tersebut bebas dari iklan sama sekali","Website milik pemerintah resmi","Website tidak memerlukan koneksi internet","Komunikasi data antara browser dan server telah dienkripsi menggunakan sertifikat SSL/TLS"],
    ans: 3
  },
  {
    topicId: 'x-14',
    qNum: 12,
    q: "Tindakan mengunduh, menyebarluaskan, atau menggunakan perangkat lunak bajakan (crack/keygen) tanpa lisensi resmi melanggar etika dan beresiko...",
    opts: ["Mendapatkan update resmi gratis selamanya","Meningkatkan kecepatan komputer","Melanggar Hak Kekayaan Intelektual (HAKI) dan rentan disusupi trojan/backdoor malware di dalam file patch bajakan","Mencegah harddisk terkena bad sector"],
    ans: 2
  },
  {
    topicId: 'x-14',
    qNum: 13,
    q: "Serangan siber yang membanjiri server dengan jutaan paket lalu lintas sampah secara serentak dari banyak komputer zombie (botnet) hingga server tumbang dinamakan...",
    opts: ["Phishing Attack","DDoS (Distributed Denial of Service) Attack","Brute Force Attack","XSS Attack"],
    ans: 1
  },
  {
    topicId: 'x-14',
    qNum: 14,
    q: "Peretas yang menggunakan keahliannya untuk menguji keamanan sistem, menemukan celah kerentanan, dan melaporkannya secara legal untuk diperbaiki disebut...",
    opts: ["White Hat Hacker (Ethical Hacker)","Black Hat Hacker (Cracker)","Script Kiddie","Cyber Terrorist"],
    ans: 0
  },
  {
    topicId: 'x-14',
    qNum: 15,
    q: "Tindakan pengamanan data dengan cara mengubah teks asli (plaintext) menjadi teks sandi acak yang tidak terbaca (ciphertext) menggunakan kunci algoritma disebut...",
    opts: ["Kompresi (Compression)","Defragmentasi","Partisi","Enkripsi (Encryption)"],
    ans: 3
  },
  // =========================================================================
  // QUIZ 15: VIRTUALISASI & PROYEK JARINGAN (x-15) - 15 SOAL
  // =========================================================================
  {
    topicId: 'x-15',
    qNum: 1,
    q: "Teknologi yang memungkinkan satu komputer fisik (Host) menjalankan beberapa sistem operasi virtual (Guest OS) secara bersamaan dan terisolasi dinamakan...",
    opts: ["Virtualisasi (Virtualization)","Overclocking","Multi-threading","Dual Channeling"],
    ans: 0
  },
  {
    topicId: 'x-15',
    qNum: 2,
    q: "Aplikasi Hypervisor Type-2 (Hosted Hypervisor) open-source yang sangat populer digunakan untuk membuat Virtual Machine di lingkungan desktop adalah...",
    opts: ["Microsoft Office","Adobe Acrobat Reader","Cisco AnyConnect","Oracle VM VirtualBox"],
    ans: 3
  },
  {
    topicId: 'x-15',
    qNum: 3,
    q: "Perangkat lunak lapisan pengelola yang mengontrol alokasi resource hardware fisik (CPU, RAM, Storage) kepada mesin-mesin virtual disebut...",
    opts: ["BIOS ROM","Kernel Compiler","Hypervisor / Virtual Machine Monitor (VMM)","Device Driver"],
    ans: 2
  },
  {
    topicId: 'x-15',
    qNum: 4,
    q: "Tipe adapter jaringan pada VirtualBox di mana mesin virtual (Guest) mendapatkan IP di subnet yang sama persis dengan komputer fisik dan bertindak seolah-olah komputer nyata di jaringan LAN adalah...",
    opts: ["NAT (Network Address Translation)","Bridged Adapter","Host-Only Adapter","Internal Network"],
    ans: 1
  },
  {
    topicId: 'x-15',
    qNum: 5,
    q: "Tipe adapter jaringan pada VirtualBox default di mana mesin virtual dapat mengakses internet melalui IP komputer host namun tidak dapat diakses langsung dari jaringan luar adalah...",
    opts: ["NAT (Network Address Translation)","Bridged Adapter","Host-Only Adapter","Not Attached"],
    ans: 0
  },
  {
    topicId: 'x-15',
    qNum: 6,
    q: "Tipe jaringan VirtualBox yang hanya menghubungkan komunikasi antara komputer host fisik dengan mesin virtual saja tanpa akses keluar adalah...",
    opts: ["Bridged Adapter","Generic Driver","Cloud Network","Host-Only Adapter"],
    ans: 3
  },
  {
    topicId: 'x-15',
    qNum: 7,
    q: "Format file disk virtual standar bawaan yang dibuat oleh Oracle VM VirtualBox berekstensi...",
    opts: [".docx",".iso",".vdi (VirtualBox Disk Image)",".exe"],
    ans: 2
  },
  {
    topicId: 'x-15',
    qNum: 8,
    q: "Fitur pada VirtualBox yang berfungsi menyimpan status (state) terkini dari mesin virtual sehingga dapat dikembalikan kapan saja jika terjadi kesalahan konfigurasi disebut...",
    opts: ["Clone Disk","Snapshot","Export Appliance","Virtual Pause"],
    ans: 1
  },
  {
    topicId: 'x-15',
    qNum: 9,
    q: "Paket perangkat lunak tambahan yang diinstal di dalam OS Guest pada VirtualBox untuk mengaktifkan fitur drag-and-drop, shared clipboard, dan resolusi layar otomatis adalah...",
    opts: ["Guest Additions","Extension Pack","DirectX Runtime","BIOS Update"],
    ans: 0
  },
  {
    topicId: 'x-15',
    qNum: 10,
    q: "Fitur virtualisasi hardware pada prosesor Intel dan AMD yang wajib diaktifkan melalui menu BIOS/UEFI agar aplikasi VM dapat berjalan dengan lancar adalah...",
    opts: ["Hyper-Threading","Turbo Boost Technology","Cool'n'Quiet","Intel VT-x / AMD-V"],
    ans: 3
  },
  {
    topicId: 'x-15',
    qNum: 11,
    q: "Dalam proyek perancangan jaringan LAN laboratorium sekolah 20 komputer, perangkat utama yang dibutuhkan sebagai konsentrator kabel ke semua PC adalah...",
    opts: ["Hub 4-Port","Modem Dial-up","Switch 24-Port","Access Point Repeater"],
    ans: 2
  },
  {
    topicId: 'x-15',
    qNum: 12,
    q: "Langkah pertama yang harus dilakukan dalam siklus proyek instalasi jaringan komputer adalah...",
    opts: ["Langsung membeli kabel tanpa menghitung panjang ruangan","Analisis kebutuhan dan survei lokasi denah topologi (Planning & Site Survey)","Mengunci ruangan laboratorium","Memotong semua kabel yang ada"],
    ans: 1
  },
  {
    topicId: 'x-15',
    qNum: 13,
    q: "Lemari rak khusus berpintu kaca atau ventilasi yang digunakan untuk menempatkan switch, router, patch panel, dan server secara rapi di ruang NOC disebut...",
    opts: ["Server Rack Cabinet","Filing Cabinet","Meja Komputer","Etalase Display"],
    ans: 0
  },
  {
    topicId: 'x-15',
    qNum: 14,
    q: "Pelindung kabel berbentuk pipa atau persegi dari bahan PVC yang ditempel pada dinding untuk merapikan dan melindungi kabel jaringan disebut...",
    opts: ["Patch Cord","Cable Tie","Spiraled Tube","Cable Duct / Protector Trunking"],
    ans: 3
  },
  {
    topicId: 'x-15',
    qNum: 15,
    q: "Setelah seluruh instalasi kabel dan konfigurasi IP pada proyek jaringan selesai dipasang, tahap akhir yang wajib dilakukan untuk memastikan jaringan berfungsi normal adalah...",
    opts: ["Langsung meninggalkan lokasi tanpa pengetesan","Mematikan seluruh server selamanya","Tahap Pengujian (Testing konektivitas ping/throughput) dan Dokumentasi Jaringan (Labeling)","Mencabut kembali kabel yang sudah terpasang"],
    ans: 2
  }
];

// Helper transformation function into QuizQuestion format
export const getBankSoalKelasXQuestions = (): QuizQuestion[] => {
  return RAW_BANK_SOAL_X.map(item => ({
    id: `q-${item.topicId}-${item.qNum}`,
    topicId: item.topicId,
    classLevel: 'Kelas X' as const,
    questionNumber: item.qNum,
    type: 'multiple_choice' as const,
    question: item.q,
    options: item.opts,
    correctOptionIndex: item.ans,
    keywords: [item.opts[item.ans]],
    modelAnswer: `Jawaban Benar: ${String.fromCharCode(65 + item.ans)}. ${item.opts[item.ans]}`,
    points: 10
  }));
};
