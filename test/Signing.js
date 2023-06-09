const { expect } = require("chai");
//const { ethers } = require("ethers");

async function getEther(amount) {
    const ethAmount = await ethers.utils.parseEther(amount).toString();
    return ethAmount;
}

describe.only("MultiSig", function () {

    let multiSig;
    let owner;
    let owner1;
    let owner2;
    let owners;
    let tokenAddress;
    let token;
    const zeroaddress = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, owner1, owner2, notOwner, ownerToAdd] = await ethers.getSigners();
        owners = [owner, owner1, owner2];

        const MultiSig = await ethers.getContractFactory("MultiSig");
        multiSig = await MultiSig.deploy([owner.address, owner1.address, owner2.address], 2);
        tx = {
            to: multiSig.address,
            value: ethers.utils.parseEther('10', 'ether')
        };
        const transaction = await owner.sendTransaction(tx);

        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy();
        tokenAddress = token.address;
        token.transfer(multiSig.address, 10000000);
    })

});
