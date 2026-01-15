
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

  const handleSave = () => {
    onUpdatePrefs({ ...prefs, medicationSchedule: schedule });
    onBack();
  };

  const isCaregiver = user.role === UserRole.CAREGIVER;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl font-bold text-senior-primary">Settings for {targetUserName}</h2>
        <button onClick={onBack} className="text-xl font-bold text-senior-secondary">Close</button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl space-y-8 border-l-8 border-senior-accent">
        <div className="flex items-center gap-6 pb-6 border-b">
          <div className="bg-senior-primary text-white p-4 rounded-full">
            <ICONS.User />
          </div>
          <div>
            <h3 className="text-3xl font-bold">{targetUserName}</h3>
            {isCaregiver && <p className="text-xl text-senior-secondary font-bold">Managed by {user.name} (Caregiver)</p>}
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="text-2xl font-bold">Display Settings</h3>
          <div className="grid gap-4">
             <button 
               onClick={() => onUpdatePrefs({ ...prefs, highContrast: !prefs.highContrast })}
               className={`flex justify-between items-center p-6 rounded-2xl border-4 transition-all ${prefs.highContrast ? 'border-senior-primary bg-senior-primary/10' : 'border-gray-200'}`}
             >
               <span className="text-2xl font-bold">High Contrast</span>
               <div className={`w-12 h-6 rounded-full relative ${prefs.highContrast ? 'bg-senior-accent' : 'bg-gray-300'}`}>
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.highContrast ? 'right-1' : 'left-1'}`} />
               </div>
             </button>

             <button 
               onClick={() => onUpdatePrefs({ ...prefs, fontSize: prefs.fontSize === 'large' ? 'normal' : 'large' })}
               className={`flex justify-between items-center p-6 rounded-2xl border-4 transition-all ${prefs.fontSize === 'large' ? 'border-senior-primary bg-senior-primary/10' : 'border-gray-200'}`}
             >
               <span className="text-2xl font-bold">Large Text</span>
               <span className="text-xl font-bold text-senior-secondary uppercase">{prefs.fontSize}</span>
             </button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-2xl font-bold">Medication Schedule</h3>
          <textarea
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="w-full h-40 p-4 text-xl border-4 border-gray-200 rounded-xl focus:border-senior-secondary outline-none"
            placeholder="e.g. 1 Blue pill every morning at 9am."
          />
        </section>

        <div className="flex gap-4 pt-4">
          <button onClick={handleSave} className="flex-1 bg-senior-primary text-white p-6 rounded-2xl text-2xl font-bold">Save Settings</button>
          <button onClick={onLogout} className="px-8 border-4 border-red-500 text-red-600 rounded-2xl text-xl font-bold">Log Out</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
