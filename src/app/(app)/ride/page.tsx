import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { RideExperience } from "@/components/ride/ride-experience";

export default async function RidePage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // (app) layout handles the redirect

  const { data: places } = await supabase
    .from("destinations")
    .select("kind")
    .eq("user_id", user.id)
    .in("kind", ["home", "work"]);

  const kinds = new Set((places ?? []).map((p) => p.kind));
  const examples = [
    "Take me to the airport",
    ...(kinds.has("home") ? ["Take me home, cheapest"] : []),
    ...(kinds.has("work") ? ["Get me to work, fastest"] : []),
    "I need an EV downtown",
  ];

  return <RideExperience examples={examples} />;
}
