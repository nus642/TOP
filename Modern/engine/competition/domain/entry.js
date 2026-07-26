const Event = require("./event");
const DomainError = require("./domain-error");

function requireIdentifier(id) {
    if (!((typeof id === "number" && Number.isFinite(id)) || (typeof id === "string" && id.trim()))) {
        throw new DomainError("INVALID_ENTRY_ID", "Entry id is required");
    }
}

class Entry {
    constructor(options) {
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new DomainError("INVALID_ENTRY", "Entry options are required");
        }
        requireIdentifier(options.id);
        if (!(options.event instanceof Event)) {
            throw new DomainError("INVALID_ENTRY_OWNER", "Entry requires a valid Event");
        }

        this.id = options.id;
        this.name = typeof options.name === "string" ? options.name.trim() : options.name;
        this.event = options.event;
        this._participants = [];
    }

    get competition() {
        return this.event.competition;
    }

    get participants() {
        return [...this._participants];
    }

    addParticipant(participant) {
        const Participant = require("./participant");

        if (!(participant instanceof Participant)) {
            throw new DomainError("INVALID_PARTICIPANT_ASSOCIATION", "Entry can only own Participants");
        }
        if (participant.entry !== this || participant.competition !== this.competition) {
            throw new DomainError("PARTICIPANT_OWNERSHIP_MISMATCH", "Participant belongs to another Entry");
        }
        if (this._participants.includes(participant)) {
            throw new DomainError("DUPLICATE_PARTICIPANT_ASSOCIATION", "Participant is already associated with Entry");
        }

        this._participants.push(participant);
        return participant;
    }
}

module.exports = Entry;
