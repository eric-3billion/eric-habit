declare module "@tanstack/react-query" {
  export interface QueryOptions<T> { queryKey: readonly unknown[]; queryFn: () => Promise<T> }
  export const skipToken: unique symbol;
  export function useQuery<T>(options: unknown): { data: T | undefined };
  export function useSuspenseQuery<T>(options: QueryOptions<T>): { data: T };
  export function useSuspenseQueries<T extends readonly QueryOptions<unknown>[]>(options: { queries: T }): { data: unknown }[];
}
