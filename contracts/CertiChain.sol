// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Stores only certificate hashes and non-personal identifiers.
contract CertiChain {
    struct Record { bytes32 hash; bytes32 issuerId; uint64 registeredAt; bool revoked; bool exists; }

    mapping(bytes32 => Record) private records; // key: keccak256(certificate code)
    mapping(address => bytes32) public issuers;
    address public owner;

    event CertificateRegistered(bytes32 indexed certificateId, bytes32 hash, bytes32 issuerId);
    event CertificateRevoked(bytes32 indexed certificateId);

    constructor() { owner = msg.sender; }

    modifier onlyIssuer() { require(issuers[msg.sender] != bytes32(0), "not issuer"); _; }

    function setIssuer(address account, bytes32 issuerId) external {
        require(msg.sender == owner, "not owner");
        issuers[account] = issuerId;
    }

    function registerCertificate(bytes32 certificateId, bytes32 hash) external onlyIssuer {
        require(!records[certificateId].exists, "exists");
        records[certificateId] = Record(hash, issuers[msg.sender], uint64(block.timestamp), false, true);
        emit CertificateRegistered(certificateId, hash, issuers[msg.sender]);
    }

    function revokeCertificate(bytes32 certificateId) external onlyIssuer {
        Record storage r = records[certificateId];
        require(r.exists && r.issuerId == issuers[msg.sender], "not found");
        r.revoked = true;
        emit CertificateRevoked(certificateId);
    }

    function getCertificate(bytes32 certificateId) external view returns (Record memory) {
        return records[certificateId];
    }

    function isCertificateValid(bytes32 certificateId, bytes32 hash) external view returns (bool) {
        Record memory r = records[certificateId];
        return r.exists && !r.revoked && r.hash == hash;
    }
}
