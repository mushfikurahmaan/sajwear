import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  increaseLabel: string;
  decreaseLabel: string;
  className?: string;
  /** Bordered − / qty / + control for dense layouts (e.g. checkout) */
  layout?: "default" | "segmented";
  decrementDisabled?: boolean;
  incrementDisabled?: boolean;
};

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  increaseLabel,
  decreaseLabel,
  className,
  layout = "default",
  decrementDisabled = false,
  incrementDisabled = false,
}: QuantityStepperProps) {
  if (layout === "segmented") {
    const segmentBtn = (side: "left" | "right") =>
      cn(
        "flex h-10 w-10 shrink-0 items-center justify-center border-0 bg-white text-lg font-normal leading-none text-neutral-800 transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-neutral-400",
        side === "left" && "border-e border-neutral-200",
        decrementDisabled && side === "left"
          ? "cursor-not-allowed opacity-40"
          : !decrementDisabled && side === "left" && "cursor-pointer hover:bg-neutral-50 active:bg-neutral-100",
        incrementDisabled && side === "right"
          ? "cursor-not-allowed opacity-40"
          : !incrementDisabled && side === "right" && "cursor-pointer hover:bg-neutral-50 active:bg-neutral-100",
      );

    return (
      <div
        className={cn(
          "inline-flex select-none items-stretch overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-900 shadow-sm",
          className,
        )}
      >
        <button
          type="button"
          className={segmentBtn("left")}
          onClick={onDecrement}
          disabled={decrementDisabled}
          aria-label={decreaseLabel}
        >
          <span className="block pb-0.5" aria-hidden>
            −
          </span>
        </button>
        <span className="flex min-w-[2.75rem] items-center justify-center border-e border-neutral-200 bg-white px-2 tabular-nums text-sm font-medium text-neutral-900">
          {quantity}
        </span>
        <button
          type="button"
          className={segmentBtn("right")}
          onClick={onIncrement}
          disabled={incrementDisabled}
          aria-label={increaseLabel}
        >
          <span className="block pb-0.5" aria-hidden>
            +
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDecrement}
        disabled={decrementDisabled}
        aria-label={decreaseLabel}
      >
        -
      </Button>
      <span className="min-w-6 text-center text-sm text-text">{quantity}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onIncrement}
        disabled={incrementDisabled}
        aria-label={increaseLabel}
      >
        +
      </Button>
    </div>
  );
}
