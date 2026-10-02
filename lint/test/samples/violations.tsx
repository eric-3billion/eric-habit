// 각 줄 끝의 expect 주석 = 그 줄에서 나와야 하는 룰 id. 테스트가 과소·과대 보고를 둘 다 잡는다
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import React, { Children, cloneElement, createContext, useEffect, useState, type ReactNode } from "react"; /* expect: no-restricted-imports */

import { orderQueries, type Order } from "./domain";

const STEPS = ["info", "files"] as const;
type StepName = (typeof STEPS)[number];

type OrderShape = { id: string }; /* expect: typescript/consistent-type-definitions */

interface OrderStepConfig {
  schema: string;
}

interface UploadLimit {
  imageSize: number;
  maxCount?: number;
}

interface OrderInfo { /* expect: eric/no-general-name */
  id: string;
  name: string;
}

const NO_FILLED_STEP = -1;

export function resolveOrder(id: string): string { /* expect: eric/function-verb-whitelist */
  return id;
}

// 서버 명령 동사(approve)는 serverCommands.files 밖에서는 열리지 않는다
export function approveOrder(id: string): string { /* expect: eric/function-verb-whitelist */
  return id;
}

export function getCartAndResetCoupons(id: string): string { /* expect: eric/function-verb-whitelist */
  return id;
}

// And 뒤가 동사 표에 없는 동사(sort)여도 두 동작의 나열이다
export function filterAndSortOrders(orders: Order[]): Order[] { /* expect: eric/function-verb-whitelist */
  return orders;
}

export function findOrder(orders: Order[]): Order { /* expect: eric/verb-return-contract */
  return orders[0] ?? { id: "", total: 0, createdAt: 0 };
}

export function getOrder(orders: Order[], id: string): Order | undefined { /* expect: eric/verb-return-contract */
  return orders.find((order) => order.id === id);
}

// 없음은 null 로만 표현한다
export function findOrderById(orders: Order[], id: string): Order | undefined { /* expect: eric/verb-return-contract */
  return orders.find((order) => order.id === id);
}

export function isOrderReady(order: Order): string { /* expect: eric/verb-return-contract */
  return order.id;
}

export function parsePort(raw: string): number { /* expect: eric/verb-return-contract */
  const port = Number(raw);
  if (Number.isNaN(port)) throw new Error("NaN"); /* expect: eric/restricted-syntax */
  return port;
}

export function calculateFilledStepIndex(filledStepCount: number): number {
  return NO_FILLED_STEP + filledStepCount; /* expect: eric/no-sentinel-arithmetic */
}

export function calculateTotal(orders: Order[]): number {
  let total = 0; /* expect: eric/restricted-syntax */
  for (const order of orders) total += order.total; /* expect: eric/restricted-syntax */
  return total;
}

export function calculateTier(score: number): string {
  return score > 90 ? "gold" : score > 70 ? "silver" : "bronze"; /* expect: no-nested-ternary */
}

export function toOrderId(order: Order): string {
  const shape = order as OrderShape; /* expect: typescript/consistent-type-assertions */
  return shape.id;
}

export function toOrderTotal(order: Order | undefined): number {
  return order!.total; /* expect: typescript/no-non-null-assertion */
}

export function toUnknownOrder(raw: any): Order { /* expect: typescript/no-explicit-any */
  return raw;
}

export function toBlockMessage(balance: number): string | undefined {
  const rules = [
    { test: (b: number) => b <= 0, message: "잔액 부족" },
  ];
  return rules.find((rule) => rule.test(balance))?.message;
}

export function useOrderDetail(id: string): Order { /* expect: eric/no-thin-query-hook */
  const { data } = useSuspenseQuery(orderQueries.detail(id)); /* expect: eric/no-general-name */
  return data;
}

export function OrderPanel({ orderId }: { orderId: string }): ReactNode {
  const order = useSuspenseQuery({ queryKey: ["order", orderId], queryFn: async () => orderId }); /* expect: @tanstack/query/prefer-query-options */
  const freshOrder = useSuspenseQuery({ ...orderQueries.detail(orderId), staleTime: 0 }); /* expect: eric/discouraged-syntax, eric/restricted-syntax */
  const catalog = useSuspenseQuery(orderQueries.list()); /* expect: eric/discouraged-syntax */
  const legacy = useQuery(orderQueries.list()); /* expect: eric/restricted-syntax */
  const [width, setWidth] = useState(0);
  const [mirror, setMirror] = useState(orderId);
  useEffect(() => {
    setMirror(orderId);
  }, [orderId]);
  React.useLayoutEffect(() => setWidth(1), []); /* expect: eric/restricted-syntax */

  return (
    <OrderHeader showSearch data-testid="order-panel" title={`${mirror}${width}${String(order.data)}${String(catalog.data)}${String(legacy.data)}`} /> /* expect: eric/discouraged-syntax, eric/restricted-syntax */
  );
}

export function OrderHeader({ title }: { /* expect: eric/props-inline-type-single-line */
  title: string;
  showSearch: boolean;
}): ReactNode {
  if (title === "") return "-";
  return <h1>{title}</h1>;
}

export function toStepLabel(step: StepName): string {
  switch (step) {
    case "info":
      return "정보";
    default:
      return "";
  }
}

/* 기존엔 여기서 직접 계산했다 */ /* expect: no-warning-comments */
export const toDoubled = (value: number): number => value * 2; /* expect: eric/no-general-name */

export function filterOrderIds(orders: Order[]): string { /* expect: eric/verb-return-contract */
  return orders.map((order) => order.id).join(",");
}

export function normalizeOrderId(order: Order): string { /* expect: eric/verb-return-contract */
  return order.id.trim();
}

export function listOrderIds(orders: Order[]): string[] {
  const [first] = orders;
  const { id: result } = first ?? { id: "" }; /* expect: eric/no-general-name */
  return orders.map((item) => item.id).concat(result);
}

export function toOrderLabel(order: Order) { /* expect: eric/explicit-return-type */
  return order.id;
}

export const useOrderList = (): { data: Order[] } => useSuspenseQuery(orderQueries.list()); /* expect: eric/no-thin-query-hook */

export const earlyRate = LATE_RATE * 2; /* expect: no-use-before-define */
const LATE_RATE = 3;

export function calculateOrderTotal(orders: Order[]): number {
  orders.forEach((order) => order.id); /* expect: unicorn/no-array-for-each */
  return orders.length;
}

export function setOrderFallback(onChange: (next: string | undefined) => void): void {
  onChange(undefined); /* expect: unicorn/no-useless-undefined */
}

export function formatOrderStatus(isPaid: boolean): string {
  return !isPaid ? "미결제" : "결제"; /* expect: unicorn/no-negated-condition */
}

// consistent-function-scoping 은 바깥 함수 줄에 보고된다
export function OrderList({ orders }: { orders: Order[] }): ReactNode { /* expect: unicorn/consistent-function-scoping */
  const toOrderLabel = (order: Order): string => order.id;
  return <ul>{orders.map((order) => <li key={order.id}>{toOrderLabel(order)}</li>)}</ul>;
}

export function calculateOrderDepth(orders: Order[], id: string): number {
  if (orders.length > 0) {
    if (id !== "") {
      if (orders[0]?.id === id) {
        if (id.length > 1) return 4; /* expect: max-depth */
      }
    }
  }
  return 0;
}

export function createOrderLine(id: string, sku: string, qty: number, price: number, note: string): string { /* expect: max-params */
  return [id, sku, qty, price, note].join("-");
}

export const OrderBadge = ({ id }: { id: string }): ReactNode => <span>{id}</span>; /* expect: react/function-component-definition */

export function OrderToggle(): ReactNode {
  const [open, setVisible] = useState(false); /* expect: react/hook-use-state */
  return <button type="button" onClick={() => setVisible(!open)}>{String(open)}</button>;
}

// 바깥 스코프를 안 쓰는 중첩 컴포넌트는 consistent-function-scoping 도 같이 잡는다
export function OrderTable({ orders }: { orders: Order[] }): ReactNode { /* expect: unicorn/consistent-function-scoping */
  function OrderCell({ id }: { id: string }): ReactNode { /* expect: react/no-unstable-nested-components */
    return <td>{id}</td>;
  }
  return <tr>{orders.map((order) => <OrderCell key={order.id} id={order.id} />)}</tr>;
}

export function listSortedOrderIds(orderIds: string[]): string[] {
  return orderIds.sort(); /* expect: unicorn/no-array-sort */
}

export function listReversedOrderIds(orderIds: string[]): string[] {
  return orderIds.reverse(); /* expect: unicorn/no-array-reverse */
}


// @ts-ignore /* expect: typescript/ban-ts-comment */
export const ignoredOrderId: string = 1;

/* eslint-disable */ /* expect: unicorn/no-abusive-eslint-disable */
export const disabledOrderId = "";
/* eslint-enable */

export interface OrderById { [orderId: string]: Order } /* expect: typescript/consistent-indexed-object-style */

export function removeOrderById(orderById: Record<string, Order>, orderId: string): Record<string, Order> {
  const nextOrderById = { ...orderById };
  delete nextOrderById[orderId]; /* expect: typescript/no-dynamic-delete */
  return nextOrderById;
}

export function OrderSlot({ children }: { children: JSX.Element }): ReactNode {
  return cloneElement(children, { id: "order" }); /* expect: react/no-clone-element */
}

export function OrderItems({ children }: { children: ReactNode }): ReactNode {
  return <ul>{Children.map(children, (child) => <li>{child}</li>)}</ul>; /* expect: react/no-react-children */
}

export function OrderTags({ tags = [] }: { tags?: string[] }): ReactNode { /* expect: react/no-object-type-as-default-prop */
  return <span>{tags.join(",")}</span>;
}

const OrderIdContext = createContext({ id: "" });

export function OrderIdProvider({ id, children }: { id: string; children: ReactNode }): ReactNode {
  return <OrderIdContext.Provider value={{ id }}>{children}</OrderIdContext.Provider>; /* expect: react/jsx-no-constructed-context-values */
}

export function handleOrderDebug(order: Order): void {
  console.log(order.id); /* expect: no-console */
  console.error(order.id);
}

export function groupOrdersById(orders: Order[]): Record<string, Order> {
  return orders.reduce((orderById, order) => ({ ...orderById, [order.id]: order }), {}); /* expect: oxc/no-accumulating-spread */
}

export const createOrderTotalQuery = (orderId: string) => /* expect: eric/explicit-return-type */
  queryOptions({ queryKey: ["order-total"], queryFn: async () => orderId }); /* expect: @tanstack/query/exhaustive-deps */
