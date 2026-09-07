import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  fallback?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

export const BackButton = ({
  fallback = "/",
  icon,
  className,
  children,
  ...props
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    const canGoBack = typeof window !== "undefined" && window.history.state?.idx > 0;
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [fallback, navigate]);

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      {icon ?? <ArrowLeft className="h-4 w-4" />}
      {children}
    </button>
  );
};
