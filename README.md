# AI Agent Evaluation Framework
## A multi-tenant Next.js application for monitoring and evaluating AI agent performance with real-time metrics, configurable evaluation rules, and comprehensive dashboards.

🚀 Live Demo
Deployed URL: [\[My Vercel App URL\]](https://agent-evaluator.vercel.app)
```
Test Credentials:

Email: test@example.com

Password: password123
```

### 📋 Features
Multi-tenant Architecture - Secure data isolation with Supabase RLS

Evaluation Configuration - Customizable run policies, sampling rates, and PII handling

Real-time Dashboard - KPIs, score distribution, and latency trends

Evaluation Management - Detailed view of all agent interactions

PII Obfuscation - Automatic detection and masking of sensitive information

Performance Optimized - Handles 20,000+ evaluation records with pagination

### 🛠 Tech Stack
```
Frontend: Next.js 14, React, TypeScript, Tailwind CSS

Backend: Next.js API Routes

Database: Supabase (PostgreSQL)

Authentication: Supabase Auth

Deployment: Vercel

UI Components: Custom design system
```

### 📁 Project Structure
```
text
src/
├── app/
│   ├── api/evals/ingest/route.ts     # Evaluation ingestion API
│   ├── dashboard/page.tsx            # Main dashboard
│   ├── evaluations/page.tsx          # All evaluations list
│   └── settings/page.tsx             # Configuration settings
├── components/
│   ├── auth/                         # Authentication components
│   ├── dashboard/                    # Dashboard-specific components
│   │   ├── charts.tsx                # Data visualization
│   │   ├── kpi-cards.tsx             # Key metrics cards
│   │   └── recent-evals.tsx          # Recent evaluations table
│   └── ui/                           # Reusable UI components

```
# 🗄 Database Schema

## Tables

### profiles

sql
```
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
evaluation_settings
sql
CREATE TABLE evaluation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  run_policy TEXT CHECK (run_policy IN ('always', 'sampled')) DEFAULT 'sampled',
  sample_rate_percent INTEGER CHECK (sample_rate_percent >= 0 AND sample_rate_percent <= 100) DEFAULT 50,
  obfuscate_pii BOOLEAN DEFAULT true,
  max_evaluations_per_day INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
evaluations
sql
CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  interaction_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  latency_ms INTEGER,
  flags TEXT[],
  pii_tokens_redacted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Getting Started
### Prerequisites
```
Node.js 18+

Supabase account

Vercel account (for deployment)

Installation
Clone the repository

bash
git clone [repo-url]
cd ai-agent-evaluator
Install dependencies

bash
npm install
Environment Setup

Database Setup

Execute the SQL schema in your Supabase SQL editor

Enable Row Level Security on all tables

Create the RLS policies as shown above

Run the development server
```
```
bash
npm run dev
```
Generate sample data
```
bash
npm run seed
📊 Seed Data
```
Generate realistic sample data for testing:
```
bash
npm run seed
```
The seed script creates:

Multiple test users

Evaluation settings for each user

50+ sample evaluations with varied scores, latencies, and PII scenarios

Time-series data for trend analysis

Sample Evaluation Data Includes:
Various prompt/response pairs

Scores ranging from 60% to 95%

Latencies from 150ms to 800ms

PII scenarios (emails, phone numbers)

Timestamps spanning multiple days for trend analysis

### 🔌 API Endpoints
POST /api/evals/ingest
Ingest new evaluation data from AI agents.

Request Body:
```
json
{
  "interaction_id": "test-T760797707535-1",
  "prompt": "What is AI?",
  "response": "Artificial Intelligence is...",
  "score": 85.0,
  "latency_ms": 200,
  "flags": ["helpful", "accurate"],
  "pii_tokens_redacted": 0
}
Response:

json
{
  "success": true,
  "evaluation_id": "uuid",
  "message": "Evaluation ingested successfully"
}
```
### 🎯 Configuration Settings
Users can configure:

Run Policy: always or sampled evaluations

Sample Rate: 0-100% of interactions to evaluate

PII Obfuscation: Auto-detect and mask sensitive information

Max Evaluations Per Day: Limit storage costs (default: 1000)

### 📈 Dashboard Metrics
Total Evaluations: Count of all agent interactions

Average Score: Overall performance score (0-100%)

Average Latency: Response time in milliseconds

Score Distribution: Breakdown by performance tiers

Latency Trends: 7-day performance timeline

### 🤖 AI Tools Used
GitHub Copilot: Code completion and helper functions

Cursor: Refactoring and optimization suggestions

Why used: These tools accelerated development while maintaining code quality, allowing focus on architecture and user experience rather than boilerplate code.

### 🚀 Deployment
Push to GitHub

Connect repository to Vercel

Configure environment variables in Vercel

Deploy automatically on git push

### 🔧 Troubleshooting
Common Issues:

RLS policies blocking data access - verify user authentication

Seed script failing - check Supabase service role key

Chart data not loading - verify evaluation timestamps

Support: Check Supabase logs for RLS violations and ensure proper user authentication flow.

## 📝 License
MIT License - feel free to use this project for learning and development purposes.

