"use strict";
class MutationGate {
  constructor() { this.state = "OPEN"; this.inFlightWrites = new Map(); this.outcomes = []; this.lastCompletedOperationId = null; this.sequence = 0; }
  async mutate(label, dispatch) {
    if (this.state !== "OPEN") throw new Error(`mutation rejected while gate is ${this.state}`);
    const operationId = `mutation-${String(++this.sequence).padStart(4, "0")}`;
    this.inFlightWrites.set(operationId, { label, admittedAt: new Date().toISOString() });
    try {
      const result = await dispatch(operationId);
      const outcome = { operationId, label, outcome: "completed", completedAt: new Date().toISOString() };
      this.outcomes.push(outcome); this.lastCompletedOperationId = operationId; return result;
    } catch (error) {
      const ambiguous = error?.name === "AbortError" || /timeout|connection|socket|fetch failed/i.test(String(error?.message));
      this.outcomes.push({ operationId, label, outcome: ambiguous ? "ambiguous" : "rejected", completedAt: new Date().toISOString() });
      if (ambiguous) throw new Error(`ambiguous mutation outcome for ${operationId}`); throw error;
    } finally { this.inFlightWrites.delete(operationId); }
  }
  async close() {
    if (this.state !== "OPEN") throw new Error("gate close requires OPEN");
    const closingAt = new Date().toISOString(); this.state = "CLOSING";
    while (this.inFlightWrites.size) await new Promise((resolve) => setTimeout(resolve, 5));
    if (this.outcomes.some((x) => x.outcome === "ambiguous")) throw new Error("cannot bind recovery point after ambiguous mutation");
    this.state = "CLOSED"; return { closingAt, closedAt: new Date().toISOString(), inFlightWrites: 0, lastCompletedMutationOperationId: this.lastCompletedOperationId };
  }
  open() { if (this.state !== "CLOSED") throw new Error("gate open requires CLOSED"); this.state = "OPEN"; return new Date().toISOString(); }
}
module.exports = { MutationGate };
