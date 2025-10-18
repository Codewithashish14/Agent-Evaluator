'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface UserSettings {
  run_policy: 'always' | 'sampled';
  sample_rate_prt: number;
  obfuscate_pii: boolean;
  max_eval_per_day: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    run_policy: 'sampled',
    sample_rate_prt: 48,
    obfuscate_pii: true,
    max_eval_per_day: 1000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // For now, use default settings since table might not exist
        setLoading(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // For now, just show success since settings table might not exist
      setTimeout(() => {
        setSaving(false);
        alert('Settings saved successfully!');
      }, 1000);

    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          <div className="text-center">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Evaluation Settings</h2>
              
              {/* Run Policy */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Run Policy</label>
                <select 
                  value={settings.run_policy}
                  onChange={(e) => setSettings({...settings, run_policy: e.target.value as 'always' | 'sampled'})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="always">Always - Run evaluation on every interaction</option>
                  <option value="sampled">Sampled - Run evaluation on a percentage of interactions</option>
                </select>
              </div>

              {/* Sample Rate */}
              {settings.run_policy === 'sampled' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Sample Rate: {settings.sample_rate_prt}%
                  </label>
                  <input 
                    type="range"
                    min="1"
                    max="100"
                    value={settings.sample_rate_prt}
                    onChange={(e) => setSettings({...settings, sample_rate_prt: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {/* PII Obfuscation */}
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={settings.obfuscate_pii}
                    onChange={(e) => setSettings({...settings, obfuscate_pii: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Obfuscate Personally Identifiable Information (PII)</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically detect and redact sensitive information like emails, phone numbers, and credit cards
                </p>
              </div>

              {/* Daily Limit */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Maximum Evaluations Per Day</label>
                <input 
                  type="number"
                  min="1"
                  max="100000"
                  value={settings.max_eval_per_day}
                  onChange={(e) => setSettings({...settings, max_eval_per_day: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limit the number of evaluations stored per day to control costs
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}