export default function Wordmark({ tone = "ink" }: { tone?: "ink" | "paper" }) {
  const color = tone === "paper" ? "text-paper" : "text-ink";

  return (
    <span className={`font-wordmark text-[1.7rem] font-medium leading-none tracking-tight ${color}`}>
      Talon
    </span>
  );
}
