
import React, { useEffect, useState, useRef } from 'react';
import { AnalysisResult, AnalysisType, ChatMessage } from '../types';
import { ICONS } from '../constants';
import { speak, stopSpeaking } from '../services/ttsService';
import { askFollowUpQuestion } from '../services/geminiService';

interface AnalysisViewProps {
  result: AnalysisResult;
  onBack: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleSpeak();
    return () => stopSpeaking();
  }, [result]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSpeak = (text?: string) => {
    let textToRead = text || `Result: ${result.summary}. `;
    
    if (!text) {
      if (result.type === AnalysisType.PILLBOX) {
        const compartments = result.details.compartments || [];
        if (compartments.length > 0) {
          textToRead += "Here is what I see: ";
          compartments.forEach((c: any) => {
            textToRead += `${c.name} is ${c.status}. ${c.description}. `;
          });
        }
      } else if (result.type === AnalysisType.FINE_PRINT) {
        if (result.details.dosage) textToRead += `Dosage: ${result.details.dosage}. `;
        if (result.details.warnings) textToRead += `Warnings: ${result.details.warnings}. `;
        if (result.details.fullSnippet) textToRead += `Additional text found: ${result.details.fullSnippet}. `;
      } else if (result.type === AnalysisType.DOCUMENT) {
        textToRead += `Document type: ${result.details.docType}. `;
        if (result.details.fraudRisk) textToRead += `Fraud risk level is ${result.details.fraudRisk}. `;
        if (result.details.fraudReasoning) textToRead += `Reasoning: ${result.details.fraudReasoning}. `;
      }
    }

    setIsPlaying(true);
    speak(textToRead);
  };

  const stopAudio = () => {
    stopSpeaking();
    setIsPlaying(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    try {
      const response = await askFollowUpQuestion(result.details, result.imageUrl, userMsg.text);
      const aiMsg: ChatMessage = { role: 'ai', text: response };
      setMessages(prev => [...prev, aiMsg]);
      handleSpeak(response);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-lg border border-gray-100 sticky top-20 z-40">
        <button 
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-xl font-bold text-xl flex items-center gap-2 transition-colors"
        >
          <ICONS.X /> Back
        </button>
        <button 
          onClick={isPlaying ? stopAudio : () => handleSpeak()}
          className="bg-senior-accent px-8 py-3 rounded-xl font-black text-xl flex items-center gap-3 shadow-md hover:scale-105 active:scale-95 transition-all text-senior-primary"
        >
          <ICONS.Speaker /> {isPlaying ? 'Mute' : 'Listen'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Visual Content */}
        <div className="space-y-4 lg:sticky lg:top-40">
          <div className="bg-white p-3 rounded-[2.5rem] shadow-2xl border-4 border-senior-secondary overflow-hidden aspect-square flex items-center justify-center">
             <img 
               src={result.imageUrl} 
               alt="Captured Analysis" 
               className="max-h-full max-w-full rounded-2xl object-contain"
             />
          </div>
          <div className="bg-senior-primary text-white p-5 rounded-2xl text-center font-black uppercase tracking-[0.3em] shadow-lg">
            {result.type.replace('_', ' ')} ANALYSIS
          </div>
        </div>

        {/* Informational Content & Chat */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl space-y-8 border-l-[12px] border-senior-accent">
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-gray-400 tracking-tighter">Insights</h2>
              <p className="text-3xl font-black text-senior-primary leading-tight">{result.summary}</p>
            </div>

            {result.type === AnalysisType.PILLBOX && (
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-2xl font-black text-gray-700">Compartments</h3>
                {result.details.compartments?.map((c: any, i: number) => (
                  <div key={i} className={`p-5 rounded-2xl border-4 transition-all ${c.status.toLowerCase().includes('empty') ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-blue-50 border-blue-400 shadow-md'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-2xl uppercase tracking-tight">{c.name}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${c.status.toLowerCase().includes('empty') ? 'bg-gray-200' : 'bg-blue-200 text-blue-800'}`}>{c.status}</span>
                    </div>
                    <p className="text-xl font-medium text-gray-700">{c.description}</p>
                  </div>
                ))}
              </div>
            )}

            {result.type === AnalysisType.FINE_PRINT && (
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className="grid gap-4">
                  {result.details.dosage && <DataCard label="Suggested Dosage" value={result.details.dosage} color="bg-blue-50 border-blue-200 text-blue-900" />}
                  {result.details.warnings && <DataCard label="Crucial Warnings" value={result.details.warnings} color="bg-red-50 border-red-300 text-red-900" />}
                  {result.details.expiry && <DataCard label="Expires On" value={result.details.expiry} color="bg-green-50 border-green-200 text-green-900" />}
                </div>
              </div>
            )}

            {result.type === AnalysisType.DOCUMENT && (
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <div className={`p-8 rounded-[2rem] border-[6px] shadow-lg ${
                  result.fraudRisk === 'High' ? 'bg-red-100 border-red-500' : 
                  result.fraudRisk === 'Medium' ? 'bg-yellow-100 border-yellow-500' : 'bg-green-100 border-green-500'
                }`}>
                  <h3 className="text-2xl font-black flex items-center gap-3 mb-2">
                    <span className="text-4xl">⚠️</span> Security Risk: {result.fraudRisk}
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="bg-senior-primary/5 p-8 rounded-[2.5rem] border-4 border-senior-primary shadow-xl space-y-6">
            <h3 className="text-3xl font-black text-senior-primary flex items-center gap-3">
              <span>💬</span> Ask a Question
            </h3>
            
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {messages.length === 0 && (
                <p className="text-xl text-gray-400 font-bold italic">Examples: "Is this safe to take with food?" or "When is the bill due?"</p>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-xl font-bold shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-senior-primary text-white rounded-tr-none' 
                      : 'bg-white text-senior-primary rounded-tl-none border-2 border-senior-primary/20'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-white p-4 rounded-3xl rounded-tl-none animate-pulse border-2 border-senior-primary/20">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-senior-primary rounded-full"></div>
                        <div className="w-2 h-2 bg-senior-primary rounded-full"></div>
                        <div className="w-2 h-2 bg-senior-primary rounded-full"></div>
                      </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="relative mt-4">
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your question..."
                className="w-full p-6 pr-20 text-xl font-bold border-4 border-white rounded-2xl shadow-lg focus:border-senior-accent outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={!userInput.trim() || isTyping}
                className="absolute right-3 top-3 bottom-3 px-6 bg-senior-primary text-white rounded-xl font-black hover:bg-senior-secondary disabled:opacity-50 transition-all"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataCard = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className={`p-6 rounded-2xl border-4 ${color}`}>
    <span className="block font-black uppercase text-xs tracking-widest opacity-60 mb-1">{label}</span>
    <span className="text-2xl font-black leading-tight">{value}</span>
  </div>
);

export default AnalysisView;
