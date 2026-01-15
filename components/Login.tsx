
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ICONS } from '../constants';
import { loginUser, signUpUser } from '../services/firebaseService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SENIOR);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        await signUpUser(email, password, name, role);
      } else {
        await loginUser(email, password);
      }
      // App.tsx handles the state change via onAuthStateChanged
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-white rounded-[3rem] shadow-2xl space-y-8 border-4 border-senior-primary animate-in zoom-in-95 duration-300">
      <div className="text-center space-y-2">
        <div className="inline-block bg-senior-accent p-5 rounded-3xl mb-4 text-senior-primary scale-125 shadow-lg">
          <ICONS.Camera />
        </div>
        <h1 className="text-5xl font-black text-senior-primary tracking-tighter">EagleView</h1>
        <p className="text-xl text-gray-500 font-bold">Secure AI Vision Assistant</p>
      </div>

      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
        <button 
          onClick={() => setRole(UserRole.SENIOR)}
          className={`flex-1 py-4 rounded-xl font-black text-lg transition-all ${role === UserRole.SENIOR ? 'bg-white shadow-md text-senior-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Senior
        </button>
        <button 
          onClick={() => setRole(UserRole.CAREGIVER)}
          className={`flex-1 py-4 rounded-xl font-black text-lg transition-all ${role === UserRole.CAREGIVER ? 'bg-white shadow-md text-senior-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Caregiver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignup && (
          <div>
            <label className="block text-xl font-black mb-2 text-senior-primary">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-5 text-2xl border-4 border-gray-100 rounded-2xl focus:border-senior-secondary outline-none transition-all"
              placeholder="e.g. Betty"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-xl font-black mb-2 text-senior-primary">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-5 text-2xl border-4 border-gray-100 rounded-2xl focus:border-senior-secondary outline-none transition-all"
            placeholder="email@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-xl font-black mb-2 text-senior-primary">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-5 text-2xl border-4 border-gray-100 rounded-2xl focus:border-senior-secondary outline-none transition-all"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl font-bold text-center animate-in shake duration-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-senior-primary text-white p-6 rounded-3xl text-3xl font-black shadow-xl hover:bg-senior-secondary transition-all disabled:opacity-50 active:scale-95"
        >
          {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <div className="text-center pt-4">
        <button 
          onClick={() => setIsSignup(!isSignup)}
          className="text-senior-secondary font-black text-xl hover:underline"
        >
          {isSignup ? 'Switch to Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
};

export default Login;
