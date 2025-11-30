import RuntimeControls from "@/app/ui/runtime/RuntimeControls";
import RuntimeStatus from "@/app/ui/runtime/RuntimeStatus";

export default function CommandCenter() {
  return (
    <div className="space-y-6">
      <RuntimeControls />
      <RuntimeStatus />
    </div>
  );
}
