import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WizardData } from "./types";
import { cn } from "@/lib/utils";
import { Globe, Lock, Wifi } from "lucide-react";

export function Step3Connectivity({ 
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
  const options = [
    {
      id: 'tailscale',
      title: 'Tailscale Funnel',
      description: 'Secure, zero-config connection via Tailscale.',
      icon: Lock,
      recommended: true,
    },
    {
      id: 'direct',
      title: 'Direct URL / Public IP',
      description: 'Use your own domain or public IP address (requires port forwarding).',
      icon: Globe,
      recommended: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <Card 
            key={option.id}
            className={cn(
              "cursor-pointer hover:border-primary transition-colors",
              data.connectionType === option.id ? "border-primary bg-primary/5" : ""
            )}
            onClick={() => updateData({ connectionType: option.id as any })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {option.title}
              </CardTitle>
              <option.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold"></div>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
              {option.recommended && (
                <span className="mt-2 inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Recommended
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-md">
        <h4 className="font-semibold text-sm mb-2">Instructions</h4>
        {data.connectionType === 'tailscale' ? (
          <p className="text-sm text-muted-foreground">
            Run <code className="bg-background px-1 py-0.5 rounded border">openclaw gateway share --funnel</code> to expose your gateway securely.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ensure your gateway is listening on a public interface (0.0.0.0) and port 18789 is forwarded.
          </p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next: Credentials</Button>
      </div>
    </div>
  );
}
