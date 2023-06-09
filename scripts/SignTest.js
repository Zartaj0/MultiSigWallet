const { ethers } = require("hardhat");

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const abi = require("../artifacts/contracts/Verify.sol/VerifySignature.json")
// let messageHash;

const verifyMessage = async () => {

    let message = "I allowed"

    let signer = await ethers.getSigners();
    let messageHash = await ethers.utils.hashMessage(message);
    let signed = await signer[0].signMessage(message);

    let signed2 = await signer[1].signMessage(message);
 
    let address1 = signer[0].address;
    let address2 = signer[1].address;

    try {
        // const SignAddress = signer[0].address;
        // contract = new ethers.Contract(contractAddress, abi.abi, signer[0])
        const factory = await ethers.getContractFactory("VerifySignature")
        const contract = await factory.deploy();

        const signerAddr = await contract.recoverSigner(messageHash, signed);
        console.log(signerAddr);
        if (signerAddr == address1) {
            console.log("address1 matches to signer")
        } else if (signerAddr == address2) {
            console.log("adress 2 matches");
        }
    } catch
    (err) {
        console.log(err);
    }




    return true;

};
verifyMessage();