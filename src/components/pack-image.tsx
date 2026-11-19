import { useState } from "react";
import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";

export function PackImage({
  src,
  brand,
  dosageForm,
  className,
  compact,
}: {
  src: string | null | undefined;
  brand: string;
  dosageForm?: string;
  className?: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  return (
    <div className={cn("relative overflow-hidden bg-pack", className)}>
      {showImage ? (
        <img
          src={src}
          alt={`${brand} pack`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-contain p-4"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center dot-grid">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className={cn("grid place-items-center rounded-2xl bg-card text-teal shadow-card", compact ? "size-9" : "size-12")}>
              <Pill className={compact ? "size-4" : "size-6"} />
            </span>
            {!compact && (
              <>
                <span className="px-3 font-display text-lg font-extrabold tracking-tight text-primary">{brand}</span>
                {dosageForm && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {dosageForm}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
