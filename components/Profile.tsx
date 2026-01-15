
import React, { useState } from 'react';
import { User, UserPreferences, UserRole } from '../types';
import { ICONS } from '../constants';

interface ProfileProps {
  user: User;
  targetUserName: string;
  prefs: UserPreferences;
  onUpdatePrefs: (newPrefs: UserPreferences) => void;
  onLogout: () => void;
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, targetUserName, prefs, onUpdatePrefs, onLogout, onBack }) => {
  const [schedule, setSchedule] = useState(prefs.medicationSchedule);
  const [notification, setNotification] = useState(prefs.dailyNotification || '');

  const handleSave = () => {
    onUpdatePrefs({ 
      ...prefs, 
      medicationSchedule: schedule,
      dailyNotification: notification
    });
    onBack();
  };

  const isCaregiver = user.role === UserRole.CAREGIVER;

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-senior-primary">Settings</h2>
        <button onClick={onBack} className="text-xl font-bold text-senior-secondary bg-blue-50 px-6 py-2 rounded-xl">Close</button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-10 border-l-[12px] border-senior-accent">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div className="bg-senior-primary text-white p-5 rounded-full shadow-lg">
            <ICONS.User />
          </div>
          <div>
            <h3 className="text-3xl font-black text-senior-primary">{targetUserName}</h3>
            {isCaregiver && (
              <p className="text-xl text-senior-secondary font-bold flex items-center gap-2">
                Managed by You
              </p>
            )}
          </div>
        </div>

        {/* Care Settings Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-senior-accent p-2 rounded-lg text-senior-primary">
              <ICONS.Pill />
            </div>
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Care Plan</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-bold text-gray-600 mb-2">Medication Schedule / Pill Organizer</label>
              <textarea
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full h-32 p-5 text-xl border-4 border-gray-100 rounded-[1.5rem] focus:border-senior-secondary outline-none transition-all shadow-inner bg-gray-50"
                placeholder="Example: Morning (9 AM): 1 Blue pill, 2 White pills. Evening (7 PM): 1 Red capsule."
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-600 mb-2">Notification for the Day</label>
              <textarea
                value={notification}
                onChange={(e) => setNotification(e.target.value)}
                className="w-full h-24 p-5 text-xl border-4 border-gray-100 rounded-[1.5rem] focus:border-senior-secondary outline-none transition-all shadow-inner bg-gray-50"
                placeholder="Any special notes for today? (e.g., Doctor appointment at 2 PM)"
              />
              <p className="text-sm text-gray-400 mt-2 font-bold px-2">This message will appear prominently on the senior's dashboard.</p>
            </div>
          </div>
        </section>

        {/* Display Settings Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="bg-senior-secondary p-2 rounded-lg text-white">
                <ICONS.Settings />
             </div>
             <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Accessibility</h3>
          </div>
          
          <div className="grid gap-4">
             <button 
               onClick={() => onUpdatePrefs({ ...prefs, highContrast: !prefs.highContrast })}
               className={`flex justify-between items-center p-6 rounded-2xl border-4 transition-all shadow-md ${prefs.highContrast ? 'border-senior-primary bg-senior-primary/10' : 'border-gray-100 bg-white'}`}
             >
               <span className="text-2xl font-black">High Contrast Mode</span>
               <div className={`w-14 h-8 rounded-full relative transition-colors ${prefs.highContrast ? 'bg-senior-primary' : 'bg-gray-300'}`}>
                 <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${prefs.highContrast ? 'right-1' : 'left-1'}`} />
               </div>
             </button>

             <button 
               onClick={() => onUpdatePrefs({ ...prefs, fontSize: prefs.fontSize === 'large' ? 'normal' : 'large' })}
               className={`flex justify-between items-center p-6 rounded-2xl border-4 transition-all shadow-md ${prefs.fontSize === 'large' ? 'border-senior-primary bg-senior-primary/10' : 'border-gray-100 bg-white'}`}
             >
               <span className="text-2xl font-black">Extra Large Text</span>
               <span className={`text-xl font-black uppercase tracking-widest ${prefs.fontSize === 'large' ? 'text-senior-primary' : 'text-gray-400'}`}>
                 {prefs.fontSize === 'large' ? 'Active' : 'Off'}
               </span>
             </button>
          </div>
        </section>

        <div className="flex flex-col gap-4 pt-6">
          <button 
            onClick={handleSave} 
            className="w-full bg-senior-primary text-white p-7 rounded-[1.5rem] text-3xl font-black shadow-2xl hover:bg-senior-secondary active:scale-[0.98] transition-all"
          >
            Save All Settings
          </button>
          <button 
            onClick={onLogout} 
            className="w-full border-4 border-red-200 text-red-600 p-4 rounded-[1.5rem] text-xl font-black hover:bg-red-50 transition-colors"
          >
            Sign Out of EagleView
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
