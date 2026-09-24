import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/firebase/db";
import { RideExperience } from "@/components/ride/ride-experience";

export default async function RidePage() {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const profile = await getUserProfile(fbUser.uid);
  const hasHome = Boolean(profile?.homeAddress);
  const hasWork = Boolean(profile?.workAddress);

  const examples = [
    "Take me to the airport",
    ...(hasHome ? ["Take me home, cheapest"] : ["Take me home"]),
    ...(hasWork ? ["Get me to work, fastest"] : ["Get me to work"]),
    "I need an EV downtown",
  ];

  return <RideExperience examples={examples} />;
}
