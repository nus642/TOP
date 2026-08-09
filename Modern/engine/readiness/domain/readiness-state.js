const READINESS_STATES = Object.freeze({
  NOT_CHECKED_IN: "not_checked_in",
  READY: "ready"
});

class ReadinessState {
  constructor({ participantId, checkedIn = false, checkedInAt = null }) {
    if (!Number.isInteger(participantId) || participantId <= 0) {
      throw new TypeError("ReadinessState requires a positive participantId");
    }

    this.participantId = participantId;
    this.state = checkedIn ? READINESS_STATES.READY : READINESS_STATES.NOT_CHECKED_IN;
    this.checkedInAt = checkedInAt || null;
    Object.freeze(this);
  }

  static fromPersistence(participantId, record) {
    return new ReadinessState({
      participantId,
      checkedIn: Boolean(record && record.checked_in),
      checkedInAt: record && record.checked_in_at
    });
  }
}

module.exports = { ReadinessState, READINESS_STATES };
