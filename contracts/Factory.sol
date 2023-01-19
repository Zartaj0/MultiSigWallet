// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./MultiSig.sol";

contract ZarFactory {
    event Created(MultiSig walletAddress, address creator);

    function createWallet(address[] memory _owners, uint requiredSignature) external {
        MultiSig wallet = new MultiSig(_owners,requiredSignature);

        emit Created(wallet, msg.sender);
    }
}
