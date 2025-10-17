'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserSettings {
  run_policy: 'always' | 'sampled';
  sample_rate_prt: number;
  obfuscate_pii: boolean;
  max_eval_per_day: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    run_policy: 'sampled',
    sample_rate_prt: 10,
    obfuscate_pii: true,
    max_eval_per_day: 1000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings');
      } else {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
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
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}