import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

/**
 * Loading spinner component with size variants
 */
export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3"
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("inline-block", className)}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-current border-r-transparent",
          sizeClasses[size]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

