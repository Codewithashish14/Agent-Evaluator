'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface DashboardData {
  avgScore: number;
  avgLatency: number;
  successRate: number;
  totalPII: number;
  recentEvals: any[];
  totalEvaluations: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Starting to load dashboard data...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('User:', user);
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      // Get evaluations from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log('Fetching evaluations for user:', user.id);
      
      const { data: evaluations, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      console.log('Evaluations fetched:', evaluations);

      if (error) {
        console.error('Error fetching evaluations:', error);
        setData({
          avgScore: 0,
          avgLatency: 0,
          successRate: 0,
          totalPII: 0,
          recentEvals: [],
          totalEvaluations: 0
        });
        setLoading(false);
        return;
      }

      if (evaluations && evaluations.length > 0) {
        console.log('Processing', evaluations.length, 'evaluations');
        
        // FIXED CALCULATIONS - Handle string/number conversion properly
        const totalEvals = evaluations.length;
        
        // Convert scores to numbers and calculate average
        const totalScore = evaluations.reduce((acc, evalItem) => {
          const score = parseFloat(evalItem.score);
          return acc + (isNaN(score) ? 0 : score);
        }, 0);
        
        const avgScore = (totalScore / totalEvals) * 100;
        
        // Calculate average latency
        const totalLatency = evaluations.reduce((acc, evalItem) => {
          const latency = parseInt(evalItem.latency_ms);
          return acc + (isNaN(latency) ? 0 : latency);
        }, 0);
        const avgLatency = totalLatency / totalEvals;
        
        // Calculate success rate (score > 0.7 = 70%)
        const successfulEvals = evaluations.filter(evalItem => {
          const score = parseFloat(evalItem.score);
          return !isNaN(score) && score > 0.7;
        }).length;
        const successRate = (successfulEvals / totalEvals) * 100;
        
        // Calculate total PII
        const totalPII = evaluations.reduce((acc, evalItem) => {
          const pii = parseInt(evalItem.pii_tokens_redacted);
          return acc + (isNaN(pii) ? 0 : pii);
        }, 0);

        console.log('Calculated metrics:', {
          avgScore,
          avgLatency,
          successRate,
          totalPII,
          totalEvals,
          successfulEvals
        });

        setData({
          avgScore,
          avgLatency,
          successRate,
          totalPII,
          recentEvals: evaluations.slice(0, 10),
          totalEvaluations: totalEvals
        });
      } else {
        console.log('No evaluations found for user');
        setData({
          avgScore: 0,
          avgLatency: 0,
          successRate: 0,
          totalPII: 0,
          recentEvals: [],
          totalEvaluations: 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setData({
        avgScore: 0,
        avgLatency: 0,
        successRate: 0,
        totalPII: 0,
        recentEvals: [],
        totalEvaluations: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to add test data with dates for charts
  const addTestData = async () => {
    setMessage('Adding test data with dates for charts...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('Please log in first');
      return;
    }

    // Create test data spread across the last 7 days
    const testEvaluations = [];
    const today = new Date();
    
    // Add evaluations for each of the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add 2 evaluations per day with different scores
      testEvaluations.push(
        {
          interaction_id: `day-${i}-high-${Date.now()}`,
          prompt: `Question about day ${i} topic A`,
          response: `Accurate response for day ${i}`,
          score: 0.85 + (Math.random() * 0.1), // 85-95%
          latency_ms: 100 + (Math.random() * 200),
          flags: [],
          pii_tokens_redacted: 0,
          user_id: user.id,
          created_at: date.toISOString()
        },
        {
          interaction_id: `day-${i}-medium-${Date.now()}`,
          prompt: `Question about day ${i} topic B`,
          response: `Partial response for day ${i}`,
          score: 0.70 + (Math.random() * 0.15), // 70-85%
          latency_ms: 150 + (Math.random() * 300),
          flags: i % 3 === 0 ? ["contains_pii"] : [], // Some have PII
          pii_tokens_redacted: i % 3 === 0 ? 2 : 0,
          user_id: user.id,
          created_at: date.toISOString()
        }
      );
    }

    try {
      console.log('Inserting test data with dates...');
      
      const { data: insertedData, error } = await supabase
        .from('evaluations')
        .insert(testEvaluations)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message);
      }

      console.log('Data inserted successfully:', insertedData);
      
      setMessage('Test data with dates added successfully! Refreshing...');
      setTimeout(() => {
        loadDashboardData();
        setMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding test data:', error);
      setMessage('Error adding test data: ' + (error as Error).message);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {data?.totalEvaluations || 0} total evaluations
            </p>
          </div>
          <button
            onClick={addTestData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Test Data
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            <div className="flex items-center">
              {message.includes('Error') ? (
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data?.avgScore.toFixed(1)}%
                </p>
              </div>
              <div className={`p-2 rounded-full ${getScoreColor(data?.avgScore ? data.avgScore / 100 : 0)}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Overall performance score</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data?.avgLatency.toFixed(0)}ms
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Average response time</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data?.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-50 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Score &gt; 70%</p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PII Redactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data?.totalPII}
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-50 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Total PII tokens redacted</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Trend Chart */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Trend (7 days)</h3>
            <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2">Chart will appear here when data is available</p>
                <p className="text-sm">Add evaluation data with different dates</p>
              </div>
            </div>
          </div>

          {/* Evaluation Volume Chart */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Volume</h3>
            <div className="h-80 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2">Chart will appear here when data is available</p>
                <p className="text-sm">Add evaluation data with different dates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Evaluations</h2>
            <p className="text-sm text-gray-600 mt-1">
              Latest agent interactions and their performance metrics
            </p>
          </div>
          
          {data?.recentEvals.length ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PII
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recentEvals.map((evalItem) => (
                    <tr key={evalItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {evalItem.interaction_id?.slice(0, 12)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(evalItem.score)}`}>
                          {(parseFloat(evalItem.score) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{evalItem.latency_ms}ms</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{evalItem.pii_tokens_redacted}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(evalItem.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No evaluations</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding some evaluation data.
              </p>
              <div className="mt-6">
                <button
                  onClick={addTestData}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
      </div>
    </div>
  );
}