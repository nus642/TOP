const assert = require("node:assert/strict");
const test = require("node:test");

const {
  Confirmation,
  ConfirmationEvidence,
  OperationsError
} = require("../../engine/operations/domain");

test("creates confirmation evidence with a reference and capture metadata", () => {
  const evidence = new ConfirmationEvidence({
    reference: "evidence-1",
    captureMetadata: { capturedAt: "2026-07-30T10:00:00.000Z", source: { kind: "signature-image" } }
  });

  assert.equal(evidence.reference, "evidence-1");
  assert.deepEqual(evidence.captureMetadata, {
    capturedAt: "2026-07-30T10:00:00.000Z",
    source: { kind: "signature-image" }
  });
});

test("rejects invalid confirmation evidence", () => {
  assert.throws(() => new ConfirmationEvidence(), OperationsError);
  assert.throws(() => new ConfirmationEvidence({ reference: "" }), { code: "INVALID_CONFIRMATION_EVIDENCE" });
  assert.throws(() => new ConfirmationEvidence({ reference: "evidence-1", captureMetadata: [] }), {
    code: "INVALID_CONFIRMATION_EVIDENCE"
  });
});

test("confirmation evidence is immutable and protects nested capture metadata", () => {
  const captureMetadata = { device: { id: "device-1" }, signers: ["player-1", "player-2"] };
  const evidence = new ConfirmationEvidence({ reference: "evidence-1", captureMetadata });

  captureMetadata.device.id = "changed";
  const exposedMetadata = evidence.captureMetadata;
  exposedMetadata.device.id = "changed-again";
  exposedMetadata.signers.length = 0;

  assert.equal(Object.isFrozen(evidence), true);
  assert.deepEqual(evidence.captureMetadata, {
    device: { id: "device-1" },
    signers: ["player-1", "player-2"]
  });
});

test("a confirmation event supports multiple evidence references", () => {
  const signatureSheet = new ConfirmationEvidence({ reference: "signature-sheet-1" });
  const scorecard = new ConfirmationEvidence({ reference: "scorecard-1" });
  const confirmation = new Confirmation({
    responsibility: "authorized-official",
    confirmedBy: "official-1",
    evidenceReferences: [signatureSheet, scorecard]
  });

  const exposedReferences = confirmation.evidenceReferences;
  exposedReferences.length = 0;

  assert.deepEqual(confirmation.evidenceReferences, [signatureSheet, scorecard]);
  assert.throws(() => new Confirmation({
    responsibility: "authorized-official",
    confirmedBy: "official-1",
    evidenceReferences: [{}]
  }), { code: "INVALID_CONFIRMATION" });
});

test("exports confirmation evidence from operations entry points", () => {
  assert.equal(require("../../engine/operations/domain").ConfirmationEvidence, ConfirmationEvidence);
  assert.equal(require("../../engine/operations").ConfirmationEvidence, ConfirmationEvidence);
});
