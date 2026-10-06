import { Construction } from "lucide-react";

export function NotBuilt({ format, topic, detail }: { format: string; topic: string; detail?: string }) {
  return (
    <div className="box p-10 text-center bg-cream">
      <Construction size={28} className="mx-auto text-amber" />
      <h2 className="font-head font-extrabold text-2xl mt-3">
        {format} isn&apos;t built for {topic} yet
      </h2>
      <p className="font-mono text-[12px] text-muted mt-2 max-w-[520px] mx-auto">
        {detail ?? "This demo build only includes the formats marked available. Nothing is faked behind this page."}
      </p>
    </div>
  );
}
