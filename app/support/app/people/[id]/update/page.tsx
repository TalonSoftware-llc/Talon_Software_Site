import { UpdateFlow } from "@/components/support/views/People";

export default async function UpdatePersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UpdateFlow id={id} />;
}
