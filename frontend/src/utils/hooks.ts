import { useState, useEffect, useRef, RefObject } from "react";

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

interface Args extends IntersectionObserverInit {
    freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
    elementRef: RefObject<Element>,
    {
        threshold = 0,
        root = null,
        rootMargin = "0%",
        freezeOnceVisible = false,
    }: Args,
): IntersectionObserverEntry | undefined {
    const [entry, setEntry] = useState<IntersectionObserverEntry>();

    const frozen = entry?.isIntersecting && freezeOnceVisible;

    const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
        setEntry(entry);
    };

    useEffect(() => {
        const node = elementRef?.current;
        const hasIOSupport = !!window.IntersectionObserver;

        if (!hasIOSupport || frozen || !node) return;

        const observerParams = { threshold, root, rootMargin };
        const observer = new IntersectionObserver(updateEntry, observerParams);

        observer.observe(node);

        return () => observer.disconnect();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [elementRef?.current, JSON.stringify(threshold), root, rootMargin, frozen]);

    return entry;
}