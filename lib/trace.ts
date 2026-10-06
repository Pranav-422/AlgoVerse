// A request trace: the ordered steps one generation went through, with timings.
// Client-safe. Shown as a timeline in "How this was generated" and stored in gen_log.

export interface TraceStep {
  step: string;
  status: "ok" | "retry" | "fail" | "skip";
  ms: number;
  detail?: string;
}

export class Tracer {
  steps: TraceStep[] = [];
  private t0 = Date.now();

  /** Time a synchronous or async step and record it. Re-throws on failure after recording. */
  async time<T>(step: string, fn: () => T | Promise<T>, detail?: (v: T) => string | undefined): Promise<T> {
    const start = Date.now();
    try {
      const v = await fn();
      this.steps.push({ step, status: "ok", ms: Date.now() - start, detail: detail?.(v) });
      return v;
    } catch (e) {
      this.steps.push({ step, status: "fail", ms: Date.now() - start, detail: e instanceof Error ? e.message : String(e) });
      throw e;
    }
  }

  add(step: string, status: TraceStep["status"], ms = 0, detail?: string) {
    this.steps.push({ step, status, ms, detail });
  }

  total() {
    return Date.now() - this.t0;
  }
}
