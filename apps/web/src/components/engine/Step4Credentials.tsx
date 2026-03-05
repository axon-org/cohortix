import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardData } from "./types";
import { useState } from "react";
import { Eye, EyeOff, Terminal, Clipboard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function Step4Credentials({ 
  data, 
  updateData, 
  onNext, 
  onBack 
}: { 
  data: WizardData; 
  updateData: (d: Partial<WizardData>) => void; 
  onNext: () => void; 
  onBack: () => void; 
}) {
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.gatewayUrl.startsWith('http')) {
      setError('Gateway URL must start with http:// or https://');
      return;
    }
    if (!data.authToken) {
      setError('Auth token is required');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gatewayUrl">Gateway URL</Label>
          <Input 
            id="gatewayUrl"
            placeholder="https://your-funnel-name.ts.net"
            value={data.gatewayUrl}
            onChange={(e) => updateData({ gatewayUrl: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Your Tailscale Funnel URL or public IP address.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="authToken">Auth Token</Label>
          <div className="relative">
            <Input 
              id="authToken"
              type={showToken ? "text" : "password"}
              placeholder="oc_..."
              value={data.authToken}
              onChange={(e) => updateData({ authToken: e.target.value })}
              required
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Run <code className="bg-muted px-1 rounded">openclaw auth token --show</code> to get your token.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" type="button" onClick={onBack}>Back</Button>
        <Button type="submit">Verify Connection</Button>
      </div>
    </form>
  );
}
