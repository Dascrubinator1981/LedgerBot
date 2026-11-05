import type { SQLInputValue } from "node:sqlite";
export interface FinanceDb {
  prepare(sql: string): {
    get(...values: SQLInputValue[]): unknown | Promise<unknown>;
    all(...values: SQLInputValue[]): unknown[] | Promise<unknown[]>;
    run(...values: SQLInputValue[]): unknown | Promise<unknown>;
  };
  exec(sql: string): void | Promise<void>;
}
