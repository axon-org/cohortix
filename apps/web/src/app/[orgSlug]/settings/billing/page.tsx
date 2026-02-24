import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-3">
        <CreditCard className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold mb-2">Billing & Subscription</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        Manage plans, payment methods, and billing history.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-md mt-4">
        <span className="w-2 h-2 bg-info rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">Placeholder</span>
      </div>
    </div>
  );
}
