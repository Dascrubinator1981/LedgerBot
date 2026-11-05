import { NextRequest } from "next/server";
import { z } from "@/lib/schema";
import { withFinance } from "@/lib/backend";
import { state } from "@/lib/finance";
import { civilToday, forecast, netWorth } from "@/lib/domain";
import { budgetProgress, recentPaidBills } from "@/lib/insights";
export async function GET(request: NextRequest) {
  return withFinance(request, false, async (db, s) => {
    const data = await state(db, s.userId, false),
      today = civilToday(data.settings.timezone);
    const month = z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
      .parse(request.nextUrl.searchParams.get("month") || today.slice(0, 7));
    return {
      revision: data.revision,
      asOf: today,
      timezone: data.settings.timezone,
      netWorth: netWorth(data.accounts, data.transactions),
      budget: budgetProgress(data, month, today),
      forecast: forecast(data, today, 30),
      recentBills: recentPaidBills(data, today),
    };
  });
}
