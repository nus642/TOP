const DomainError = require("./domain-error");

function requireIdentifier(id) {
    const validNumber = typeof id === "number" && Number.isFinite(id);
    const validString = typeof id === "string" && id.trim().length > 0;

    if (!validNumber && !validString) {
        throw new DomainError("INVALID_COMPETITION_ID", "Competition id is required");
    }
}

function requireName(name) {
    if (typeof name !== "string" || name.trim().length === 0) {
        throw new DomainError("INVALID_COMPETITION_NAME", "Competition name is required");
    }
}

class Competition {
    constructor(options) {
        if (!options || typeof options !== "object" || Array.isArray(options)) {
            throw new DomainError("INVALID_COMPETITION", "Competition options are required");
        }

        requireIdentifier(options.id);
        requireName(options.name);

        this.id = options.id;
        this.name = options.name.trim();
        this.description = options.description;
        this._groups = [];
    }

    get groups() {
        return [...this._groups];
    }

    addGroup(group) {
        const Group = require("./group");

        if (!(group instanceof Group)) {
            throw new DomainError("INVALID_GROUP_ASSOCIATION", "Competition can only own Groups");
        }
        if (group.competition !== this) {
            throw new DomainError("GROUP_OWNERSHIP_MISMATCH", "Group belongs to another Competition");
        }
        if (this._groups.includes(group)) {
            throw new DomainError("DUPLICATE_GROUP_ASSOCIATION", "Group is already associated with Competition");
        }

        this._groups.push(group);
        return group;
    }
}

module.exports = Competition;
