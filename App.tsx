
import React, { useState, useRef, useEffect } from 'react';
import { analyzeCourseContent, generateExamSimulation } from './services/geminiService';
import { RoadmapResponse, User, ExamSimulation } from './types';
import { StepCard } from './components/StepCard';
import { PomodoroTimer } from './components/PomodoroTimer';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ExamSection } from './components/ExamSection';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [exam, setExam] = useState<ExamSimulation | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'exam'>('roadmap');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence for user and theme
  useEffect(() => {
    const savedUser = localStorage.getItem('pinkstudy_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const handleLogin = (email: string, name: string) => {
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
    };
    setUser(newUser);
    localStorage.setItem('pinkstudy_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pinkstudy_user');
    setRoadmap(null);
    setExam(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFile({ data: base64String, mimeType: selectedFile.type, name: selectedFile.name });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!input.trim() && !file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCourseContent(input, file ? { data: file.data, mimeType: file.mimeType } : undefined);
      setRoadmap(result);
      setExam(null);
      setCompletedSteps([]);
      setActiveTab('roadmap');
    } catch (err: any) {
      setError("Une erreur est survenue lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExam = async () => {
    if (!roadmap) return;
    setLoading(true);
    try {
      const result = await generateExamSimulation(roadmap);
      setExam(result);
      setActiveTab('exam');
    } catch (err: any) {
      setError("Impossible de générer l'examen blanc.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepEtape: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepEtape) ? prev.filter(id => id !== stepEtape) : [...prev, stepEtape]
    );
  };

  const progress = roadmap 
    ? Math.round((completedSteps.length / roadmap.planning.length) * 100) 
    : 0;

  return (
    <div className={`min-h-screen pb-20 pt-24 ${isDarkMode ? 'dark' : ''}`}>
      <div className="liquid-bg h-[500px] w-full absolute top-0 left-0 -z-10 opacity-70" />
      
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenAuth={() => setIsAuthModalOpen(true)} 
        isDark={isDarkMode}
        toggleTheme={toggleTheme}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin}
      />

      <main className="max-w-4xl mx-auto px-6">
        {!roadmap ? (
          <div className="glass-card rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in duration-700 border-white/40 dark:border-white/10">
            <header className="mb-10 text-center">
              <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-2">Prêt à architecturer vos révisions ?</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Uploadez votre cours et laissez l'IA tracer votre chemin vers le succès.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">✍️</span> Saisie texte
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Collez votre contenu de cours ici..."
                  className="w-full h-56 p-6 bg-white/40 dark:bg-gray-800/40 border-2 border-pink-50 dark:border-gray-700 rounded-[2rem] focus:border-pink-300 dark:focus:border-pink-500 transition-all outline-none text-sm resize-none shadow-inner dark:text-gray-200"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">📄</span> Document
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-grow border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-8 cursor-pointer transition-all ${
                    file ? 'border-pink-400 bg-pink-50/50 dark:bg-pink-900/10 shadow-inner' : 'border-pink-100 dark:border-gray-700 hover:border-pink-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                  {file ? (
                    <div className="text-center animate-in scale-in duration-300">
                      <div className="w-20 h-20 bg-pink-400/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-4xl shadow-sm">
                        {file.mimeType.includes('image') ? '🖼️' : '📄'}
                      </div>
                      <p className="text-sm font-bold text-pink-600 dark:text-pink-400 truncate max-w-[200px]">{file.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-3 text-[10px] text-rose-400 hover:text-rose-600 font-black uppercase tracking-widest">Retirer</button>
                    </div>
                  ) : (
                    <div className="text-center opacity-40 dark:opacity-60 group hover:opacity-100 transition-opacity">
                      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">☁️</div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">Glisser un PDF ou Photo</p>
                      <p className="text-[10px] mt-1 text-gray-500 dark:text-gray-400 uppercase font-black tracking-widest">Max 20MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading || (!input.trim() && !file)}
              className="w-full py-6 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white text-xl font-black rounded-3xl shadow-xl shadow-pink-200 dark:shadow-none hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loading ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" /> : "Lancer l'Architecte 🌸"}
            </button>
            {error && <p className="mt-6 text-center text-rose-500 font-bold animate-pulse">{error}</p>}
          </div>
        ) : (
          <div className="space-y-8 pb-20">
            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl w-fit mx-auto border border-white/50 dark:border-gray-700 shadow-sm mb-6">
              <button 
                onClick={() => setActiveTab('roadmap')}
                className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === 'roadmap' ? 'bg-pink-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-pink-500'
                }`}
              >
                Ma Roadmap
              </button>
              <button 
                onClick={() => exam ? setActiveTab('exam') : handleGenerateExam()}
                className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                  activeTab === 'exam' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'
                }`}
              >
                {loading && activeTab !== 'exam' ? <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : 'Examen Blanc'}
              </button>
            </div>

            {activeTab === 'roadmap' ? (
              <div className="animate-in slide-in-from-left-8 duration-500">
                <div className="glass-card rounded-[3rem] p-8 md:p-12 mb-8 border-white/50 dark:border-gray-700 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-pink-100 dark:bg-pink-900 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 relative">
                    <div>
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm ${
                        roadmap.priorite === 'Haute' ? 'bg-rose-500 text-white' : 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300'
                      }`}>
                        Priorité {roadmap.priorite}
                      </span>
                      <h2 className="text-4xl md:text-5xl font-black text-gray-800 dark:text-white leading-tight">
                        {roadmap.nom_examen}
                      </h2>
                    </div>
                    
                    <div className="flex flex-col items-center bg-white/50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-white dark:border-gray-700 shadow-sm">
                      <div className="relative w-28 h-28">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-700" />
                          <circle cx="56" cy="56" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-pink-500 transition-all duration-1000 ease-out" 
                            strokeDasharray={314.159} strokeDashoffset={314.159 - (314.159 * progress) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-gray-800 dark:text-white">{progress}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 mt-3 uppercase tracking-widest">Progression</span>
                    </div>
                  </div>

                  <div className="p-8 bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-indigo-950/20 dark:to-pink-950/20 rounded-[2.5rem] border border-white dark:border-gray-700 flex items-start gap-6 shadow-inner">
                    <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-indigo-100 dark:border-indigo-900/50">💡</div>
                    <div>
                      <h4 className="font-black text-gray-800 dark:text-gray-200 mb-2 uppercase text-xs tracking-widest">Conseil Stratégique</h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic text-lg font-medium">"{roadmap.conseil_expert}"</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {roadmap.planning.map((step) => (
                    <StepCard 
                      key={step.etape} 
                      step={step} 
                      isCompleted={completedSteps.includes(step.etape)}
                      onToggle={() => toggleStep(step.etape)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              exam && <ExamSection exam={exam} />
            )}

            <div className="flex justify-center pt-12">
              <button 
                onClick={() => { setRoadmap(null); setExam(null); }}
                className="group flex items-center gap-3 px-10 py-4 rounded-full bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black text-sm uppercase tracking-widest hover:text-pink-500 dark:hover:text-pink-400 border border-pink-50 dark:border-gray-700 transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Nouvelle Analyse
              </button>
            </div>
          </div>
        )}
      </main>

      {roadmap && activeTab === 'roadmap' && <PomodoroTimer />}
    </div>
  );
};

export default App;
