'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

export default function DashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate KPIs
  const scores = evaluations.map(e => e.score)
  const latencies = evaluations.map(e => e.latency_ms)
  
  const kpiData = {
    avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    avgLatency: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
    successRate: scores.length ? (scores.filter(s => s >= 80).length / scores.length) * 100 : 0,
    totalEvaluations: evaluations.length,
    piiRedactions: evaluations.reduce((sum, e) => sum + e.pii_tokens_redacted, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link 
          href="/settings"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
        >
          Settings
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Average Score Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Average Score</h3>
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{kpiData.avgScore.toFixed(1)}%</p>
        </div>

        {/* Avg Latency Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Avg Latency</h3>
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {kpiData.avgLatency < 1000 ? `${Math.round(kpiData.avgLatency)}ms` : `${(kpiData.avgLatency / 1000).toFixed(2)}s`}
          </p>
        </div>

        {/* Success Rate Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Success Rate</h3>
            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{kpiData.successRate.toFixed(1)}%</p>
        </div>

        {/* PII Redactions Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">PII Redactions</h3>
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{kpiData.piiRedactions}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Score Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Trend (7 days)</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart will appear here when data is available
          </div>
        </div>

        {/* Evaluation Volume */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Volume</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Chart will appear here when data is available
          </div>
        </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Evaluations</h3>
        {evaluations.length > 0 ? (
          <div className="space-y-3">
            {evaluations.slice(0, 5).map((evalItem) => (
              <div key={evalItem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    evalItem.score >= 80 ? 'bg-green-500' : 
                    evalItem.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{evalItem.interaction_id}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(evalItem.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`font-bold ${
                      evalItem.score >= 80 ? 'text-green-600' : 
                      evalItem.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {evalItem.score}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {evalItem.latency_ms}ms
                    </div>
                  </div>
                  {evalItem.pii_tokens_redacted > 0 && (
                    <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                      {evalItem.pii_tokens_redacted} PII
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No evaluations yet. Data will appear here after running the seed script.
          </div>
        )}
      </div>
    </div>
  )
}