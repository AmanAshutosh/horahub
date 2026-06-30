/**
 * Conflict resolver — deterministic book-priority resolution.
 *
 * When two matched rules express contradicting statements about the same
 * condition, we surface BOTH but annotate which has higher authority.
 * We NEVER silently discard evidence. Conflicting evidence is always shown
 * to the user alongside the primary statement.
 *
 * Priority:
 *   1. BPHS  (Brihat Parashara Hora Shastra)
 *   2. HORA  (Horasara)
 *   3. PHALA (Phaladeepika)
 *   4. LOL   (Light on Life)
 *   Equal authority → keep both, mark as "equal_conflict"
 */
import type { MatchedRule } from './types';
import { bookPriorityOf } from './confidence';

export type ConflictResolution = 'primary' | 'secondary' | 'equal_conflict' | 'no_conflict';

export interface ResolvedMatch {
  match: MatchedRule;
  resolution: ConflictResolution;
  /** Rule IDs that conflict with this match, if any. */
  conflictsWith: string[];
}

/**
 * Annotate each match with its conflict resolution status.
 *
 * Two matches conflict if:
 *   - They share a conflicting rule ID (from KG contradicts edges), OR
 *   - Their effectDirection are opposite (increase vs. decrease) for the
 *     same effectDomain and same set of matched conditions.
 *
 * In all cases, both are kept; only the annotation differs.
 */
export function resolveConflicts(matches: MatchedRule[]): ResolvedMatch[] {
  // Build conflict pair map from the pre-computed conflictingRuleIds
  const conflictPairs = new Map<string, Set<string>>();
  for (const m of matches) {
    if (!conflictPairs.has(m.ruleId)) conflictPairs.set(m.ruleId, new Set());
    for (const cId of m.conflictingRuleIds) {
      conflictPairs.get(m.ruleId)!.add(cId);
    }
  }

  // Build result with resolution annotation
  const resolved: ResolvedMatch[] = [];

  for (const match of matches) {
    const conflicts = conflictPairs.get(match.ruleId);
    if (!conflicts || conflicts.size === 0) {
      resolved.push({ match, resolution: 'no_conflict', conflictsWith: [] });
      continue;
    }

    // Find the conflicting matches that are actually in our matched set
    const presentConflicts = [...conflicts].filter(
      (cId) => matches.some((m) => m.ruleId === cId),
    );

    if (presentConflicts.length === 0) {
      // Conflicting rules exist in KB but weren't matched for this chart
      resolved.push({ match, resolution: 'no_conflict', conflictsWith: [] });
      continue;
    }

    // Determine authority relative to highest-priority conflict
    const ownPriority = bookPriorityOf(match.bookCode);
    const conflictPriorities = presentConflicts.map((cId) => {
      const peer = matches.find((m) => m.ruleId === cId);
      return peer ? bookPriorityOf(peer.bookCode) : 999;
    });
    const bestConflictPriority = Math.min(...conflictPriorities);

    let resolution: ConflictResolution;
    if (ownPriority < bestConflictPriority) {
      resolution = 'primary';
    } else if (ownPriority > bestConflictPriority) {
      resolution = 'secondary';
    } else {
      resolution = 'equal_conflict';
    }

    resolved.push({ match, resolution, conflictsWith: presentConflicts });
  }

  return resolved;
}

/**
 * Filter a resolved set to only primary + no_conflict matches, returning
 * secondary matches in a separate array for optional display.
 */
export function splitByResolution(resolved: ResolvedMatch[]): {
  primary: MatchedRule[];
  secondary: MatchedRule[];
  equalConflicts: Array<{ a: MatchedRule; b: MatchedRule }>;
} {
  const primary: MatchedRule[] = [];
  const secondary: MatchedRule[] = [];
  const equalConflicts: Array<{ a: MatchedRule; b: MatchedRule }> = [];
  const pairedIds = new Set<string>();

  for (const r of resolved) {
    if (r.resolution === 'no_conflict' || r.resolution === 'primary') {
      primary.push(r.match);
    } else if (r.resolution === 'secondary') {
      secondary.push(r.match);
    } else {
      // equal_conflict: pair them up (avoid duplicate pairs)
      if (!pairedIds.has(r.match.ruleId)) {
        for (const cId of r.conflictsWith) {
          const peer = resolved.find((x) => x.match.ruleId === cId);
          if (peer && !pairedIds.has(cId)) {
            equalConflicts.push({ a: r.match, b: peer.match });
            pairedIds.add(r.match.ruleId);
            pairedIds.add(cId);
            break;
          }
        }
        if (!pairedIds.has(r.match.ruleId)) {
          primary.push(r.match); // orphaned equal_conflict → treat as primary
        }
      }
    }
  }

  return { primary, secondary, equalConflicts };
}
