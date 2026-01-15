
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ICONS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SENIOR);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    const mockUser: User = {
      id: email.toLowerCase(), // Use email as unique ID for simulation
      email,
      name,
      role,
      assignedSeniors: role === UserRole.CAREGIVER ? [] : undefined
    };

    onLogin(mockUser);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl space-y-8 border-4 border-senior-primary">
      <div className="text-center space-y-2">
        <div className="inline-block bg-senior-accent p-4 rounded-2xl mb-4 text-senior-primary">
          <ICONS.Camera />
        </div>
        <h1 className="text-4xl font-bold text-senior-primary">Welcome to EagleView</h1>
        <p className="text-xl text-gray-600">Please sign in to continue</p>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <button 
          onClick={() => setRole(UserRole.SENIOR)}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${role === UserRole.SENIOR ? 'bg-white shadow text-senior-primary' : 'text-gray-500'}`}
        >
          Senior
        </button>
        <button 
          onClick={() => setRole(UserRole.CAREGIVER)}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${role === UserRole.CAREGIVER ? 'bg-white shadow text-senior-primary' : 'text-gray-500'}`}
        >
          Caregiver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xl font-bold mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 text-2xl border-4 border-gray-200 rounded-xl focus:border-senior-secondary outline-none"
            placeholder="e.g. Betty"
            required
          />
        </div>
        <div>
          <label className="block text-xl font-bold mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 text-2xl border-4 border-gray-200 rounded-xl focus:border-senior-secondary outline-none"
            placeholder="email@example.com"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-senior-primary text-white p-6 rounded-2xl text-2xl font-bold hover:bg-senior-secondary transition-colors"
        >
          {isSignup ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="text-center">
        <button 
          onClick={() => setIsSignup(!isSignup)}
          className="text-senior-secondary font-bold text-lg"
        >
          {isSignup ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
};

export default Login;
