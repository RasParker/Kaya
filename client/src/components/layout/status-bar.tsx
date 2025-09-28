import { Wifi, Signal, Battery } from "lucide-react";

export default function StatusBar() {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="status-bar">
      <span data-testid="text-time">{currentTime}</span>
      <div className="flex items-center gap-1">
        <Signal className="h-4 w-4" data-testid="icon-signal" />
        <Wifi className="h-4 w-4" data-testid="icon-wifi" />
        <Battery className="h-4 w-4" data-testid="icon-battery" />
      </div>
    </div>
  );
}
