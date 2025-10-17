interface KPICardsProps {
  avgScore: number;
  avgLatency: number;
  successRate: number;
  totalPII: number;
}

export default function KPICards({ avgScore, avgLatency, successRate, totalPII }: KPICardsProps) {
  const cards = [
    {
      title: 'Average Score',
      value: `${avgScore.toFixed(1)}%`,
      description: 'Average evaluation score'
    },
    {
      title: 'Avg Latency',
      value: `${avgLatency.toFixed(0)}ms`,
      description: 'Average response time'
    },
    {
      title: 'Success Rate',
      value: `${successRate.toFixed(1)}%`,
      description: 'Evaluations with score > 70%'
    },
    {
      title: 'PII Redactions',
      value: `${totalPII}`,
      description: 'Total PII tokens redacted'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg border p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
          <p className="text-2xl font-bold mt-2">{card.value}</p>
          <p className="text-xs text-gray-500 mt-1">{card.description}</p>
        </div>
      ))}
    </div>
  );
}