import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  console.error('Make sure you have a .env.local file with these variables');
  process.exit(1);
}

// Create Supabase client directly for the seed script
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDatabase() {
  console.log('Starting database seed...');
  
  try {
    // Get the current user (you need to be signed in via the app first)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Please sign in first to seed data');
      console.log('Steps:');
      console.log('1. Run: npm run dev');
      console.log('2. Open http://localhost:3000');
      console.log('3. Sign in to your app');
      console.log('4. Then run: npm run seed');
      return;
    }

    console.log(`Seeding data for user: ${user.email}`);

    // Create user settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        run_policy: 'sampled',
        sample_rate_prt: 20,
        obfuscate_pii: true,
        max_eval_per_day: 1000
      }, {
        onConflict: 'user_id'
      });

    if (settingsError) {
      console.error('Error creating settings:', settingsError.message);
    } else {
      console.log('User settings created');
    }

    // Generate sample evaluations (20 records for good demo data)
    const sampleEvaluations = Array.from({ length: 20 }, (_, i) => {
      const score = faker.number.float({ min: 0.3, max: 1.0, fractionDigits: 2 });
      const hasPII = faker.datatype.boolean({ probability: 0.3 });
      
      return {
        user_id: user.id,
        interaction_id: `interaction-${user.id.slice(0, 8)}-${i + 1}`,
        prompt: hasPII 
          ? `My email is ${faker.internet.email()} and phone is ${faker.phone.number()} - ${faker.lorem.sentence()}`
          : faker.lorem.sentence(),
        response: faker.lorem.paragraph(),
        score: score,
        latency_ms: faker.number.int({ min: 50, max: 2000 }),
        flags: score < 0.7 ? ['low_score'] : [],
        pii_tokens_redacted: hasPII ? faker.number.int({ min: 1, max: 3 }) : 0,
        created_at: faker.date.recent({ days: 30 }).toISOString()
      };
    });

    const { error: evalError } = await supabase
      .from('evaluations')
      .insert(sampleEvaluations);

    if (evalError) {
      console.error('Error inserting evaluations:', evalError.message);
    } else {
      console.log(`${sampleEvaluations.length} sample evaluations created`);
    }

    console.log('Seed completed! Check your dashboard now.');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };