import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Missing Supabase environment variables')
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	var __supabase_client: any | undefined
}

function getSupabaseClient() {
	if (typeof window !== 'undefined') {
		const g = globalThis as any
		if (!g.__supabase_client) {
			g.__supabase_client = createClient(supabaseUrl!, supabaseAnonKey!)
		}
		return g.__supabase_client
	}

	return createClient(supabaseUrl!, supabaseAnonKey!)
}

export const supabase = getSupabaseClient()