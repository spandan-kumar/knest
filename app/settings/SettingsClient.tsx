'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';

interface SettingsClientProps {
  session: Session;
}

export default function SettingsClient({ session }: SettingsClientProps) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Fetch current API key status
  useEffect(() => {
    fetchApiKeyStatus();
  }, []);

  const fetchApiKeyStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/settings');
      if (response.ok) {
        const data = await response.json();
        setHasKey(data.hasApiKey);
        setMaskedKey(data.maskedApiKey);
      }
    } catch (error) {
      console.error('Failed to fetch API key status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ geminiApiKey: apiKey }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasKey(true);
        setMaskedKey(data.maskedApiKey);
        setApiKey('');
        setMessage({ type: 'success', text: 'API key saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save API key. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key? You will not be able to analyze meetings without it.')) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        setHasKey(false);
        setMaskedKey(null);
        setMessage({ type: 'success', text: 'API key removed successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove API key. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-4xl font-light text-white">Settings</h1>
          </div>
          <p className="text-gray-400">Manage your account and API settings</p>
        </div>

        {/* Profile Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-light text-white mb-6">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
              <p className="text-gray-200">{session?.user?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <p className="text-gray-200">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-light text-white mb-4">Gemini API Key</h2>
          <p className="text-gray-400 mb-6">
            KNest uses your own Gemini API key to analyze meetings. Your key is encrypted and
            stored securely.
          </p>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Current Key Status */}
          {hasKey && maskedKey && (
            <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current API Key</p>
                  <p className="text-gray-200 font-mono">{maskedKey}</p>
                </div>
                <button
                  onClick={handleDeleteApiKey}
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {hasKey ? 'Update API Key' : 'Enter Your Gemini API Key'}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              />
              <p className="mt-2 text-xs text-gray-500">
                Get your API key from{' '}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <button
              onClick={handleSaveApiKey}
              disabled={isSaving || !apiKey.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? 'Saving...' : hasKey ? 'Update API Key' : 'Save API Key'}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-400 font-medium mb-2">Why do I need to provide my own API key?</h3>
            <p className="text-sm text-gray-400">
              KNest follows a Bring Your Own Key (BYOK) model. This means:
            </p>
            <ul className="mt-2 text-sm text-gray-400 space-y-1 list-disc list-inside">
              <li>You have full control over your API usage and costs</li>
              <li>Your meetings are processed directly with Google's API</li>
              <li>No third-party access to your API key or data</li>
              <li>You can track your usage in Google AI Studio</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
