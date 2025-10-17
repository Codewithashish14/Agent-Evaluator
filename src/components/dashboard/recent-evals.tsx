import { supabase } from '@/lib/supabase';

interface RecentEvalsProps {
  evaluations: any[];
}

export default function RecentEvals({ evaluations }: RecentEvalsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (evaluations.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Evaluations</h3>
        <div className="text-center text-gray-500 py-8">
          No evaluations found. Start by ingesting some evaluation data.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Recent Evaluations</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Latency</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PII</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {evaluations.map((evalItem) => (
              <tr key={evalItem.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {evalItem.interaction_id.slice(0, 8)}...
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`font-medium ${getScoreColor(evalItem.score)}`}>
                    {(evalItem.score * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{evalItem.latency_ms}ms</td>
                <td className="px-4 py-3 text-sm">{evalItem.pii_tokens_redacted}</td>
                <td className="px-4 py-3 text-sm">
                  {new Date(evalItem.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}