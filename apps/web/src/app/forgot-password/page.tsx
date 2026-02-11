'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred sending the reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#0A0A0B' }}>
      {/* Radial gradient glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #5E6AD2 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo Icon */}
          <div 
            className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
            style={{ backgroundColor: '#5E6AD2' }}
          >
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path 
                d="M12 2L2 7L12 12L22 7L12 2Z" 
                fill="currentColor"
                fillOpacity="0.8"
              />
              <path 
                d="M2 17L12 22L22 17" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2 12L12 17L22 12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          {/* Brand Name */}
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#F2F2F2' }}>
            Cohortix
          </h1>
          
          {/* Tagline */}
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Your AI crew, ready for action
          </p>
        </div>

        {/* Reset Password Card */}
        <div 
          className="rounded-xl p-8 backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(16, 16, 18, 0.6)',
            border: '1px solid #27282D',
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#F2F2F2' }}>
            Reset your password
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
            Enter your email address and we'll send you a reset link
          </p>

          {success ? (
            <div
              className="text-sm p-4 rounded-lg mb-6"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#86EFAC',
              }}
            >
              <p className="font-medium mb-1">Check your email!</p>
              <p style={{ color: '#9CA3AF' }}>
                We've sent a password reset link to {email}
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div 
                  className="text-sm p-3 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#FCA5A5',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#D1D5DB' }}
                >
                  EMAIL ADDRESS
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#0A0A0B',
                    border: '1px solid #27282D',
                    color: '#F2F2F2',
                  }}
                  placeholder="you@example.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5E6AD2'
                    e.target.style.boxShadow = '0 0 0 3px rgba(94, 106, 210, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#27282D'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Send Reset Link Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#5E6AD2',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#7C8ADE'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#5E6AD2'
                }}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

          {/* Back to Sign In Link */}
          <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
            <Link 
              href="/sign-in" 
              className="font-medium transition-colors"
              style={{ color: '#5E6AD2' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7C8ADE'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#5E6AD2'
              }}
            >
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
