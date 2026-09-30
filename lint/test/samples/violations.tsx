// 각 줄 끝의 expect 주석 = 그 줄에서 나와야 하는 룰 id. 테스트가 과소·과대 보고를 둘 다 잡는다
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"; /* expect: no-restricted-imports */
import React, { useEffect, useState, type ReactNode } from "react"; /* expect: no-restricted-imports */

import { orderQueries, type Order } from "./domain";

const STEPS = ["info", "files"] as const;
type StepName = (typeof STEPS)[number]; /* expect: eric/restricted-syntax */

type OrderShape = { id: string }; /* expect: typescript/consistent-type-definitions */

interface OrderStepConfig { /* expect: eric/no-single-member-container */
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

export function getCartAndResetCoupons(id: string): string { /* expect: eric/function-verb-whitelist */
  return id;
}

export function findOrder(orders: Order[]): Order { /* expect: eric/verb-return-contract */
  return orders[0] ?? { id: "", total: 0, createdAt: 0 };
}

export function getOrder(orders: Order[], id: string): Order | undefined { /* expect: eric/verb-return-contract */
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
    { test: (b: number) => b <= 0, message: "잔액 부족" }, /* expect: eric/discouraged-syntax */
  ];
  return rules.find((rule) => rule.test(balance))?.message;
}

export function useOrderDetail(id: string): Order { /* expect: eric/no-thin-query-hook */
  const { data } = useSuspenseQuery(orderQueries.detail(id)); /* expect: eric/no-general-name */
  return data;
}

export function OrderPanel({ orderId }: { orderId: string }): ReactNode {
  const order = useSuspenseQuery({ queryKey: ["order", orderId], queryFn: async () => orderId }); /* expect: eric/restricted-syntax */
  const catalog = useSuspenseQuery(orderQueries.list()); /* expect: eric/discouraged-syntax */
  const legacy = useQuery(orderQueries.list());
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
  if (title === "") return "-"; /* expect: eric/restricted-syntax */
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
