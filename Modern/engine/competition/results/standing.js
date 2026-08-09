class Standing {
    constructor({ participantId, played = 0, wins = 0, losses = 0, scoreFor = 0, scoreAgainst = 0 }) {
        const id = Number(participantId);
        const values = [played, wins, losses, scoreFor, scoreAgainst].map(Number);

        if (!Number.isInteger(id) || id <= 0 || values.some(value => !Number.isInteger(value) || value < 0)) {
            throw new TypeError("A standing requires a valid participant and non-negative integer totals");
        }

        this.participantId = id;
        this.played = values[0];
        this.wins = values[1];
        this.losses = values[2];
        this.scoreFor = values[3];
        this.scoreAgainst = values[4];
        this.scoreDifference = this.scoreFor - this.scoreAgainst;
        Object.freeze(this);
    }
}

module.exports = { Standing };
