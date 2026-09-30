// 테스트 파일 override — 테스트 전용 셀렉터가 켜진다
declare const screen: { getByTestId: (id: string) => HTMLElement; getByRole: (role: string) => HTMLElement };

export const heading = screen.getByRole("heading");
export const panel = screen.getByTestId("order-panel"); /* expect: no-restricted-syntax */
export const panelColor = getComputedStyle(heading).color; /* expect: no-restricted-syntax */
export const setupPanel = (): HTMLElement => screen.getByRole("region");
export const loadPanel = (): HTMLElement => screen.getByRole("region"); /* expect: eric/function-verb-whitelist */
export const result = screen.getByRole("status");
let pending = 0; /* expect: no-restricted-syntax */
export const pendingCount = pending;
export function setup(): HTMLElement {
  return screen.getByRole("region");
}
export const queryPanel = (): HTMLElement | null => document.querySelector("section");
export const findPanel = async (): Promise<HTMLElement> => screen.getByRole("region");
