/**
 * Knowledge Hub Search Service
 */

import { getCohortById } from '@/server/db/queries/cohorts';
import {
  checkGatewayLayer,
  searchGatewayLayer,
  type GatewaySearchFilters,
  type GatewaySearchResult,
  type LayerStatus,
  type MemoryLayer,
} from '@/lib/gateway/memory-search-client';

export interface KnowledgeSearchFilters {
  layers?: MemoryLayer[];
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export interface KnowledgeSearchParams {
  query: string;
  cohortId: string;
  scopeType: 'personal' | 'cohort' | 'org';
  scopeId: string;
  filters?: KnowledgeSearchFilters;
  page?: number;
}

export interface KnowledgeSearchResponse {
  results: GatewaySearchResult[];
  layerStatus: LayerStatus[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const PAGE_SIZE = 20;
const ALL_LAYERS: MemoryLayer[] = ['memory', 'mem0', 'cognee', 'qmd'];

function normalizeFilters(filters?: KnowledgeSearchFilters): GatewaySearchFilters {
  return {
    layer: filters?.layers,
    entityType: filters?.entityType,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  };
}

function dedupeResults(results: GatewaySearchResult[]) {
  const seen = new Set<string>();
  const output: GatewaySearchResult[] = [];

  for (const result of results) {
    const key = result.url
      ? `url:${result.url}`
      : `snippet:${result.source ?? ''}:${result.snippet ?? ''}`;

    if (seen.has(key)) continue;
    seen.add(key);
    output.push(result);
  }

  return output;
}

function sortResults(results: GatewaySearchResult[]) {
  return results.sort((a, b) => {
    const scoreA = a.relevance ?? 0;
    const scoreB = b.relevance ?? 0;
    return scoreB - scoreA;
  });
}

export async function searchKnowledge(params: KnowledgeSearchParams): Promise<KnowledgeSearchResponse> {
  const page = params.page ?? 1;
  const cohort = await getCohortById(params.cohortId);
  const gatewayUrl = cohort?.gatewayUrl ?? null;

  const requestedLayers = params.filters?.layers?.length
    ? params.filters.layers
    : ALL_LAYERS;

  const gatewayFilters = normalizeFilters(params.filters);

  const layerCalls = requestedLayers.map((layer) =>
    searchGatewayLayer(layer, gatewayUrl, {
      query: params.query,
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      filters: gatewayFilters,
      limit: 50,
      offset: 0,
    })
  );

  const layerResponses = await Promise.all(layerCalls);

  const layerStatus: LayerStatus[] = layerResponses.map((response) => response.status);
  const combined = layerResponses.flatMap((response) => response.results);

  const deduped = dedupeResults(combined);
  const ranked = sortResults(deduped);

  const total = ranked.length;
  const start = (page - 1) * PAGE_SIZE;
  const paged = ranked.slice(start, start + PAGE_SIZE);

  return {
    results: paged,
    layerStatus,
    meta: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

export async function getKnowledgeSources(cohortId: string): Promise<LayerStatus[]> {
  const cohort = await getCohortById(cohortId);
  const gatewayUrl = cohort?.gatewayUrl ?? null;

  return Promise.all(ALL_LAYERS.map((layer) => checkGatewayLayer(layer, gatewayUrl)));
}
