# MultiSig wallet

This project demonstrates a multisig wallet use case. 
Multisig wallet refers to a joint wallet which requires individual signatures of the owners of the wallet.

Checkout this factory contract - https://mumbai.polygonscan.com/address/0x83b3c46a13512e692e656f9fcda81667f72bb95e

Here you can pass an array of addresses that you want to make the owners of multisig wallet.
Second argument is a uint which refers to the number of signatures required to perform any operation.

After calling the `createWallet` function with these function parameters, a child contract will be deployed and the address of this contractt will be emitted as an event.
You can then go to that contract, copy the address send funds to that address and your funds will be stored in the wallet until you submit a transaction and the other owners approve the transaction. 

This wallet supports ERC20 as well. There are seperate functions for ERC20 tokens and ether.

Apart from this, you can add new owner, remove an owner, change the number of confirmations required for an operation.
For this you need to submit a proposal by passing three parameters:
1. Uint Proposal type : 0 to remove an owner, 1 to add an owner, 2 to change the number of sgnatures required,3 to pause or unpause the contract.
2. address owner : only pass an address if you select 0 or 1 proposal type otherwise you can pass the zero address.
3. uint requireSign: pass the number of signatures you want to update. If you don't want to update it just pass anything it won't matter cause the function only reads it   when you have selected the proposal type 2.

## remember you don't need to worry about all the arguments, you just need to pass the correct argument for what kind of proposal you have selected. The other ones will not be readed by the function so you can pass zero to them.

After submitting this proposal you will get an index in the emitted event.
And later on the other owner can see what the propposal is about with that index and then approve it.
When the last approval is given, the approve function automatically calls the execute function.

