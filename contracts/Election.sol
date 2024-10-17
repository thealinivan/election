// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
//model
contract Election {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates; // read/write candidates
    mapping(address => bool) public voters; // accounts that voted
    uint public candidatesCount;

    constructor() {
        addCandidate("Ciolacu");
        addCandidate("Ciuca");
        addCandidate("Geoana");
        addCandidate("Simion");
    }

    function addCandidate(string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote(uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount++;

        // trigger voted event
        emit votedEvent(_candidateId);
    }

    event votedEvent(uint indexed _candidateId);
}
