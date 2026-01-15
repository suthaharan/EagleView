
import React, { useState, useRef } from 'react';
import { AnalysisType, AnalysisResult, User, UserPreferences } from '../types';
import { ICONS } from '../constants';
import { analyzeImage } from '../services/geminiService';
import CameraCapture from './CameraCapture';

interface DashboardProps {
  user: User;
  activeSeniorId: string;
  activeSeniorName: string;
  prefs: UserPreferences;
  onAnalysisComplete: (result: AnalysisResult) => void;
  historyCount: number;
  setView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, activeSeniorId, activeSeniorName, prefs, onAnalysisComplete, historyCount, setView }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<AnalysisType>(AnalysisType.PILLBOX);
  const [showOptions, setShowOptions] = useState<AnalysisType | null>(null);

  const processImage = async (base64: string) => {
    setIsAnalyzing(true);
    setError(null);
    setShowCamera(false);
    setShowOptions(null);

    try {
      const details = await analyzeImage(base64, selectedType, prefs.medicationSchedule);
      
      const result: AnalysisResult = {
        id: Math.random().toString(36).substr(2, 9),
        userId: activeSeniorId,
        performedBy: user.id,
        timestamp: Date.now(),
        type: selectedType,
        imageUrl: base64,
        summary: details.summary || "I've analyzed the image.",
        details: details
      };

      // Only add fraudRisk if it exists to avoid Firestore undefined error
      if (details.fraudRisk) {
        result.fraudRisk = details.fraudRisk;
      }
      
      onAnalysisComplete(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      processImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const openOptions = (type: AnalysisType) => {
    setSelectedType(type);
    setShowOptions(type);
  };

  return (
    <div className="space-y-10 py-4 animate-in fade-in duration-500">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
           <div className="w-3 h-10 bg-senior-accent rounded-full"></div>
           <h1 className="text-4xl md:text-5xl font-black text-senior-primary tracking-tight">Viewing: {activeSeniorName}</h1>
        </div>
        <p className="text-2xl text-gray-500 font-medium pl-6">EagleView: Choose a scan mode.</p>
      </div>

      <div className="grid gap-8">
        <ActionButton 
          title="Identify Pills" 
          description="Check compartments and verify dosages." 
          icon={<ICONS.Pill />} 
          onClick={() => openOptions(AnalysisType.PILLBOX)}
          disabled={isAnalyzing}
          color="bg-blue-600"
          badge={prefs.medicationSchedule ? "Schedule Active" : ""}
        />
        
        <ActionButton 
          title="Read Fine Print" 
          description="Read small text on labels or contracts." 
          icon={<ICONS.Camera />} 
          onClick={() => openOptions(AnalysisType.FINE_PRINT)}
          disabled={isAnalyzing}
          color="bg-green-600"
        />
        
        <ActionButton 
          title="Check Document" 
          description="Scan mail for bills and fraud alerts." 
          icon={<ICONS.History />} 
          onClick={() => openOptions(AnalysisType.DOCUMENT)}
          disabled={isAnalyzing}
          color="bg-orange-600"
        />
      </div>

      {showOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-t-[3rem] md:rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black text-senior-primary">How to Scan?</h3>
              <button onClick={() => setShowOptions(null)} className="p-2"><ICONS.X /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => setShowCamera(true)}
                className="flex items-center gap-6 p-8 bg-senior-primary text-white rounded-3xl text-2xl font-bold shadow-xl active:scale-95 transition-transform"
              >
                <div className="bg-white/20 p-4 rounded-xl"><ICONS.Camera /></div>
                Use Live Camera
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-6 p-8 bg-gray-100 text-senior-primary rounded-3xl text-2xl font-bold shadow-md active:scale-95 transition-transform border-4 border-gray-200"
              >
                <div className="bg-senior-primary/10 p-4 rounded-xl"><ICONS.Plus /></div>
                Upload Image File
              </button>
            </div>
            <button 
              onClick={() => setShowOptions(null)}
              className="w-full py-4 text-xl font-bold text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <button 
          onClick={() => setView('history')}
          className="flex items-center justify-center gap-4 bg-white border-4 border-senior-primary p-8 rounded-[2.5rem] text-2xl font-black hover:bg-senior-primary hover:text-white transition-all shadow-xl group"
        >
          <div className="group-hover:scale-125 transition-transform"><ICONS.History /></div>
          History ({historyCount})
        </button>
        <button 
          onClick={() => setView('profile')}
          className="flex items-center justify-center gap-4 bg-white border-4 border-senior-secondary p-8 rounded-[2.5rem] text-2xl font-black hover:bg-senior-secondary hover:text-white transition-all shadow-xl group"
        >
          <div className="group-hover:scale-125 transition-transform"><ICONS.Settings /></div>
          Settings
        </button>
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={processImage} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300 backdrop-blur-sm">
          <div className="relative">
            <div className="animate-spin rounded-full h-40 w-40 border-t-8 border-b-8 border-senior-accent mb-12"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-senior-accent scale-150"><ICONS.Camera /></div>
            </div>
          </div>
          <h2 className="text-5xl font-black text-white mb-6">EagleView is Thinking...</h2>
          <p className="text-3xl text-gray-300 max-w-xl leading-relaxed">Checking every detail for {activeSeniorName}. Scanning for important information.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-4 border-red-500 p-10 rounded-3xl text-red-900 text-3xl font-black text-center animate-in slide-in-from-top-4">
          {error}
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};

const ActionButton = ({ title, description, icon, onClick, disabled, color, badge }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full relative flex items-center gap-8 p-12 rounded-[3rem] text-left shadow-2xl transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 ${color} text-white border-b-[12px] border-black/20 group`}
  >
    <div className="bg-white/20 p-10 rounded-[2rem] group-hover:bg-white/30 transition-colors">
      <div className="scale-125">{icon}</div>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-5xl font-black tracking-tight">{title}</h2>
        {badge && <span className="bg-senior-accent text-senior-primary text-sm font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">{badge}</span>}
      </div>
      <p className="text-3xl opacity-90 font-medium">{description}</p>
    </div>
  </button>
);

export default Dashboard;
