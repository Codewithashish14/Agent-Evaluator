'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validate passwords match for signup
      if (isSignUp && password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (isSignUp) {
        // SIGN UP LOGIC
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim(),
            }
          }
        })
        
        if (error) throw error
        
        if (data.user) {
          // Create user profile in your profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                email: email.trim(),
                name: name.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])

          if (profileError) {
            console.error('Error creating profile:', profileError)
          }

          setMessage('Account created successfully! Please check your email for verification.')
          // Optional: Auto-login after signup
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } else {
        // SIGN IN LOGIC
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })
        if (error) throw error

        if (data.session) {
          setMessage('Login successful! Redirecting...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setMessage('')
    // Clear form when toggling
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-white/70 text-sm">
          {isSignUp ? 'Sign up to get started with AgentEvaluator' : 'Sign in to your account to continue'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-white/50 transition-colors"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-white/50 transition-colors"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-white/50 transition-colors"
            placeholder="Enter your password"
            minLength={6}
          />
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={isSignUp}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-white/50 transition-colors"
              placeholder="Confirm your password"
              minLength={6}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 transform hover:scale-105"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isSignUp ? 'Creating Account...' : 'Signing in...'}
            </span>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>

        {message && (
          <div className={`p-4 rounded-lg text-sm border ${
            message.includes('successful') || message.includes('created') || message.includes('check your email')
              ? 'bg-green-500/20 text-green-200 border-green-500/30' 
              : 'bg-red-500/20 text-red-200 border-red-500/30'
          }`}>
            <div className="flex items-center">
              {message.includes('successful') || message.includes('created') || message.includes('check your email') ? (
                <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message}
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-cyan-300 hover:text-cyan-200 font-medium text-sm transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
        <h3 className="font-semibold text-cyan-300 text-sm mb-2">Quick Start</h3>
        <p className="text-cyan-200 text-sm">Use any email and password to create an account instantly.</p>
      </div>
    </div>
  )
}