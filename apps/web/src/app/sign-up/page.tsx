import { SignUp } from '@clerk/nextjs';

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

      {/* Clerk Sign Up Component */}
      <div className="relative z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-[#101012] border border-[#27282D] shadow-xl',
              headerTitle: 'text-[#F2F2F2]',
              headerSubtitle: 'text-[#9CA3AF]',
              socialButtonsBlockButton: 'bg-[#0A0A0B] border border-[#27282D] text-[#D1D5DB] hover:border-[#5E6AD2]',
              formButtonPrimary: 'bg-[#5E6AD2] hover:bg-[#7C8ADE]',
              formFieldInput: 'bg-[#0A0A0B] border border-[#27282D] text-[#F2F2F2] focus:border-[#5E6AD2]',
              formFieldLabel: 'text-[#D1D5DB]',
              footerActionLink: 'text-[#5E6AD2] hover:text-[#7C8ADE]',
              identityPreviewText: 'text-[#D1D5DB]',
              dividerLine: 'bg-[#27282D]',
              dividerText: 'text-[#6B7280]',
            },
          }}
        />
      </div>
    </div>
  );
}
