function generateRoundRobinMatches(participants) {
    if (!Array.isArray(participants) || participants.length < 2) {
        throw new TypeError("Round-robin generation requires at least two participants");
    }

    const ids = participants.map((participant) => {
        const id = Number(participant && participant.id);

        if (!Number.isInteger(id) || id <= 0) {
            throw new TypeError("Every round-robin participant requires a valid id");
        }

        return id;
    });

    if (new Set(ids).size !== ids.length) {
        throw new TypeError("Round-robin participants must be unique");
    }

    const rotation = ids.length % 2 === 0 ? [...ids] : [...ids, null];
    const roundCount = rotation.length - 1;
    const matches = [];

    for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
        for (let index = 0; index < rotation.length / 2; index += 1) {
            const sideOneId = rotation[index];
            const sideTwoId = rotation[rotation.length - 1 - index];

            if (sideOneId !== null && sideTwoId !== null) {
                matches.push({
                    roundNumber: roundIndex + 1,
                    sideOneId,
                    sideTwoId
                });
            }
        }

        rotation.splice(1, 0, rotation.pop());
    }

    return matches;
}

module.exports = {
    generateRoundRobinMatches,
    ...require("./results")
};
