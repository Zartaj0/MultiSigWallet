const { expect } = require("chai")
const { ethers } = require("hardhat")


describe("VerifySignature", async function () {
  it("Check signature", async function () {
    const accounts = await ethers.getSigners()
    //deplooy verrification
    const VerifySignature = await ethers.getContractFactory("VerifySignature")
    const verify = await VerifySignature.deploy()
    await verify.deployed()
    //deepploy multisig
    const MultiSig = await ethers.getContractFactory("VerifySignature")
    const multisig = await MultiSig.deploy()
    await multisig.deployed()


    // const PRIV_KEY = "0x..."
    // const signer = new ethers.Wallet(PRIV_KEY)
    const signer = accounts[0]
    const txIndex = 999
    const nonce = 123

    const hash = await verify.getMessageHash(txIndex, nonce)
    let messageHash = await ethers.utils.hashMessage(txIndex, nonce);

    const sig = await signer.signMessage(ethers.utils.arrayify(messageHash))

    const hash1 = await verify.getMessageHash(101, nonce)

    const sig1 = await signer.signMessage(ethers.utils.arrayify(hash1))
    const ethHash = await verify.getEthSignedMessageHash(messageHash)


    console.log("signer          ", signer.address)
    console.log("recovered signer", await verify.recoverSigner(ethHash, sig))

    
    // Correct signature and message returns true
    expect(
      await verify.verify(signer.address, txIndex, nonce, sig)
    ).to.equal(true)

    // Incorrect message returns false
    expect(
      await verify.verify(signer.address, txIndex + 1, nonce, sig)
    ).to.equal(false)
  })
})