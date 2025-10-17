export interface Evaluation {
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

export interface EvaluationSettings {
  id: string;
  user_id: string;
  run_policy: 'always' | 'sampled';
  sample_rate_prt: number;
  obfuscate_pii: boolean;
  max_eval_per_day: number;
  created_at: string;
  updated_at: string;
}

export interface KPIData {
  avgScore: number;
  avgLatency: number;
  successRate: number;
  totalEvaluations: number;
  piiRedactions: number;
}