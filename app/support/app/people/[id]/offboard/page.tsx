import { OffboardFlow } from "@/components/support/views/People";

export default async function OffboardPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OffboardFlow id={id} />;
}
