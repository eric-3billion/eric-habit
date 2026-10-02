// serverCommands.files 로 지정된 API 파일 — 서버 명령 동사(approve·request)가 허용된다
export async function approveOrder(id: string): Promise<string> {
  return id;
}

export async function requestOrderRefund(id: string): Promise<string> {
  return id;
}

// 서버 명령 동사가 아닌 전송 동사(post)는 API 파일에서도 막힌다
export async function postOrder(id: string): Promise<string> { /* expect: eric/function-verb-whitelist */
  return id;
}
