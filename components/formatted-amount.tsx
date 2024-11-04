import { useHydration } from '@/hooks/useHydration';

interface FormattedAmountProps {
  value: number;
  currency?: string;
  className?: string;
}

export function FormattedAmount({ value, currency = '', className = '' }: FormattedAmountProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <span className={className}>---</span>;
  }

  return (
    <span className={className}>
      {currency} {value.toLocaleString()}
    </span>
  );
} 