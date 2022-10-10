import { useState, useEffect, useRef } from "react";

export function useDebounce<T>(value: T, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottle<T>(value: T, delay: number) {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const time = useRef<number>(0);

    useEffect(() => {
        const now = Date.now();
        if (now > time.current + delay) {
            time.current = now;
            setThrottledValue(value);
        } else {
            const handler = setTimeout(() => {
                setThrottledValue(value);
            }, delay);
            return () => clearTimeout(handler);
        }
    }, [value, delay]);

    return throttledValue;
}
