import AssistantPanel from "@/components/support/AssistantPanel";

export default function AssistantPage() {
  return (
    <div className="h-[calc(100dvh-9rem)] min-h-[28rem] overflow-hidden rounded-xl border border-[#e1e6ec]">
      <AssistantPanel mode="page" />
    </div>
  );
}
