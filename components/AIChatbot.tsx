
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { AppData, School } from '../types';
import { Card } from './Card';
import { RobotIcon, PaperAirplaneIcon, XIcon } from './icons/Icons';

interface AIChatbotProps {
  appData: AppData;
  activeSchool: School;
}

type Message = {
  role: 'user' | 'model';
  text: string;
};

const TypingIndicator = () => (
    <div className="flex items-center justify-center gap-1.5 p-3">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-0"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
    </div>
);

export const AIChatbot: React.FC<AIChatbotProps> = ({ appData, activeSchool }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatInstanceRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const generateInitialContext = () => {
    const schoolInfo = (appData.smkmu || (appData as any).sdn5).schoolInfo;

    return `Anda adalah Beng AI, asisten administrasi sekolah tingkat lanjut yang dirancang untuk ${schoolInfo.name}. Misi utama Anda adalah memberikan dukungan yang komprehensif, akurat, dan mendalam kepada admin sekolah dengan menganalisis data yang disediakan.

**PERAN & KEMAMPUAN ANDA:**
1.  **Analis Data Ahli:** Anda dapat menganalisis dan menarik kesimpulan dari data. Contoh: "Siapa guru yang paling sibuk pada hari Senin?", "Kelas mana yang memiliki jadwal paling padat?", "Berapa rata-rata jumlah siswa per kelas?".
2.  **Peringkas Cerdas:** Anda dapat meringkas informasi. Contoh: "Berikan ringkasan profil sekolah", "Sebutkan visi dan misi sekolah".
3.  **Generator Daftar:** Anda dapat membuat daftar berdasarkan kriteria spesifik. Contoh: "Buatkan daftar semua mata pelajaran", "Sebutkan semua siswa di kelas IV".
4.  **Penyedia Informasi Kontekstual:** Jawaban Anda harus selalu berdasarkan data yang diberikan. Jangan mengarang informasi.

**KONTEKS OPERASIONAL:**
-   **Sekolah Aktif:** Pengguna saat ini sedang melihat data untuk: **${schoolInfo.name}**.
-   **Logika:** Jawaban Anda harus selalu berdasarkan data sekolah SMK MANBAUL ULUM.

**GAYA JAWABAN:**
-   **Profesional & Ramah:** Gunakan bahasa yang jelas, sopan, dan mudah dimengerti.
-   **Komprehensif & Maksimal:** Berikan jawaban yang lengkap dan detail. Jika sebuah pertanyaan bisa dijawab dengan lebih mendalam, lakukanlah. Misalnya, jika ditanya jumlah guru, sebutkan juga rinciannya jika relevan.
-   **Terstruktur:** Gunakan markdown (seperti daftar berpoin \`*\` atau daftar bernomor \`1.\`) untuk menyajikan informasi yang kompleks agar mudah dibaca.

**DATABASE PENGETAHUAN ANDA (DATA LENGKAP):**
Berikut adalah seluruh data yang Anda miliki aksesnya. Gunakan ini sebagai satu-satunya sumber kebenaran Anda.
\`\`\`json
${JSON.stringify(appData, null, 2)}
\`\`\`
    `;
  };

  useEffect(() => {
    // Reset state when data changes to ensure context is fresh
    setIsOpen(false);
    setMessages([]);
    chatInstanceRef.current = null;
  }, [appData]);

  const initializeChat = () => {
    try {
      const schoolName = (appData.smkmu || (appData as any).sdn5).schoolInfo?.name || 'SMK MANBAUL ULUM';
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY || process.env?.GEMINI_API_KEY : '') || '';
      if (!apiKey) {
        setMessages([{ role: 'model', text: `Halo! Saya Beng AI, asisten Anda untuk portal ${schoolName}. (API Key Gemini belum dikonfigurasi).` }]);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      chatInstanceRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: generateInitialContext(),
        }
      });
      setMessages([{ role: 'model', text: `Halo! Saya Beng AI, asisten Anda untuk portal ${schoolName}. Ada yang bisa saya bantu?` }]);
    } catch (err) {
      console.error('AIChatbot init error:', err);
      setMessages([{ role: 'model', text: `Halo! Saya Beng AI. Fitur AI saat ini belum dapat terhubung.` }]);
    }
  };
  
  const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if(willOpen && messages.length === 0) {
        initializeChat();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Clear chat history and reset instance when closing the window
    setMessages([]);
    chatInstanceRef.current = null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!chatInstanceRef.current) {
        initializeChat();
    }
    
    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const chat = chatInstanceRef.current!;
        const result = await chat.sendMessageStream({ message: userMessage.text });

        let modelResponse = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of result) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = modelResponse;
                return newMessages;
            });
        }
    } catch (error) {
        console.error("AI chat error:", error);
        setMessages(prev => [...prev, { role: 'model', text: 'Maaf, terjadi kesalahan saat menghubungi Beng AI.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 md:right-10 z-50 animate-slide-up-fade no-print">
            <Card appearance="clean" className="w-[90vw] max-w-sm h-[70vh] max-h-[500px] flex flex-col p-0">
                <header className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <RobotIcon className="w-6 h-6 text-blue-900"/>
                        <h3 className="font-bold text-slate-800 text-lg">Beng AI</h3>
                    </div>
                    <button type="button" onClick={handleClose} className="p-2 rounded-full text-slate-600 hover:bg-red-500 hover:text-white transition-colors duration-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-[#1e3a8a] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-xs px-4 py-2 rounded-2xl bg-white text-slate-800 rounded-bl-none shadow-sm">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <footer className="p-3 border-t border-slate-200">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                         <Card type="pressed" appearance="clean" className="flex-1">
                             <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tanyakan pada Beng AI..."
                                className="w-full h-10 px-3 bg-transparent text-sm text-slate-800 placeholder-slate-500 focus:outline-none"
                                disabled={isLoading}
                             />
                         </Card>
                        <button type="submit" disabled={isLoading || !input.trim()} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1e3a8a] text-white shadow-md transition-all duration-300 hover:bg-blue-900 disabled:bg-slate-400 disabled:cursor-not-allowed shimmer-active">
                            <PaperAirplaneIcon className="w-5 h-5"/>
                        </button>
                    </form>
                </footer>
            </Card>
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 sm:right-6 md:right-10 z-40 no-print">
        <button
          onClick={handleToggle}
          className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg hover:shadow-xl"
          aria-label="Buka Beng AI"
        >
          <RobotIcon className="w-8 h-8 text-white icon-animated icon-float" />
        </button>
      </div>
    </>
  );
};
