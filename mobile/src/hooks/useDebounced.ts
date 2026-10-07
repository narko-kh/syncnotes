/**
 * هوک تأخیر
 * مقدار رو با کمی تأخیر برمی‌گردونه؛ مثلاً برای جستجو تا با هر حرف، لیست دوباره فیلتر نشه.
 */
import { useEffect, useState } from 'react';

export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer); // اگه مقدار زود عوض شد، تایمر قبلی لغو میشه
  }, [value, delayMs]);

  return debounced;
}
