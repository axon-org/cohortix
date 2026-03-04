'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  User,
  Briefcase,
  Zap,
  Target,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const STEPS = [
  { id: 'identity', title: 'Identity', icon: User, description: "What's your name?" },
  { id: 'role', title: 'Role', icon: Briefcase, description: "What's your role?" },
  { id: 'work-style', title: 'Work Style', icon: Zap, description: 'How do you work best?' },
  { id: 'goals', title: 'Goals', icon: Target, description: 'What are your goals?' },
  {
    id: 'communication',
    title: 'Communication',
    icon: MessageSquare,
    description: 'How should I communicate?',
  },
  { id: 'avatar', title: 'Avatar', icon: ImageIcon, description: 'Upload avatar (optional)' },
];

export default function CloneFoundationOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    workStyle: [] as string[],
    goals: '',
    communicationTone: '',
    avatarUrl: '',
  });

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call to POST /api/v1/onboarding/clone-foundation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push('/');
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return !!formData.firstName;
      case 1:
        return !!formData.jobTitle;
      case 2:
        return formData.workStyle.length > 0;
      case 3:
        return !!formData.goals;
      case 4:
        return !!formData.communicationTone;
      case 5:
        return true; // Avatar is optional
      default:
        return false;
    }
  };

  const toggleWorkStyle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      workStyle: prev.workStyle.includes(style)
        ? prev.workStyle.filter((s) => s !== style)
        : [...prev.workStyle, style],
    }));
  };

  const step = STEPS[currentStep];
  if (!step) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[800px] h-[800px] rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-lg font-semibold">Clone Foundation</h1>
              </div>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            <div className="flex-1">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        placeholder="John"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g. Senior Software Engineer"
                    autoFocus
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Async',
                    'Sync',
                    'Deep Work',
                    'Collaborative',
                    'Technical',
                    'Creative',
                    'Data-Driven',
                    'Fast-Paced',
                  ].map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleWorkStyle(style)}
                      className={`p-3 rounded-lg border text-sm text-left transition-all ${
                        formData.workStyle.includes(style)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <Label htmlFor="goals">Your Goals</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => setFormData((prev) => ({ ...prev, goals: e.target.value }))}
                    placeholder="What do you want to achieve with your AI clone?"
                    className="h-32"
                    autoFocus
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <Label htmlFor="tone">Communication Tone</Label>
                  <Textarea
                    id="tone"
                    value={formData.communicationTone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, communicationTone: e.target.value }))
                    }
                    placeholder="e.g. Professional yet friendly, direct and concise..."
                    className="h-32"
                    autoFocus
                  />
                </div>
              )}

              {currentStep === 5 && (
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border rounded-xl p-8 space-y-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Click to upload avatar</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={nextStep}
              disabled={!isStepValid() || isSubmitting}
              className="gap-2 min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  Finish
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
