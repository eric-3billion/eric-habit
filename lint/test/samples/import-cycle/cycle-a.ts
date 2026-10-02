// 순환 의존 (habits/02)
import { getCycleB } from "./cycle-b"; /* expect: import/no-cycle */
export const getCycleA = (): number => getCycleB() + 1;
