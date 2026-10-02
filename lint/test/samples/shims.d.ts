declare module "@tanstack/react-query" {
  export interface QueryOptions<T> { queryKey: readonly unknown[]; queryFn: () => Promise<T> }
  export const skipToken: unique symbol;
  export function queryOptions<T>(options: T): T;
  export function useQuery<T>(options: unknown): { data: T | undefined };
  export function useSuspenseQuery<T>(options: QueryOptions<T>): { data: T };
  export function useSuspenseQueries<T extends readonly QueryOptions<unknown>[]>(options: { queries: T }): { data: unknown }[];
}

// type-aware 룰이 any 로 오탐하지 않도록 샘플이 쓰는 react API 의 타입만 둔다
declare module "react" {
  export type ReactNode = string | number | boolean | null | undefined | JSX.Element;
  export function useState<T>(initial: T): [T, (next: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export interface Context<T> { Provider: (props: { value: T; children?: ReactNode }) => JSX.Element }
  export function createContext<T>(initial: T): Context<T>;
  export function cloneElement(element: JSX.Element, props: Record<string, unknown>): JSX.Element;
  export const Children: { map<T>(children: ReactNode, mapper: (child: ReactNode) => T): T[] };
  const React: { useEffect: typeof useEffect; useLayoutEffect: typeof useLayoutEffect };
  export default React;
}

declare global {
  namespace JSX {
    interface Element { readonly jsx: unique symbol }
    interface IntrinsicElements { [tag: string]: Record<string, unknown> }
  }
}

declare module "@testing-library/react" {
  export interface Screen { getByRole(role: string): HTMLElement; findByRole(role: string): Promise<HTMLElement>; queryByRole(role: string): HTMLElement | null }
  export const screen: Screen;
  export function render(ui: JSX.Element): Screen & { container: HTMLElement };
  export const fireEvent: { click(element: HTMLElement): void };
  export function waitFor<T>(callback: () => T): Promise<T>;
}

declare global {
  function describe(title: string, body: () => void): void;
  function it(title: string, body: () => void | Promise<void>): void;
  function expect(actual: unknown): { toBe(expected: unknown): void; toThrow(message?: string): void; toBeInTheDocument(): void };
}
