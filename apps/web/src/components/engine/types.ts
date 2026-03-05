export type WizardData = {
  gatewayUrl: string;
  authToken: string;
  hosting: 'self_hosted' | 'managed';
  connectionType: 'tailscale' | 'direct';
};

export type Agent = {
  id: string;
  name: string;
  workspace: string;
  status: 'online' | 'offline';
};
