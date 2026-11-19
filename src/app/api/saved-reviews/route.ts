import { NextRequest } from "next/server";
import { withFinance } from "@/lib/backend";
import { body } from "@/lib/http";
import { saveReview } from "@/lib/saved-reviews";
export async function POST(request: NextRequest) {
  return withFinance(request, true, async (db, session) =>
    saveReview(db, session, await body(request)),
  );
}
