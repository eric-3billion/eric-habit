// habits/06 테스트 룰 — vitest·testing-library
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

describe("주문 목록", () => {
  it("행을 누르면 상세가 열린다", async () => {
    render(<ul />);
    fireEvent.click(screen.getByRole("row")); /* expect: testing-library/prefer-user-event */
    await waitFor(() => {
      // 같은 대상을 여러 번 단언하면 첫 단언이 통과할 때까지 기다리지 않는다
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument(); /* expect: testing-library/no-wait-for-multiple-assertions */
    });
  });

  it("render 결과 대신 screen 으로 찾는다", () => {
    const view = render(<ul />);
    expect(view.getByRole("list")).toBeInTheDocument(); /* expect: testing-library/prefer-screen-queries */
  });

  it("DOM 구조로 찾지 않는다", () => {
    const { container } = render(<ul />);
    expect(container.querySelector("li")).toBe(null); /* expect: testing-library/no-container, testing-library/no-node-access */
  });

  it("분기 안의 단언은 돌지 않을 수 있다", () => { /* expect: vitest/expect-expect */
    const row = screen.queryByRole("row");
    if (row !== null) expect(row).toBeInTheDocument(); /* expect: vitest/no-conditional-expect, vitest/no-conditional-in-test */
  });

  it("아무 에러나 통과시키지 않는다", () => {
    expect(() => JSON.parse("{")).toThrow(); /* expect: vitest/require-to-throw-message */
  });

  it("단언이 없다", () => { /* expect: vitest/expect-expect */
    render(<ul />);
  });
  it.skip("꺼 둔 테스트", () => { /* expect: vitest/no-disabled-tests */
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it.only("하나만 도는 테스트", () => { /* expect: vitest/no-focused-tests */
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("값을 반환하는 테스트", () => {
    return expect(screen.getByRole("list")).toBeInTheDocument(); /* expect: vitest/no-test-return-statement */
  });

  if (screen.queryByRole("row") !== null) { /* expect: vitest/no-conditional-tests */
    it("조건 안에서 선언한 테스트", () => {
      expect(screen.getByRole("row")).toBeInTheDocument();
    });
  }

  describe("1", () => {
    describe("2", () => {
      describe("3", () => {
        describe("4", () => {
          describe("5", () => { /* expect: vitest/max-nested-describe */
            it("깊다", () => {
              expect(screen.getByRole("list")).toBeInTheDocument();
            });
          });
        });
      });
    });
  });
});
