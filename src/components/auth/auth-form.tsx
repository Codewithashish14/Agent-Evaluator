'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, Link } from 'lucide-react'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage('Check your email for the magic link!')
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        setMessage('Check your email for verification link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {isMagicLink 
            ? 'Sign in with Magic Link' 
            : (isSignUp ? 'Create Account' : 'Sign In')
          }
        </CardTitle>
        <CardDescription>
          {isMagicLink 
            ? 'Enter your email and we\'ll send you a magic link to sign in'
            : (isSignUp ? 'Create your account to start evaluating AI agents' : 'Sign in to your account')
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {!isMagicLink && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              'Loading...'
            ) : isMagicLink ? (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Magic Link
              </>
            ) : isSignUp ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Create Account
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>

          {message && (
            <div className={`p-3 rounded text-sm ${
              message.includes('Check your email') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-3 pt-4">
            {!isMagicLink && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsMagicLink(true)}
              >
                <Link className="w-4 h-4 mr-2" />
                Sign in with Magic Link
              </Button>
            )}

            {isMagicLink ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsMagicLink(false)}
              >
                Back to password sign in
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}