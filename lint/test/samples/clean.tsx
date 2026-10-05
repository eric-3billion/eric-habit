// 프리셋이 아무것도 보고하지 않아야 하는 코드 — habits 가 권장하는 형태를 모았다
import { queryOptions, skipToken, useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { orderQueries, type Order, type Result } from "./domain";

type Predicate<T> = (x: T) => boolean;
type Status = { type: "loading" } | { type: "error"; message: string };
type OrderViewState = { type: "empty" } | { type: "filled"; orders: Order[] };

interface UploadLimit {
  attachmentSize: number;
  // 레거시 레코드에는 없어서 경계 매퍼가 채운다
  maxCount?: number;
}

const SIMPLE_INTEREST_WEIGHT = 0.5;

export const all = <T,>(...predicates: Predicate<T>[]): Predicate<T> => (x) => predicates.every((p) => p(x));
export const any = <T,>(...predicates: Predicate<T>[]): Predicate<T> => (x) => predicates.some((p) => p(x));

export function findOrder(orders: Order[], id: string): Order | null {
  return orders.find((order) => order.id === id) ?? null;
}

// get 은 꺼내기다. 없을 수 있으면 null 로 드러낸다
export function getOrderNote(order: Order): string | null {
  return order.id.length > 0 ? order.id : null;
}

// config 의 domainVerbs 에 등록한 인앱 도메인 동사 — 이름 단독으로도 쓴다
export function signOut(): null {
  return null;
}

export function getOrderTotal(order: Order): number {
  return order.total;
}

// And 가 든 도메인 용어는 andJoinedTerms 에 올려 허용한다
export function hasOrderTermsAndConditions(order: Order): boolean {
  return order.id.length > 0;
}

export function isExpensiveOrder(order: Order): boolean {
  return order.total > 100;
}

export function calculateInterest(amount: number): number {
  return amount * SIMPLE_INTEREST_WEIGHT;
}

export function calculateTier(score: number): "gold" | "silver" | "bronze" {
  if (score > 90) return "gold";
  if (score > 70) return "silver";
  return "bronze";
}

export function compareOrdersByDate(a: Order, b: Order): number {
  return a.createdAt - b.createdAt;
}

export function parsePort(raw: string): Result<number, "NaN"> {
  const port = Number(raw);
  return Number.isNaN(port) ? { ok: false, error: "NaN" } : { ok: true, value: port };
}

export function subscribeToResize(onResize: () => void): () => void {
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}

export function formatStatusLabel(status: Status): string {
  switch (status.type) {
    case "loading":
      return "…";
    case "error":
      return status.message;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function listOrderTotals(orders: Order[]): number[] {
  return orders
    .filter(isExpensiveOrder)
    .map(getOrderTotal);
}

export function createNavigator(): (path: string) => void {
  return (path) => window.history.pushState(null, "", path);
}

export const canEditOrder = all<Order>(isExpensiveOrder, any(isExpensiveOrder));

interface OrderSummaryProps {
  orderId: string;
  limit: UploadLimit;
}

export function OrderSummary({ orderId, limit }: OrderSummaryProps): ReactNode {
  const { data: order, refetch } = useSuspenseQuery(orderQueries.detail(orderId));
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = (): void => setIsOpen((prev) => !prev);
  const navigate = createNavigator();

  return (
    <section>
      <button type="button" onClick={handleToggle}>{order.id}</button>
      {isOpen && <span>{limit.attachmentSize}{String(refetch)}{String(navigate)}</span>}
    </section>
  );
}

export function OrderDashboard({ orderId }: { orderId: string }): ReactNode {
  const [detail, catalog] = useSuspenseQueries({ queries: [orderQueries.detail(orderId), orderQueries.list()] });
  return <OrderList viewState={{ type: "filled", orders: [] }} header={<h1>{String(detail.data)}</h1>} count={catalog.data} />;
}

interface OrderListProps {
  viewState: OrderViewState;
  header: ReactNode;
  count: unknown;
}

function OrderList({ viewState, header }: OrderListProps): ReactNode {
  if (viewState.type === "empty") return <p>없음</p>;
  return <>{header}{viewState.orders.map((order) => <p key={order.id}>{order.id}</p>)}</>;
}

// 렌더 중 보정: 이전 값과 비교해 state 를 맞춘다 (effect 대신, habits/01 §6)
export function OrderSelection({ orderId }: { orderId: string }): ReactNode {
  const [prevOrderId, setPrevOrderId] = useState(orderId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  if (prevOrderId !== orderId) {
    setPrevOrderId(orderId);
    setSelectedIds([]);
  }
  return <button type="button" onClick={() => setSelectedIds([orderId])}>{selectedIds.length}</button>;
}

export function OrderForm({ orderId }: { orderId: string }): ReactNode {
  return <form>{orderId}</form>;
}
OrderForm.loading = (): ReactNode => <p>로딩</p>;
OrderForm.error = ({ resetError }: { resetError: () => void }): ReactNode => <button type="button" onClick={resetError}>재시도</button>;

export function getStatusBadge(status: Status): ReactNode {
  return status.type === "error" ? <span>{status.message}</span> : null;
}

export function parseOrderId(raw: string): string | null {
  return raw.startsWith("order-") ? raw : null;
}

export function filterExpensiveOrders(orders: Order[]): Order[] {
  return orders.filter(isExpensiveOrder);
}

export function normalizeOrder(order: Order): Order {
  return { ...order, total: Math.max(0, order.total) };
}

export function groupOrdersById(orders: Order[]): Partial<Record<string, Order[]>> {
  return Object.groupBy(orders, (order) => order.id);
}

export const listOrderLabels = (orders: Order[]): string[] => orders.map((item) => item.id);

export function OrderBadge({ label }: { label: string }) {
  return <span>{label}</span>;
}

export function useOrderDialog(): { isOpen: boolean; openOrderDialog: () => void; onClose: () => void } {
  const [isOpen, setIsOpen] = useState(false);
  const openOrderDialog = (): void => setIsOpen(true);
  const onClose = (): void => setIsOpen(false);
  return { isOpen, openOrderDialog, onClose };
}

export const renderOrderCell = (order: Order): ReactNode => <td>{order.id}</td>;

// 로직을 공유하는 훅 — 팩토리 위에 얹었으면 허용
export function useOrderTotalWithTax(orderId: string, taxRate: number): number {
  const { data: order } = useSuspenseQuery(orderQueries.detail(orderId));
  return calculateInterest(order.total) * taxRate;
}

export function useSelectableOrder(orderId: string): { order: Order; isSelected: boolean; setIsSelected: (next: boolean) => void } {
  const { data: order } = useSuspenseQuery(orderQueries.detail(orderId));
  const [isSelected, setIsSelected] = useState(false);
  return { order, isSelected, setIsSelected };
}

// 함수 몸통 안에서만 쓰는 상수는 아래에 둬도 된다 (TDZ 에 안 걸림)
export function OrderCaption({ caption }: { caption: string }) {
  return <p className={CAPTION_CLASS_NAME}>{caption}</p>;
}

const CAPTION_CLASS_NAME = "text-sm";

// 조건부 조회 — suspense 쿼리는 끌 수 없어서 useQuery 를 쓴다
export function useSearchedOrder(keyword: string): Order | undefined {
  const { data: order } = useQuery({ ...orderQueries.detail(keyword), enabled: keyword !== "" });
  return order;
}

// useQuery 를 조건부 조회로 판정하려면 skipToken 이 호출하는 자리에 보여야 한다
export function useOptionalOrder(orderId: string | undefined): Order | undefined {
  const { data: order } = useQuery(queryOptions({ queryKey: ["order", orderId], queryFn: orderId === undefined ? skipToken : async () => ({ id: orderId, total: 0, createdAt: 0 }) }));
  return order;
}
