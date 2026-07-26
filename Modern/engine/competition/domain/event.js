const Group = require("./group");
const DomainError = require("./domain-error");

function requireIdentifier(id) {
    if (!((typeof id === "number" && Number.isFinite(id)) || (typeof id === "string" && id.trim()))) {
        throw new DomainError("INVALID_EVENT_ID", "Event id is required");
    }
}

class Event {
    constructor(options) {
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new DomainError("INVALID_EVENT", "Event options are required");
        }
        requireIdentifier(options.id);
        if (typeof options.name !== "string" || options.name.trim().length === 0) {
            throw new DomainError("INVALID_EVENT_NAME", "Event name is required");
        }
        if (!(options.group instanceof Group)) {
            throw new DomainError("INVALID_EVENT_OWNER", "Event requires a valid Group");
        }

        this.id = options.id;
        this.name = options.name.trim();
        this.format = options.format;
        this.entryCompositionRules = options.entryCompositionRules;
        this.sportConstraints = options.sportConstraints;
        this.group = options.group;
        this._entries = [];
    }

    get competition() {
        return this.group.competition;
    }

    get entries() {
        return [...this._entries];
    }

    addEntry(entry) {
        const Entry = require("./entry");

        if (!(entry instanceof Entry)) {
            throw new DomainError("INVALID_ENTRY_ASSOCIATION", "Event can only own Entries");
        }
        if (entry.event !== this || entry.competition !== this.competition) {
            throw new DomainError("ENTRY_OWNERSHIP_MISMATCH", "Entry belongs to another Event");
        }
        if (this._entries.includes(entry)) {
            throw new DomainError("DUPLICATE_ENTRY_ASSOCIATION", "Entry is already associated with Event");
        }

        this._entries.push(entry);
        return entry;
    }
}

module.exports = Event;
