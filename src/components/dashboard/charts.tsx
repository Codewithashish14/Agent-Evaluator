'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ChartsProps {
  scoreTrend: { date: string; score: number }[];
  evalVolume: { date: string; count: number }[];
}

export default function Charts({ scoreTrend, evalVolume }: ChartsProps) {
  return (
    <>
      {/* Score Trend Chart */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Score Trend (7 days)</h3>
        {scoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available for the last 7 days
          </div>
        )}
      </div>

      {/* Evaluation Volume Chart */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Evaluation Volume</h3>
        {evalVolume.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={evalVolume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available for the last 7 days
          </div>
        )}
      </div>
    </>
  );
}