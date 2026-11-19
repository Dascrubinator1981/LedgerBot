import { hash } from "./auth";
import { PublicError } from "./errors";
import type { Proposal } from "./domain";
export function proposalDigest(userId: string, p: Proposal) {
  return hash(
    JSON.stringify({
      id: p.id,
      version: p.version,
      operation: p.operation,
      before: p.before,
      impact: p.impact,
      revision: p.revision,
      savedReview: p.savedReview,
      sourceSavedReviewId: p.sourceSavedReviewId,
      userId,
    }),
  );
}
export function verifyDigest(userId: string, p: Proposal) {
  if (proposalDigest(userId, p) !== p.digest)
    throw new PublicError(
      "Proposal integrity check failed. Prepare a new proposal.",
    );
}
