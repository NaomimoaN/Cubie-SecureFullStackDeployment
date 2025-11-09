// src/hooks/useWindowWidth.js
import { useState, useEffect, useCallback } from "react";

/**
 * @returns {number} width of window (px)
 */
export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}
