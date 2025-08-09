import { useState, useEffect, useRef } from "react";

/**
 * Էջի skeleton/loading placeholder-ի կառավարում
 * @param {boolean} ready - պատվերի տվյալները հասանելի են
 * @param {number} minTime - նվազագույն միլիվայրկյան հասանելիության պահ
 */
export default function useSkeletonTimeout(ready, minTime = 700) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (!ready) {
      startRef.current = Date.now();
      setShowSkeleton(true);
    } else {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, minTime - elapsed);
      const timer = setTimeout(() => setShowSkeleton(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [ready, minTime]);

  return showSkeleton;
}