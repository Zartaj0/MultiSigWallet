# MultiSig wallet

This project demonstrates a multisig wallet use case. 
Multisig wallet refers to a joint wallet which requires individual signatures of the owners of the wallet.

Checkout this factory contract - https://mumbai.polygonscan.com/address/0x953bf7f845bea743296554cb6d9fef991ddf8519

Here you can pass an array of addresses that you want to make the owners of multisig wallet.
Second argument is a uint which refers to the number of signatures required to perform any operation.

After calling the `createWallet` functuin with these function, a child contract will be deployed and the address of this contractt will be emitted as an event.
You can then go to that contract, copy the address send funds to that address and your funds will be stored in that wallet until you submit a transaction and the other owners approve the transaction. 

This wallet supports ERC20 as well. There are seperate functions for ERC20 tokens and ether.

