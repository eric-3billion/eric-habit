// effectAllowedFiles 로 지정된 위치 — useEffect import 가 허용된다
import { useEffect, useState } from "react";

export function useViewportWidth(): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const handleResize = (): void => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}
