import { format, parse } from "date-fns";
import { useHydration } from "@/hooks/useHydration";

interface FormattedDateProps {
  date: string;
  className?: string;
}

export function FormattedDate({ date, className = '' }: FormattedDateProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <span className={className}>---</span>;
  }

  return (
    <span className={className}>
      {format(parse(date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
    </span>
  );
} 