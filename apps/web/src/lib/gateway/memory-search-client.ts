/**
 * Gateway Memory Search Client
 *
 * Proxies Knowledge Hub searches to cohort Gateway RPC endpoints.
 */

export type MemoryLayer = 'memory' | 'mem0' | 'cognee' | 'qmd';

export interface GatewaySearchFilters {
  layer?: MemoryLayer[];
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export interface GatewaySearchPayload extends Record<string, unknown> {
  query: string;
  scopeType: 'personal' | 'cohort' | 'org';
  scopeId: string;
  filters?: GatewaySearchFilters;
  limit?: number;
  offset?: number;
}

export interface GatewaySearchResult {
  layer: MemoryLayer;
  source?: string | null;
  snippet?: string | null;
  relevance?: number | null;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface LayerStatus {
  layer: MemoryLayer;
  status: 'available' | 'unavailable';
  reason?: string;
}

const LAYER_ENDPOINTS: Record<MemoryLayer, string> = {
  memory: 'memory_search',
  mem0: 'mem0/search',
  cognee: 'cognee/search',
  qmd: 'qmd/query',
};

const DEFAULT_TIMEOUT_MS = 6000;

async function callGateway<T>(
  gatewayUrl: string,
  endpoint: string,
  payload: Record<string, unknown>,
  timeoutMs?: number
): Promise<{ data: T | null; error?: string }> {
  const trimmed = gatewayUrl.replace(/\/$/, '');
  const url = `${trimmed}/${endpoint}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      timeoutMs ?? DEFAULT_TIMEOUT_MS
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { data: null, error: `Gateway responded ${response.status}` };
    }

    const json = (await response.json()) as T;
    return { data: json };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown gateway error';
    return { data: null, error: reason };
  }
}

export async function searchGatewayLayer(
  layer: MemoryLayer,
  gatewayUrl: string | null | undefined,
  payload: GatewaySearchPayload
): Promise<{ results: GatewaySearchResult[]; status: LayerStatus }> {
  if (!gatewayUrl) {
    return {
      results: [],
      status: { layer, status: 'unavailable', reason: 'Gateway URL not configured' },
    };
  }

  const endpoint = LAYER_ENDPOINTS[layer];
  const { data, error } = await callGateway<{ results?: GatewaySearchResult[] }>(
    gatewayUrl,
    endpoint,
    payload
  );

  if (error || !data) {
    return {
      results: [],
      status: { layer, status: 'unavailable', reason: error || 'No data returned' },
    };
  }

  return {
    results: (data.results ?? []).map((result) => ({
      ...result,
      layer,
    })),
    status: { layer, status: 'available' },
  };
}

export async function checkGatewayLayer(
  layer: MemoryLayer,
  gatewayUrl: string | null | undefined
): Promise<LayerStatus> {
  if (!gatewayUrl) {
    return { layer, status: 'unavailable', reason: 'Gateway URL not configured' };
  }

  const endpoint = LAYER_ENDPOINTS[layer];
  const { error } = await callGateway(
    gatewayUrl,
    endpoint,
    {
      query: '',
      scopeType: 'org',
      scopeId: 'system',
      limit: 1,
      offset: 0,
    },
    2000
  );

  if (error) {
    return { layer, status: 'unavailable', reason: error };
  }

  return { layer, status: 'available' };
}
