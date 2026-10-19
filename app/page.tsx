import { DesignerHeader } from "@/components/designer/designer-header";
import { DesignerWorkspace } from "@/components/designer/designer-workspace";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[var(--warm-canvas)] text-[var(--ink)]">
      <DesignerHeader />
      <DesignerWorkspace />
    </div>
  );
}
