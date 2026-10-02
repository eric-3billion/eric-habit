// 테스트 파일 override — 테스트 전용 셀렉터가 켜진다
declare const screen: { getByTestId: (id: string) => HTMLElement; getByRole: (role: string) => HTMLElement };

export const heading = screen.getByRole("heading");
export const panel = screen.getByTestId("order-panel"); /* expect: eric/restricted-syntax */
export const panelColor = getComputedStyle(heading).color;
export const setupPanel = (): HTMLElement => screen.getByRole("region");
export const loadPanel = (): HTMLElement => screen.getByRole("region"); /* expect: eric/function-verb-whitelist */
export const result = screen.getByRole("status");
let pending = 0; /* expect: eric/restricted-syntax */
export const pendingCount = pending;
export function setup(): HTMLElement {
  return screen.getByRole("region");
}
export const queryPanel = (): HTMLElement | null => document.querySelector("section");
export const findPanel = async (): Promise<HTMLElement> => screen.getByRole("region");

// 테스트에서는 설명이 붙은 @ts-expect-error 만 허용한다
// @ts-expect-error 숫자 id 는 거부돼야 한다
export const rejectedPanelId: string = 1;
/* expect: typescript/ban-ts-comment */ // @ts-expect-error
export const undescribedPanelId: string = 2;
