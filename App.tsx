
import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisResult, AnalysisType, UserPreferences, User, UserRole } from './types';
import Dashboard from './components/Dashboard';
import AnalysisView from './components/AnalysisView';
import Login from './components/Login';
import Profile from './components/Profile';
import { ICONS } from './constants';
import { stopSpeaking } from './services/ttsService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'analysis' | 'history' | 'profile' | 'login' | 'senior-selector' | 'add-senior'>('login');
  
  // Caregiver State
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [seniors, setSeniors] = useState<User[]>([]);
  const [newSeniorName, setNewSeniorName] = useState('');
  const [newSeniorEmail, setNewSeniorEmail] = useState('');

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>({
    highContrast: false,
    fontSize: 'normal',
    medicationSchedule: ''
  });

  // Determine the target user ID for data loading (self if Senior, or the managed senior if Caregiver)
  const targetId = useMemo(() => {
    if (!currentUser) return null;
    return currentUser.role === UserRole.SENIOR ? currentUser.id : selectedSeniorId;
  }, [currentUser, selectedSeniorId]);

  // Initial authentication check
  useEffect(() => {
    const savedUser = localStorage.getItem('eagleview_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (user.role === UserRole.CAREGIVER) {
        setView('senior-selector');
        loadCaregiverData(user.id);
      } else {
        setView('dashboard');
        loadUserData(user.id);
      }
    }
  }, []);

  // Load data when targetId changes
  useEffect(() => {
    if (targetId) {
      loadUserData(targetId);
    }
  }, [targetId]);

  const loadCaregiverData = (userId: string) => {
    const savedSeniors = localStorage.getItem(`eagleview_seniors_${userId}`);
    if (savedSeniors) setSeniors(JSON.parse(savedSeniors));
  };

  const loadUserData = (userId: string) => {
    const savedHistory = localStorage.getItem(`eagleview_history_${userId}`);
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);

    const savedPrefs = localStorage.getItem(`eagleview_prefs_${userId}`);
    setPrefs(savedPrefs ? JSON.parse(savedPrefs) : {
      highContrast: false,
      fontSize: 'normal',
      medicationSchedule: ''
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('eagleview_user', JSON.stringify(user));
    if (user.role === UserRole.CAREGIVER) {
      loadCaregiverData(user.id);
      setView('senior-selector');
    } else {
      setSelectedSeniorId(null);
      loadUserData(user.id);
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    stopSpeaking();
    setCurrentUser(null);
    setSelectedSeniorId(null);
    localStorage.removeItem('eagleview_user');
    setView('login');
  };

  const saveToHistory = (result: AnalysisResult) => {
    if (!targetId) return;
    const newHistory = [result, ...history].slice(0, 500);
    setHistory(newHistory);
    localStorage.setItem(`eagleview_history_${targetId}`, JSON.stringify(newHistory));
  };

  const updatePrefs = (newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    if (targetId) {
      localStorage.setItem(`eagleview_prefs_${targetId}`, JSON.stringify(newPrefs));
    }
  };

  const handleCreateSenior = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSeniorName || !newSeniorEmail) return;

    const newSenior: User = {
      id: newSeniorEmail.toLowerCase(),
      name: newSeniorName,
      email: newSeniorEmail,
      role: UserRole.SENIOR
    };

    const newSeniorsList = [...seniors, newSenior];
    setSeniors(newSeniorsList);
    localStorage.setItem(`eagleview_seniors_${currentUser.id}`, JSON.stringify(newSeniorsList));
    
    setNewSeniorName('');
    setNewSeniorEmail('');
    setView('senior-selector');
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentAnalysis(result);
    saveToHistory(result);
    setView('analysis');
  };

  // Groups history by date and then by type
  const groupedHistory = useMemo(() => {
    const groups: { [date: string]: { [category: string]: AnalysisResult[] } } = {};
    history.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const cat = item.type;
      if (!groups[date]) groups[date] = {};
      if (!groups[date][cat]) groups[date][cat] = [];
      groups[date][cat].push(item);
    });
    return groups;
  }, [history]);

  const goBack = () => {
    stopSpeaking();
    setView('dashboard');
  };

  if (!currentUser) {
    return (
      <div className={`min-h-screen ${prefs.highContrast ? 'high-contrast' : ''} ${prefs.fontSize === 'large' ? 'large-font' : ''}`}>
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${prefs.highContrast ? 'high-contrast' : ''} ${prefs.fontSize === 'large' ? 'large-font' : ''}`}>
      <header className="bg-senior-primary text-white p-4 shadow-lg sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="text-2xl font-bold flex items-center gap-2">
            <div className="bg-senior-accent p-1 rounded text-senior-primary"><ICONS.Pill /></div>
            EagleView
          </button>
        </div>
        
        <div className="flex gap-4 items-center">
          {currentUser.role === UserRole.CAREGIVER && (
            <button 
              onClick={() => setView('senior-selector')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20 font-bold"
            >
              Clients
            </button>
          )}
          <button 
            onClick={() => setView('profile')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20"
          >
            <div className="w-8 h-8 rounded-full bg-senior-accent text-senior-primary flex items-center justify-center font-bold uppercase">
              {(seniors.find(s => s.id === targetId)?.name || currentUser.name)[0]}
            </div>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
        {view === 'senior-selector' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-end">
              <h1 className="text-4xl font-bold text-senior-primary">My Seniors</h1>
              <button 
                onClick={() => setView('add-senior')}
                className="bg-senior-accent text-senior-primary font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg"
              >
                <ICONS.Plus /> Add Senior
              </button>
            </div>
            
            {seniors.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl shadow-xl text-center space-y-6 border-4 border-dashed border-gray-200">
                <p className="text-2xl text-gray-400 font-bold">No seniors added to your care list yet.</p>
                <button onClick={() => setView('add-senior')} className="text-xl font-bold text-senior-secondary underline">Add your first senior</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {seniors.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSeniorId(s.id); setView('dashboard'); }}
                    className="bg-white p-8 rounded-3xl shadow-xl flex justify-between items-center hover:ring-8 hover:ring-senior-accent transition-all text-left group"
                  >
                    <div>
                      <h2 className="text-3xl font-bold group-hover:text-senior-secondary transition-colors">{s.name}</h2>
                      <p className="text-xl text-gray-500">{s.email}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-full group-hover:bg-senior-accent group-hover:text-senior-primary transition-all">
                      <ICONS.Camera />
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="pt-8 text-center">
              <button onClick={handleLogout} className="text-xl font-bold text-red-500 hover:underline">Sign Out</button>
            </div>
          </div>
        )}

        {view === 'add-senior' && (
          <div className="max-w-md mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <h1 className="text-4xl font-bold text-senior-primary text-center">Add New Senior</h1>
            <form onSubmit={handleCreateSenior} className="bg-white p-8 rounded-3xl shadow-2xl space-y-6 border-4 border-senior-primary">
              <div>
                <label className="block text-xl font-bold mb-2 text-gray-700">Full Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newSeniorName}
                  onChange={(e) => setNewSeniorName(e.target.value)}
                  className="w-full p-4 text-2xl border-4 border-gray-100 rounded-2xl focus:border-senior-secondary outline-none transition-all"
                  placeholder="e.g. Betty"
                  required
                />
              </div>
              <div>
                <label className="block text-xl font-bold mb-2 text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={newSeniorEmail}
                  onChange={(e) => setNewSeniorEmail(e.target.value)}
                  className="w-full p-4 text-2xl border-4 border-gray-100 rounded-2xl focus:border-senior-secondary outline-none transition-all"
                  placeholder="betty@email.com"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setView('senior-selector')} className="flex-1 py-4 text-xl font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-[2] bg-senior-primary text-white py-4 rounded-2xl text-2xl font-bold shadow-lg hover:bg-senior-secondary">Save Senior</button>
              </div>
            </form>
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard 
            user={currentUser}
            activeSeniorId={targetId!}
            activeSeniorName={seniors.find(s => s.id === targetId)?.name || currentUser.name}
            prefs={prefs}
            onAnalysisComplete={handleAnalysisComplete} 
            historyCount={history.length} 
            setView={setView} 
          />
        )}

        {view === 'analysis' && currentAnalysis && <AnalysisView result={currentAnalysis} onBack={goBack} />}

        {view === 'profile' && (
          <Profile 
            user={currentUser}
            targetUserName={seniors.find(s => s.id === targetId)?.name || currentUser.name}
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onLogout={handleLogout}
            onBack={goBack}
          />
        )}

        {view === 'history' && (
          <div className="space-y-12 pb-12">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold text-senior-primary">All Scans</h2>
              <button onClick={goBack} className="text-xl font-bold text-senior-secondary hover:underline">New Scan</button>
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl shadow-lg border-4 border-dashed border-gray-200">
                <p className="text-3xl text-gray-400 font-bold">No history yet.</p>
                <p className="text-xl text-gray-400 mt-2">Any image scanned for {seniors.find(s => s.id === targetId)?.name || currentUser.name} will appear here.</p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([date, categories]) => (
                <div key={date} className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black text-senior-primary bg-senior-accent/20 px-5 py-2 rounded-2xl">{date}</h3>
                    <div className="h-0.5 flex-1 bg-gray-200 rounded-full"></div>
                  </div>
                  
                  {Object.entries(categories).map(([cat, items]) => (
                    <div key={cat} className="space-y-4">
                      <div className="flex items-center gap-3 pl-2">
                        <div className={`w-2 h-6 rounded-full ${
                          cat === AnalysisType.PILLBOX ? 'bg-blue-500' : 
                          cat === AnalysisType.FINE_PRINT ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <h4 className="text-lg font-bold uppercase tracking-[0.2em] text-gray-400">
                          {cat.replace('_', ' ')}
                        </h4>
                      </div>
                      <div className="grid gap-6">
                        {items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => { setCurrentAnalysis(item); setView('analysis'); }}
                            className="bg-white p-6 rounded-[2rem] shadow-md text-left flex items-center gap-6 hover:ring-8 hover:ring-senior-accent transition-all group border-2 border-transparent"
                          >
                            <div className="relative shrink-0">
                              <img src={item.imageUrl} alt="Scan" className="w-32 h-32 object-cover rounded-2xl border-4 border-gray-50 shadow-inner" />
                              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-gray-100 scale-90">
                                {item.type === AnalysisType.PILLBOX && <ICONS.Pill />}
                                {item.type === AnalysisType.FINE_PRINT && <ICONS.Camera />}
                                {item.type === AnalysisType.DOCUMENT && <ICONS.History />}
                              </div>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-bold text-sm">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <h3 className="text-2xl font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-senior-secondary transition-colors">{item.summary}</h3>
                              {(item.type === AnalysisType.FINE_PRINT || item.type === AnalysisType.DOCUMENT) && (item.details.fullSnippet || item.details.summary) && (
                                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                  <p className="text-base text-gray-500 line-clamp-1 italic">
                                    {item.details.fullSnippet || item.details.summary}
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around items-center z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        {currentUser.role === UserRole.CAREGIVER ? (
          <button onClick={() => setView('senior-selector')} className={`flex flex-col items-center gap-0.5 transition-all ${view === 'senior-selector' ? 'text-senior-primary scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className={view === 'senior-selector' ? 'bg-senior-primary/10 p-2 rounded-xl' : 'p-2'}>
              <ICONS.User />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Seniors</span>
          </button>
        ) : null}
        
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-0.5 transition-all ${view === 'dashboard' ? 'text-senior-primary scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={view === 'dashboard' ? 'bg-senior-primary/10 p-2 rounded-xl' : 'p-2'}>
            <ICONS.Camera />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Scan</span>
        </button>
        
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-0.5 transition-all ${view === 'history' ? 'text-senior-primary scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={view === 'history' ? 'bg-senior-primary/10 p-2 rounded-xl' : 'p-2'}>
            <ICONS.History />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">History</span>
        </button>
        
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-0.5 transition-all ${view === 'profile' ? 'text-senior-primary scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <div className={view === 'profile' ? 'bg-senior-primary/10 p-2 rounded-xl' : 'p-2'}>
            <ICONS.Settings />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Prefs</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
