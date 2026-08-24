import { requireAdmin } from "@/lib/auth";
import { ok, parseJson, withRoute } from "@/lib/api";
import { settingsSchema } from "@/lib/validation";
import { getOverdueThresholdHours, setOverdueThresholdHours } from "@/lib/settings";

export const GET = withRoute(async () => {
  await requireAdmin();
  return ok({ overdueThresholdHours: await getOverdueThresholdHours() });
});

export const PATCH = withRoute(async (request) => {
  await requireAdmin();
  const body = await parseJson(request, settingsSchema);
  await setOverdueThresholdHours(body.overdueThresholdHours);
  return ok({ overdueThresholdHours: body.overdueThresholdHours });
});
