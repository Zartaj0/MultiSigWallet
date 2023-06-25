const { ethers } = require("hardhat");

// let messageHash;

const SignMessage = async () => {
    const VerifySignature = await ethers.getContractFactory("VerifySignature")
    const verify = await VerifySignature.deploy()
    await verify.deployed()
    const PRIV_KEY = process.env.PRIVATE_KEY2;
    const signer = new ethers.Wallet(PRIV_KEY)
    const hash = await verify.getMessageHash(0, 0)
    const sig = await signer.signMessage(ethers.utils.arrayify(hash))
    console.log(sig);
    console.log("WRONG SIGNATURE");
    const hash2 = await verify.getMessageHash(0, 1)
    const sig2 = await signer.signMessage(ethers.utils.arrayify(hash2))
    console.log(sig2);
};
SignMessage();