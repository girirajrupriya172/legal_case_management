import { useState, useEffect } from 'react';

/**
 * Custom React hook to debounce fast-changing state values (e.g. search inputs).
 * Prevents triggering excessive API requests while the user is actively typing.
 * 
 * @param {any} value - The input value to debounce
 * @param {number} delay - Delay duration in milliseconds (default: 350ms)
 * @returns {any} - The debounced value updated only after the delay expires
 */
export function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timer to update debouncedValue after specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel timer if value changes before delay expires (clears previous timeout)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
