import { IconAlertCircle } from "@tabler/icons-react";

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark p-8 font-mono">
      <IconAlertCircle className="mb-4" size={40} />
      <div className="mb-2 text-center text-[15px] text-text-primary">
        Failed to load today&apos;s briefing
      </div>
      <div className="mb-8 max-w-[400px] text-center text-xs text-text-secondary">
        {message}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer border border-accent bg-transparent px-8 py-3 font-mono text-xs uppercase tracking-[2px] text-accent transition-colors hover:bg-accent/10"
      >
        Retry
      </button>
    </div>
  );
}
