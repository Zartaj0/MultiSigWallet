// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "./MultiSig.sol";

contract ZarFactory {
    event created(MultiSig walletaddress, address creator);

    function CreateWallet(address[] memory _owners, uint requiredSignature) external {
        MultiSig wallet = new MultiSig(_owners,requiredSignature);

        emit created(wallet, msg.sender);
    }
}
