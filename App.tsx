
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
  getManagedSeniors,
  registerSeniorByCaregiver
} from './firebase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'analysis' | 'history' | 'profile' | 'login' | 'senior-selector' | 'add-senior'>('login');
  const [hasReadNote, setHasReadNote] = useState(false);
  
  const [selectedSeniorId, setSelectedSeniorId] = useState<string | null>(null);
  const [seniors, setSeniors] = useState<User[]>([]);
  const [newSeniorName, setNewSeniorName] = useState('');
  const [newSeniorEmail, setNewSeniorEmail] = useState('');
  const [newSeniorPassword, setNewSeniorPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        if (user.role === UserRole.CAREGIVER) {
          setView('senior-selector');
          loadSeniors(user.id);
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

  useEffect(() => {
    if (!targetId) return;
    const unsubPrefs = subscribeToPreferences(targetId, (newPrefs) => {
      setPrefs(newPrefs);
    });
    getHistory(targetId).then(setHistory);
    return () => unsubPrefs();
  }, [targetId]);

  useEffect(() => {
    if (currentUser?.role === UserRole.SENIOR && prefs.caregiverNote && !hasReadNote && view === 'dashboard') {
      const timer = setTimeout(() => {
        speak(`Message from your caregiver: ${prefs.caregiverNote}`);
        setHasReadNote(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentUser, prefs.caregiverNote, hasReadNote, view]);

  const loadSeniors = async (userId: string) => {
    const list = await getManagedSeniors(userId);
    setSeniors(list);
  };

  const handleLogout = async () => {
    stopSpeaking();
    await logoutUser();
    setCurrentUser(null);
    setSelectedSeniorId(null);
    setSeniors([]);
  };

  const updatePrefs = async (newPrefs: UserPreferences) => {
    if (targetId) {
      setPrefs(newPrefs);
      await savePreferences(targetId, newPrefs);
    }
  };

  const handleCreateSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSeniorName || !newSeniorEmail || !newSeniorPassword) {
      alert("Please fill in all fields to create the patient's secure account.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerSeniorByCaregiver(currentUser.id, newSeniorName, newSeniorEmail, newSeniorPassword);
      await loadSeniors(currentUser.id);
      setNewSeniorName('');
      setNewSeniorEmail('');
      setNewSeniorPassword('');
      setView('senior-selector');
    } catch (err: any) {
      alert("Error adding patient: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalysisComplete = async (result: AnalysisResult) => {
    setCurrentAnalysis(result);
    setHistory(prev => [result, ...prev]);
    setView('analysis');
    await saveHistory(result);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-32 w-32 border-t-8 border-senior-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${prefs.highContrast ? 'bg-black' : 'bg-gray-50'} ${prefs.fontSize === 'large' ? 'text-2xl' : 'text-base'}`}>
      <nav className="bg-senior-primary text-white p-6 sticky top-0 z-50 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button onClick={() => setView('dashboard')} className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <span className="bg-senior-accent text-senior-primary p-2 rounded-xl"><ICONS.Camera /></span>
            EagleView
          </button>
          <div className="flex items-center gap-4">
            {currentUser && (
              <button 
                onClick={() => setView('profile')}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-colors"
              >
                <ICONS.Settings />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {view === 'login' && <Login onLogin={() => {}} />}
        
        {view === 'senior-selector' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center">
               <h1 className="text-4xl font-black text-senior-primary">My Patients</h1>
               <button onClick={() => setView('add-senior')} className="bg-senior-accent text-senior-primary px-6 py-3 rounded-2xl font-black flex items-center gap-2">
                 <ICONS.Plus /> Add New
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {seniors.length === 0 ? (
                 <div className="col-span-full p-12 bg-white rounded-3xl text-center border-4 border-dashed border-gray-200">
                    <p className="text-2xl text-gray-400 font-bold">No patients added yet.</p>
                 </div>
               ) : (
                 seniors.map(s => (
                   <button 
                     key={s.id}
                     onClick={() => {
                       setSelectedSeniorId(s.id);
                       setView('dashboard');
                     }}
                     className="p-8 bg-white border-4 border-gray-100 rounded-[2.5rem] text-left hover:border-senior-secondary transition-all shadow-lg group"
                   >
                     <h3 className="text-3xl font-black text-senior-primary mb-1 group-hover:text-senior-secondary">{s.name}</h3>
                     <p className="text-xl text-gray-500 font-bold">{s.email}</p>
                   </button>
                 ))
               )}
             </div>
             <button onClick={handleLogout} className="w-full p-6 text-xl font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors mt-8">Log Out</button>
          </div>
        )}

        {view === 'add-senior' && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl space-y-8 border-4 border-senior-primary animate-in zoom-in-95">
            <h2 className="text-4xl font-black text-senior-primary">Add New Patient</h2>
            <p className="text-gray-500 font-bold italic">This will create a secure login account for the senior.</p>
            <form onSubmit={handleCreateSenior} className="space-y-6">
              <div>
                <label className="block text-xl font-black mb-2">Patient Name</label>
                <input 
                  type="text" 
                  value={newSeniorName} 
                  onChange={e => setNewSeniorName(e.target.value)} 
                  className="w-full p-5 text-2xl border-4 border-gray-100 rounded-2xl outline-none focus:border-senior-secondary"
                  required 
                  placeholder="Betty"
                />
              </div>
              <div>
                <label className="block text-xl font-black mb-2">Login Email</label>
                <input 
                  type="email" 
                  value={newSeniorEmail} 
                  onChange={e => setNewSeniorEmail(e.target.value)} 
                  className="w-full p-5 text-2xl border-4 border-gray-100 rounded-2xl outline-none focus:border-senior-secondary"
                  required
                  placeholder="betty@example.com"
                />
              </div>
              <div>
                <label className="block text-xl font-black mb-2">Login Password</label>
                <input 
                  type="password" 
                  value={newSeniorPassword} 
                  onChange={e => setNewSeniorPassword(e.target.value)} 
                  className="w-full p-5 text-2xl border-4 border-gray-100 rounded-2xl outline-none focus:border-senior-secondary"
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setView('senior-selector')} className="flex-1 p-6 text-xl font-bold text-gray-400">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-senior-primary text-white p-6 rounded-2xl text-2xl font-bold shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'dashboard' && currentUser && targetId && (
          <Dashboard 
            user={currentUser}
            activeSeniorId={targetId}
            activeSeniorName={currentUser.role === UserRole.SENIOR ? currentUser.name : (seniors.find(s => s.id === selectedSeniorId)?.name || 'Patient')}
            prefs={prefs}
            onAnalysisComplete={handleAnalysisComplete}
            historyCount={history.length}
            setView={setView}
          />
        )}

        {view === 'analysis' && currentAnalysis && (
          <AnalysisView 
            result={currentAnalysis} 
            onBack={() => setView('dashboard')} 
          />
        )}

        {view === 'history' && (
          <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-black text-senior-primary">Analysis History</h2>
              <button onClick={() => setView('dashboard')} className="text-xl font-bold text-senior-secondary">Back</button>
            </div>
            {history.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-gray-200">
                <p className="text-3xl text-gray-400 font-black">No scans yet!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {history.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setCurrentAnalysis(item);
                      setView('analysis');
                    }}
                    className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-md hover:shadow-xl transition-all border-4 border-gray-50 text-left"
                  >
                    <img src={item.imageUrl} className="w-24 h-24 rounded-2xl object-cover" alt="History" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-black text-senior-accent uppercase tracking-widest">{item.type}</span>
                        <span className="text-sm text-gray-400 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-2xl font-black text-senior-primary line-clamp-1">{item.summary}</h3>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'profile' && currentUser && (
          <Profile 
            user={currentUser}
            targetUserName={currentUser.role === UserRole.SENIOR ? currentUser.name : (seniors.find(s => s.id === selectedSeniorId)?.name || 'Patient')}
            prefs={prefs}
            onUpdatePrefs={updatePrefs}
            onLogout={handleLogout}
            onBack={() => setView('dashboard')}
            onReturnToSelector={currentUser.role === UserRole.CAREGIVER ? () => {
              setSelectedSeniorId(null);
              setView('senior-selector');
            } : undefined}
          />
        )}
      </main>
    </div>
  );
};

export default App;
