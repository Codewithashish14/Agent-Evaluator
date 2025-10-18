'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Evaluation {
  id: string;
  user_id: string;
  interaction_id: string;
  prompt: string;
  response: string;
  score: number;
  latency_ms: number;
  flags: string[];
  pii_tokens_redacted: number;
  created_at: string;
}

// Normalize score to handle both 0-1 and 0-100 formats
function normalizeScore(raw: number) {
  if (raw === null || raw === undefined) return 0;
  return raw <= 1 ? raw * 100 : raw;
}

export default function DashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvaluations((data as Evaluation[]) || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ADD TEST DATA FUNCTION
  const addTestData = async () => {
    setMessage('Adding test data...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('Please log in first');
      return;
    }

    const now = Date.now();
    const testData = [
      {
        interaction_id: `test-${now}-1`,
        prompt: 'What is AI?',
        response: 'AI stands for Artificial Intelligence...',
        score: 85, // percent
        latency_ms: 200,
        flags: [],
        pii_tokens_redacted: 0,
        user_id: user.id,
        created_at: new Date().toISOString(),
      },
      {
        interaction_id: `test-${now}-2`,
        prompt: 'Explain machine learning',
        response: 'Machine learning is a subset of AI...',
        score: 72,
        latency_ms: 300,
        flags: [],
        pii_tokens_redacted: 1,
        user_id: user.id,
        created_at: new Date().toISOString(),
      },
      {
        interaction_id: `test-${now}-3`,
        prompt: 'What is Python?',
        response: 'Python is a programming language...',
        score: 91,
        latency_ms: 150,
        flags: [],
        pii_tokens_redacted: 0,
        user_id: user.id,
        created_at: new Date().toISOString(),
      },
    ];

    try {
      const { error } = await supabase.from('evaluations').insert(testData);
      if (error) throw error;

      setMessage('Test data added successfully! Refreshing...');
      setTimeout(() => {
        fetchDashboardData();
        setMessage('');
      }, 1200);
    } catch (err: any) {
      setMessage('Error: ' + (err?.message || String(err)));
    }
  };

  // Calculate KPIs
  const normalizedScores = evaluations.map((e) => normalizeScore(e.score));
  const latencies = evaluations.map((e) => e.latency_ms);
  
  const kpiData = {
    avgScore: normalizedScores.length ? normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length : 0,
    avgLatency: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    successRate: normalizedScores.length ? (normalizedScores.filter((s) => s >= 80).length / normalizedScores.length) * 100 : 0,
    totalEvaluations: evaluations.length,
    piiRedactions: evaluations.reduce((sum, e) => sum + e.pii_tokens_redacted, 0),
  };

  // Chart data preparation
  const scoreDistribution = {
    excellent: evaluations.filter(e => normalizeScore(e.score) >= 80).length,
    good: evaluations.filter(e => normalizeScore(e.score) >= 60 && normalizeScore(e.score) < 80).length,
    poor: evaluations.filter(e => normalizeScore(e.score) < 60).length
  };

  // Prepare data for latency trend chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const latencyTrendData = last7Days.map(date => {
    const dayEvaluations = evaluations.filter(e => 
      e.created_at.split('T')[0] === date
    );
    return {
      date,
      avgLatency: dayEvaluations.length ? 
        dayEvaluations.reduce((sum, e) => sum + e.latency_ms, 0) / dayEvaluations.length : 0
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header with buttons (NO LOGOUT) */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">{kpiData.totalEvaluations} total evaluations</p>
        </div>
        
        <div className="flex gap-4">
          {/* ADD TEST DATA BUTTON */}
          <button
            onClick={addTestData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Test Data
          </button>

          {/* SETTINGS BUTTON */}
          <Link 
            href="/settings"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-medium transition-all duration-200 hover:scale-105"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 animate-pulse ${
          message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Average Score', value: `${kpiData.avgScore.toFixed(1)}%`, color: 'bg-green-500' },
          { label: 'Avg Latency', value: kpiData.avgLatency < 1000 ? `${Math.round(kpiData.avgLatency)}ms` : `${(kpiData.avgLatency / 1000).toFixed(2)}s`, color: 'bg-blue-500' },
          { label: 'Success Rate', value: `${kpiData.successRate.toFixed(1)}%`, color: 'bg-emerald-500' },
          { label: 'PII Redactions', value: kpiData.piiRedactions.toString(), color: 'bg-orange-500' },
        ].map((kpi, index) => (
          <div 
            key={kpi.label}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">{kpi.label}</h3>
              <div className={`w-4 h-4 ${kpi.color} rounded-full`}></div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* CHARTS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Score Distribution Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <div className="space-y-3">
            {[
              { label: 'Excellent (80-100%)', count: scoreDistribution.excellent, color: 'bg-green-500', bgColor: 'bg-green-100', textColor: 'text-green-800', barColor: 'bg-green-500' },
              { label: 'Good (60-79%)', count: scoreDistribution.good, color: 'bg-yellow-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', barColor: 'bg-yellow-500' },
              { label: 'Poor (<60%)', count: scoreDistribution.poor, color: 'bg-red-500', bgColor: 'bg-red-100', textColor: 'text-red-800', barColor: 'bg-red-500' },
            ].map((item, index) => (
              <div 
                key={item.label}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${item.color} rounded-full mr-2`}></div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                  <div 
                    className={`${item.barColor} h-2 rounded-full transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${(item.count / evaluations.length) * 100 || 0}%`,
                      animation: 'growWidth 1s ease-out'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Trend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latency Trend (Last 7 Days)</h3>
          <div className="space-y-2">
            {latencyTrendData.map((day, index) => (
              <div 
                key={day.date}
                className="flex items-center justify-between animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-sm text-gray-600 w-20">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${Math.min((day.avgLatency / 1000) * 100, 100)}%`,
                        animation: 'growWidth 1s ease-out'
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {day.avgLatency ? `${Math.round(day.avgLatency)}ms` : 'No data'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EVALUATIONS TABLE WITH ANIMATIONS */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Evaluations</h3>
          <p className="text-gray-600 text-sm mt-1">Detailed view of all your AI agent evaluations</p>
        </div>
        
        {evaluations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Interaction ID', 'Prompt', 'Score', 'Latency', 'PII', 'Date'].map((header, index) => (
                    <th 
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider transition-colors duration-200 hover:text-gray-700"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluations.map((evalItem, index) => {
                  const score = normalizeScore(evalItem.score);
                  // Define color classes based on score
                  const scoreColorClass = score >= 80 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : score >= 60 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200';
                  
                  return (
                    <tr 
                      key={evalItem.id}
                      className="hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        animation: 'slideInRight 0.5s ease-out forwards'
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 transition-colors duration-200 hover:text-blue-600">
                          {evalItem.interaction_id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate transition-all duration-200 hover:max-w-none hover:whitespace-normal">
                          {evalItem.prompt}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-110 ${scoreColorClass}`}
                        >
                          {score.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 transition-colors duration-200 hover:text-blue-600">
                          {evalItem.latency_ms}ms
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evalItem.pii_tokens_redacted > 0 ? (
                          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium transition-all duration-300 hover:scale-110 hover:bg-orange-200">
                            {evalItem.pii_tokens_redacted}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 transition-colors duration-200 hover:text-gray-700">
                        {new Date(evalItem.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 animate-pulse">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding some test data.</p>
            <div className="mt-6">
              <button
                onClick={addTestData}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Test Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes growWidth {
          from {
            width: 0%;
          }
          to {
            width: var(--target-width);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}