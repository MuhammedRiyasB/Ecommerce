import { useState, useEffect } from 'react';

/**
 * Debounces a rapidly changing value by delaying updates until the user
 * stops changing it for the specified duration. Essential for search inputs
 * to avoid firing API calls on every keystroke.
 *
 * @param value - The value to debounce (typically from a controlled input)
 * @param delayMs - Delay in milliseconds before the value updates (default: 300ms)
 * @returns The debounced value, updated only after the delay has elapsed
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Cancel the timer if value changes before delay elapses (user still typing)
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
