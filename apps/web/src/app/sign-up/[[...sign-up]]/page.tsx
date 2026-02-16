import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Rocket } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: '#0A0A0B' }}
    >
      {/* Radial gradient glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #5E6AD2 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Rocket className="w-5 h-5 text-[#0A0A0B]" />
          </div>
          <span className="text-2xl font-bold text-white">Cohortix</span>
        </div>

        {/* Clerk Sign Up Component */}
        <SignUp
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#5E6AD2',
              colorBackground: '#101012',
              colorInputBackground: '#0A0A0B',
              colorInputText: '#F2F2F2',
              borderRadius: '0.5rem',
            },
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-[#101012] border border-[#27282D] shadow-2xl',
              headerTitle: 'text-[#F2F2F2]',
              headerSubtitle: 'text-[#9CA3AF]',
              socialButtonsBlockButton:
                'bg-[#0A0A0B] border border-[#27282D] text-[#D1D5DB] hover:border-[#5E6AD2] transition-colors',
              formButtonPrimary:
                'bg-[#5E6AD2] hover:bg-[#7C8ADE] transition-colors',
              formFieldInput:
                'bg-[#0A0A0B] border border-[#27282D] text-[#F2F2F2] focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2]',
              formFieldLabel: 'text-[#D1D5DB]',
              footerActionLink: 'text-[#5E6AD2] hover:text-[#7C8ADE]',
              identityPreviewText: 'text-[#D1D5DB]',
              dividerLine: 'bg-[#27282D]',
              dividerText: 'text-[#6B7280]',
              formFieldInputShowPasswordButton: 'text-[#6B7280] hover:text-[#D1D5DB]',
              otpCodeFieldInput: 'bg-[#0A0A0B] border-[#27282D] text-[#F2F2F2]',
            },
          }}
        />
      </div>
    </div>
  );
}
