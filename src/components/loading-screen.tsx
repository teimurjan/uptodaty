const PROGRESS_MESSAGES = [
  { threshold: 20, label: "SCANNING SOURCES..." },
  { threshold: 50, label: "SEARCHING THE WEB..." },
  { threshold: 75, label: "ANALYZING SIGNALS..." },
  { threshold: 95, label: "CURATING FEED..." },
  { threshold: 100, label: "ALMOST THERE..." },
];

function getProgressMessage(progress: number): string {
  for (const { threshold, label } of PROGRESS_MESSAGES) {
    if (progress < threshold) return label;
  }
  return "ALMOST THERE...";
}

interface LoadingScreenProps {
  progress: number;
}

export function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="absolute inset-0 z-[999] flex flex-col items-center justify-center bg-bg-dark font-mono px-6">
      <div className="-tracking-[2px] mb-8 font-heading text-4xl font-bold text-accent">
        UPTODATY
      </div>
      <div className="mb-8 text-sm uppercase tracking-[4px] text-text-secondary text-center font-semibold">
        Tired scrolling?
        <br />
        Let me do that for you.
      </div>
      <div className="h-0.5 w-[200px] overflow-hidden rounded-sm bg-border">
        <div
          className="h-full rounded-sm bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 text-xs tracking-[2px] text-text-secondary">
        {getProgressMessage(progress)}
      </div>
    </div>
  );
}
