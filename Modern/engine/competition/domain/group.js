const Competition = require("./competition");
const DomainError = require("./domain-error");

function requireIdentifier(id) {
    if (!((typeof id === "number" && Number.isFinite(id)) || (typeof id === "string" && id.trim()))) {
        throw new DomainError("INVALID_GROUP_ID", "Group id is required");
    }
}

class Group {
    constructor(options) {
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new DomainError("INVALID_GROUP", "Group options are required");
        }
        requireIdentifier(options.id);
        if (typeof options.name !== "string" || options.name.trim().length === 0) {
            throw new DomainError("INVALID_GROUP_NAME", "Group name is required");
        }
        if (!(options.competition instanceof Competition)) {
            throw new DomainError("INVALID_GROUP_OWNER", "Group requires a valid Competition");
        }

        this.id = options.id;
        this.name = options.name.trim();
        this.type = options.type;
        this.rules = options.rules;
        this.competition = options.competition;
        this._events = [];
    }

    get events() {
        return [...this._events];
    }

    addEvent(event) {
        const Event = require("./event");

        if (!(event instanceof Event)) {
            throw new DomainError("INVALID_EVENT_ASSOCIATION", "Group can only own Events");
        }
        if (event.group !== this || event.group.competition !== this.competition) {
            throw new DomainError("EVENT_OWNERSHIP_MISMATCH", "Event belongs to another Group");
        }
        if (this._events.includes(event)) {
            throw new DomainError("DUPLICATE_EVENT_ASSOCIATION", "Event is already associated with Group");
        }

        this._events.push(event);
        return event;
    }
}

module.exports = Group;
