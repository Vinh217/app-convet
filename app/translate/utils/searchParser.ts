/**
 * Parse smart search query to detect special patterns
 * Supports:
 * - "146-150" → range search
 * - "146,147,148" → list search
 * - "146+" → from 146 onwards
 * - "146-150 pending" → range with status filter
 */

export interface ParsedSearchQuery {
  type: 'normal' | 'range' | 'list' | 'from';
  from?: number;
  to?: number;
  numbers?: number[];
  status?: string;
  originalQuery: string;
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return { type: 'normal', originalQuery: query };
  }

  // Extract status filter if present (e.g., "146-150 pending")
  const statusKeywords = ['pending', 'translating', 'completed', 'failed'];
  let status: string | undefined;
  let queryWithoutStatus = trimmed;

  for (const keyword of statusKeywords) {
    const regex = new RegExp(`\\s+${keyword}\\s*$`, 'i');
    if (regex.test(trimmed)) {
      status = keyword;
      queryWithoutStatus = trimmed.replace(regex, '').trim();
      break;
    }
  }

  // Pattern 1: Range "146-150" or "146 - 150"
  const rangeMatch = queryWithoutStatus.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const from = parseInt(rangeMatch[1], 10);
    const to = parseInt(rangeMatch[2], 10);
    if (!isNaN(from) && !isNaN(to) && from > 0 && to >= from) {
      return {
        type: 'range',
        from,
        to,
        status,
        originalQuery: query,
      };
    }
  }

  // Pattern 2: List "146,147,148" or "146, 147, 148"
  const listMatch = queryWithoutStatus.match(/^(\d+(?:\s*,\s*\d+)+)$/);
  if (listMatch) {
    const numbers = queryWithoutStatus
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);
    if (numbers.length > 0) {
      return {
        type: 'list',
        numbers,
        status,
        originalQuery: query,
      };
    }
  }

  // Pattern 3: From onwards "146+" or "146 +"
  const fromMatch = queryWithoutStatus.match(/^(\d+)\s*\+$/);
  if (fromMatch) {
    const from = parseInt(fromMatch[1], 10);
    if (!isNaN(from) && from > 0) {
      return {
        type: 'from',
        from,
        status,
        originalQuery: query,
      };
    }
  }

  // Default: normal text search
  return {
    type: 'normal',
    status,
    originalQuery: query,
  };
}

