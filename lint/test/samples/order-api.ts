// apiHandlerFiles 로 지정한 API 핸들러 — get* 은 HTTP GET 이라 없음(null)을 반환해도 된다
import type { Order } from "./domain";

export async function getOrderById(id: string): Promise<Order | null> {
  const response = await fetch(`/orders/${id}`);
  if (response.status === 404) return null;
  const order: Order = await response.json();
  return order;
}

export async function getOrderDraft(id: string): Promise<Order | undefined> { /* expect: eric/verb-return-contract */
  const response = await fetch(`/orders/${id}/draft`);
  if (response.status === 404) return undefined;
  const order: Order = await response.json();
  return order;
}
