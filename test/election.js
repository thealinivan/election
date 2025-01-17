var Election = artifacts.require("./Election.sol");

contract("Election", function (accounts) {
    var electionInstance;

    it("initializes with four candidates", function () {
        return Election.deployed().then(function (instance) {
            return instance.candidatesCount();
        }).then(function (count) {
            assert.equal(count, 4);
        });
    });

    it("it initializes the candidates with the correct values", function () {
        return Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.candidates(1);
        }).then(function (candidate) {
            assert.equal(candidate[0], 1, "contains the correct id");
            assert.equal(candidate[1], "Ciolacu", "contains the correct name");
            assert.equal(candidate[2], 0, "contains the correct votes count");
            return electionInstance.candidates(2);
        }).then(function (candidate) {
            assert.equal(candidate[0], 2, "contains the correct id");
            assert.equal(candidate[1], "Ciuca", "contains the correct name");
            assert.equal(candidate[2], 0, "contains the correct votes count");
            return electionInstance.candidates(3);
        }).then(function (candidate) {
            assert.equal(candidate[0], 3, "contains the correct id");
            assert.equal(candidate[1], "Geoana", "contains the correct name");
            assert.equal(candidate[2], 0, "contains the correct votes count");
            return electionInstance.candidates(4);
        }).then(function (candidate) {
            assert.equal(candidate[0], 4, "contains the correct id");
            assert.equal(candidate[1], "Simion", "contains the correct name");
            assert.equal(candidate[2], 0, "contains the correct votes count");
        });
    });

    it("allows a voter to cast a vote", function () {
        return Election.deployed().then(function (instance) {
            electionInstance = instance;
            candidateId = 1;
            return electionInstance.vote(candidateId, { from: accounts[0] });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, "an event was triggered");
            assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
            assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
            return electionInstance.voters(accounts[0]);
        }).then(function (voted) {
            assert(voted, "the voter was marked as voted");
            return electionInstance.candidates(candidateId);
        }).then(function (candidate) {
            var voteCount = candidate[2];
            assert.equal(voteCount, 1, "increments the candidate's vote count");
        })
    });

    it("throws an exception for invalid candidates", function () {
        return Election.deployed().then(function (instance) {
            electionInstance = instance;
            return electionInstance.vote(99, { from: accounts[1] })
        }).then(assert.fail).catch(function (error) {
            assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
            return electionInstance.candidates(1);
        }).then(function (candidate1) {
            var voteCount = candidate1[2];
            assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
            return electionInstance.candidates(2);
        }).then(function (candidate2) {
            var voteCount = candidate2[2];
            assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
        });
    });

    it("throws an exception for double voting", async function () {
        const electionInstance = await Election.deployed();
        const candidateId = 2;

        // First vote
        await electionInstance.vote(candidateId, { from: accounts[1] });

        // Verify first vote was successful
        const candidate = await electionInstance.candidates(candidateId);
        const voteCount = candidate[2];
        assert.equal(voteCount.toNumber(), 1, "accepts first vote");

        try {
            // Try to vote again with the same account
            await electionInstance.vote(candidateId, { from: accounts[1] });
            assert.fail("Expected revert not received");
        } catch (error) {
            // Check if it's a revert error from the EVM
            assert(
                error.message.includes('revert') ||
                error.message.includes('invalid opcode') ||
                error.message.includes('VM Exception'),
                "Expected revert, got: " + error.message
            );
        }

        // Verify vote counts remained unchanged
        const candidate1 = await electionInstance.candidates(1);
        const candidate2 = await electionInstance.candidates(2);

        assert.equal(candidate1[2].toNumber(), 1, "candidate 1 vote count should remain unchanged");
        assert.equal(candidate2[2].toNumber(), 1, "candidate 2 vote count should remain unchanged");
    });

});