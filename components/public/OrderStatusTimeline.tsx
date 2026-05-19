import { ORDER_STATUS_STEPS, type OrderStatusKey } from "@/lib/order-status";
import { cn } from "@/lib/utils";

interface OrderStatusTimelineProps {
  currentStatus: string;
}

export function OrderStatusTimeline({ currentStatus }: OrderStatusTimelineProps) {
  const currentIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:gap-0">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const isComplete = currentIndex > index;
        const isCurrent = step.key === currentStatus;
        const isPending = currentIndex < index;

        return (
          <li
            key={step.key}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-2 pb-6 sm:pb-0 sm:pt-1",
              index < ORDER_STATUS_STEPS.length - 1 &&
                "sm:after:absolute sm:after:left-1/2 sm:after:top-3 sm:after:h-0.5 sm:after:w-full sm:after:bg-stone-200",
            )}
          >
            <span
              className={cn(
                "relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                isComplete && "bg-[var(--color-success)] text-white",
                isCurrent && "bg-primary text-white ring-4 ring-primary/20",
                isPending && "bg-stone-200 text-stone-500",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isComplete ? "✓" : index + 1}
            </span>
            <span
              className={cn(
                "text-center text-xs font-medium sm:text-[0.7rem]",
                isCurrent ? "text-primary" : "text-stone-500",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function statusStepIndex(status: string): number {
  const idx = ORDER_STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export function isOrderStatusKey(status: string): status is OrderStatusKey {
  return ORDER_STATUS_STEPS.some((s) => s.key === status);
}
