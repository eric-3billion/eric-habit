// apiFiles — 함수 이름이 엔드포인트를 따르므로 동사 검사를 하지 않는다
export async function approveOrder(id: string): Promise<string> {
  return id;
}

export async function postOrder(id: string): Promise<string> {
  return id;
}
