const Entry = require("./entry");
const DomainError = require("./domain-error");

function requireIdentifier(id, code, message) {
    if (!((typeof id === "number" && Number.isFinite(id)) || (typeof id === "string" && id.trim()))) {
        throw new DomainError(code, message);
    }
}

class Participant {
    constructor(options) {
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new DomainError("INVALID_PARTICIPANT", "Participant options are required");
        }
        requireIdentifier(options.id, "INVALID_PARTICIPANT_ID", "Participant id is required");
        if (!(options.entry instanceof Entry)) {
            throw new DomainError("INVALID_PARTICIPANT_OWNER", "Participant requires a valid Entry");
        }
        requireIdentifier(options.identityId, "INVALID_IDENTITY_REFERENCE", "Participant identity reference is required");

        this.id = options.id;
        this.identityId = options.identityId;
        this.entry = options.entry;
    }

    get competition() {
        return this.entry.competition;
    }
}

module.exports = Participant;
