import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRideReceipt } from "@/lib/payments/receipt";
import { RideReceipt } from "@/components/receipt/ride-receipt";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receipt = await getRideReceipt(id);
  if (!receipt) redirect("/activity");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href={`/ride/${id}`}
        className="no-print inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to ride
      </Link>

      <RideReceipt receipt={receipt} />
    </div>
  );
}
