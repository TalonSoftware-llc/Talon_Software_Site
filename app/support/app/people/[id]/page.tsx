import { PersonProfile } from "@/components/support/views/People";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonProfile id={id} />;
}
