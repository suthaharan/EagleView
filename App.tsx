
import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisResult, AnalysisType, UserPreferences, User, UserRole } from './types';
import Dashboard from './components/Dashboard';
import AnalysisView from './components/AnalysisView';
import Login from './components/Login';
import Profile from './components/Profile';
import { ICONS } from './constants';
import { speak, stopSpeaking } from './services/ttsService';
import { 
  subscribeToAuth, 
  subscribeToPreferences, 
  getHistory, 
  saveHistory, 
  savePreferences, 
  logoutUser, 
  getSeniorsForCaregiver,
  saveUser
} from './services/firebaseService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'analysis' | 'history' | 'profile' | 'login' | 'senior-selector' | 'add-senior'>('login');
  const [hasReadNote, setHasReadNote] = useState(false);
  
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [seniors, setSeniors] = useState<User[]>([]);
  const [newSeniorName, setNewSeniorName] = useState('');
  const [newSeniorEmail, setNewSeniorEmail] = useState('');

  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>({
    highContrast: false,
    fontSize: 'normal',
    medicationSchedule: '',
    caregiverNote: ''
  });

  const targetId = useMemo(() => {
    if (!currentUser) return null;
    return currentUser.role === UserRole.SENIOR ? currentUser.id : selectedSeniorId;
  }, [currentUser, selectedSeniorId]);

  // Handle Firebase Auth Session
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        if (user.role === UserRole.CAREGIVER) {
          setView('senior-selector');
          loadCaregiverClients(user);
        } else {
          setView('dashboard');
          setHasReadNote(false);
        }
      } else {
        setView('login');
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Preferences and History when targetId changes
  useEffect(() => {
    if (!targetId) return;

    const unsubPrefs = subscribeToPreferences(targetId, (newPrefs) => {
      setPrefs(newPrefs);
    });

    getHistory(targetId).then(setHistory);

    return () => unsubPrefs();
  }, [targetId]);

  // Caregiver Note Readout Logic
  useEffect(() => {
    if (currentUser?.role === UserRole.SENIOR && prefs.caregiverNote && !hasReadNote && view === 'dashboard') {
      const timer = setTimeout(() => {
        speak(`Message from your caregiver: ${prefs.caregiverNote}`);
        setHasReadNote(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentUser, prefs.caregiverNote, hasReadNote, view]);

  const loadCaregiverClients = async (user: User) => {
    if (user.assignedSeniors) {
      const list = await getSeniorsForCaregiver(user.assignedSeniors);
      setSeniors(list);
    }
  };

  const handleLogout = async () => {
    stopSpeaking();
    await logoutUser();
    setCurrentUser(null);
    setSelectedSeniorId(null);
  };

  const updatePrefs = async (newPrefs: UserPreferences) => {
    if (targetId) {
      setPrefs(newPrefs);
      await savePreferences(targetId, newPrefs);
    }
  };

  const handleCreateSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSeniorName || !newSeniorEmail) return;

    // In a real app, you might invite them, but for this MVP we create a stub profile
    const seniorId = `senior_${Date.now()}`;
    const newSenior: User = {
      id: seniorId,
      name: newSeniorName,
      email: newSeniorEmail,
      role: UserRole.SENIOR
    };

    const updatedCaregiver = { 
      ...currentUser, 
      assignedSeniors: [...(currentUser.assignedSeniors || []), seniorId] 
    };

    await saveUser(newSenior);
    await saveUser(updatedCaregiver);
    setCurrentUser(updatedCaregiver);
    loadCaregiverClients(updatedCaregiver);
    
    setNewSeniorName('');
    setNewSeniorEmail('');
    setView('senior-selector');
  };

  const handleAnalysisComplete = async (result: AnalysisResult) => {
    setCurrentAnalysis(result);
    setHistory(prev => [result, ...prev]);
    await saveHistory(result);
    setView('analysis');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-senior-primary">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-senior-accent"></div>
      </div>
    );
  }

  if (!currentUser) return <Login onLogin={() => {}} />; // Login handles its own logic now

  return (
    <div className={`min-h-screen transition-colors duration-200 ${prefs.highContrast ? 'high-contrast' : ''} ${prefs.fontSize === 'large' ? 'large-font' : ''}`}>
      <header className="bg-senior-primary text-white p-4 shadow-lg sticky top-0 z-50 flex justify-between items-center">
        <button onClick={() => setView(currentUser.role === UserRole.CAREGIVER ? 'senior-selector' : 'dashboard')} className="text-2xl font-bold flex items-center gap-2">
          <div className="bg-senior-accent p-1 rounded text-senior-primary"><ICONS.Pill /></div>
          EagleView
        </button>
        <button onClick={() => setView('profile')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/20">
          <div className="w-8 h-8 rounded-full bg-senior-accent text-senior-primary flex items-center justify-center font-bold uppercase">
            {(seniors.find(s => s.id === targetId)?.name || currentUser.name)[0]}
          </div>
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-24">
        {currentUser.role === UserRole.SENIOR && prefs.caregiverNote && (
          <div className="mb-6 bg-senior-accent/20 border-2 border-senior-accent p-6 rounded-3xl flex items-center gap-6 animate-in slide-in-from-top duration-500">
            <div className="text-senior-primary animate-bounce"><ICONS.Speaker /></div>
            <p className="text-2xl font-black text-senior-primary italic">Note from Caregiver: "{prefs.caregiverNote}"</p>
          </div>
        )}

        {view === 'senior-selector' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-end">
              <h1 className="text-4xl font-bold text-senior-primary">My Seniors</h1>
              <button onClick={() => setView('add-senior')} className="bg-senior-accent text-senior-primary font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg"><ICONS.Plus /> Add Senior</button>
            </div>
            <div className="grid gap-4">
              {seniors.map(s => (
                <button key={s.id} onClick={() => { setSelectedSeniorId(s.id); setView('dashboard'); }} className="bg-white p-8 rounded-3xl shadow-xl flex justify-between items-center hover:ring-8 hover:ring-senior-accent transition-all text-left group">
                  <div>
                    <h2 className="text-3xl font-bold group-hover:text-senior-secondary transition-colors">{s.name}</h2>
                    <p className="text-xl text-gray-500">{s.email}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-full group-hover:bg-senior-accent group-hover:text-senior-primary transition-all"><ICONS.Camera /></div>
                </button>
              ))}
            </div>
            <button onClick={handleLogout} className="w-full text-xl font-bold text-red-500 hover:underline pt-8">Sign Out</button>
          </div>
        )}

        {view === 'add-senior' && (
          <div className="max-w-md mx-auto space-y-8">
            <h1 className="text-4xl font-bold text-senior-primary text-center">Add New Senior</h1>
            <form onSubmit={handleCreateSenior} className="bg-white p-8 rounded-3xl shadow-2xl space-y-6 border-4 border-senior-primary">
              <input type="text" value={newSeniorName} onChange={(e) => setNewSeniorName(e.target.value)} className="w-full p-4 text-2xl border-4 border-gray-100 rounded-2xl" placeholder="Full Name" required />
              <input type="email" value={newSeniorEmail} onChange={(e) => setNewSeniorEmail(e.target.value)} className="w-full p-4 text-2xl border-4 border-gray-100 rounded-2xl" placeholder="Email Address" required />
              <div className="flex gap-4">
                <button type="button" onClick={() => setView('senior-selector')} className="flex-1 py-4 text-xl font-bold">Cancel</button>
                <button type="submit" className="flex-[2] bg-senior-primary text-white py-4 rounded-2xl text-2xl font-bold">Save Senior</button>
              </div>
            </form>
          </div>
        )}

        {view === 'dashboard' && <Dashboard user={currentUser} activeSeniorId={targetId!} activeSeniorName={seniors.find(s => s.id === targetId)?.name || currentUser.name} prefs={prefs} onAnalysisComplete={handleAnalysisComplete} historyCount={history.length} setView={setView} />}
        {view === 'analysis' && currentAnalysis && <AnalysisView result={currentAnalysis} onBack={() => setView('dashboard')} />}
        {view === 'profile' && <Profile user={currentUser} targetUserName={seniors.find(s => s.id === targetId)?.name || currentUser.name} prefs={prefs} onUpdatePrefs={updatePrefs} onLogout={handleLogout} onBack={() => setView('dashboard')} />}
        {view === 'history' && (
           <div className="space-y-12">
             <h2 className="text-4xl font-bold text-senior-primary">Scan History</h2>
             {history.length === 0 ? <p className="text-center py-20 text-2xl text-gray-400 font-bold">No history available for this senior.</p> : (
               Object.entries(groupedHistory).map(([date, categories]) => (
                 <div key={date} className="space-y-6">
                    <h3 className="text-2xl font-black text-senior-primary bg-senior-accent/20 px-4 py-2 rounded-xl inline-block">{date}</h3>
                    {Object.entries(categories).map(([cat, items]) => (
                      <div key={cat} className="grid gap-4">
                        {items.map(item => (
                          <button key={item.id} onClick={() => { setCurrentAnalysis(item); setView('analysis'); }} className="bg-white p-6 rounded-3xl shadow-md flex items-center gap-6 hover:ring-4 hover:ring-senior-accent transition-all text-left">
                            <img src={item.imageUrl} className="w-20 h-20 rounded-xl object-cover" />
                            <div>
                              <p className="text-sm text-gray-400 font-bold">{cat}</p>
                              <h4 className="text-xl font-bold line-clamp-1">{item.summary}</h4>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                 </div>
               ))
             )}
           </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-around items-center z-40 shadow-2xl">
        {currentUser.role === UserRole.CAREGIVER && (
          <button onClick={() => setView('senior-selector')} className={`flex flex-col items-center gap-1 ${view === 'senior-selector' ? 'text-senior-primary' : 'text-gray-400'}`}>
            <ICONS.User /> <span className="text-[10px] font-black uppercase">Seniors</span>
          </button>
        )}
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-senior-primary' : 'text-gray-400'}`}>
          <ICONS.Camera /> <span className="text-[10px] font-black uppercase">Scan</span>
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-senior-primary' : 'text-gray-400'}`}>
          <ICONS.History /> <span className="text-[10px] font-black uppercase">History</span>
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-senior-primary' : 'text-gray-400'}`}>
          <ICONS.Settings /> <span className="text-[10px] font-black uppercase">Prefs</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
