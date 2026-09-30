import type { QueryOptions } from "@tanstack/react-query";

export interface Order {
  id: string;
  total: number;
  createdAt: number;
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const orderQueries = {
  detail: (id: string): QueryOptions<Order> => ({ queryKey: ["order", id], queryFn: async () => ({ id, total: 0, createdAt: 0 }) }),
  list: (): QueryOptions<Order[]> => ({ queryKey: ["orders"], queryFn: async () => [] }),
};
