import { format, parse } from "date-fns";
import { useHydration } from "@/hooks/useHydration";
import { DATE_FORMAT } from "@/constants/date";

interface FormattedDateProps {
  date: string;
  className?: string;
}

export function FormattedDate({ date, className = "" }: FormattedDateProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <span className={className}>---</span>;
  }

  return (
    <span className={className}>
      {format(parse(date, "yyyy-MM-dd", new Date()), DATE_FORMAT)}
    </span>
  );
}
