import { Clock } from "lucide-react";
import { listRidesWithCategory } from "@/lib/payments/ride-status";
import { GlassCard } from "@/components/ui/glass-card";
import { ActivityHistory } from "@/components/activity/activity-history";

export default async function ActivityPage() {
  const rides = await listRidesWithCategory();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-muted">Your trips and protected payments.</p>
      </div>

      {rides.length === 0 ? (
        <GlassCard className="flex flex-col items-center py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-muted">
            <Clock className="h-7 w-7" />
          </span>
          <p className="mt-5 font-display text-lg font-semibold">No rides yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Once you take your first ride, your history and digital receipts show
            up right here.
          </p>
        </GlassCard>
      ) : (
        <ActivityHistory items={rides} />
      )}
    </div>
  );
}
