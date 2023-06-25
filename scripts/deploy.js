// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const array = ["0x69A0d70271fb5C402a73125D95fadA17C55aD89A","0x1af9C19A1513B9D05a7E5CaAd9F9239EF54fE2b1","0xD6E5C56b74841d333938860F7949faa8F991d88D"];

async function main() {


  // const MultiSig = await hre.ethers.getContractFactory("MultiSig");
  // const multisig = await MultiSig.deploy();

  // await multisig.deployed();
  const library = await ethers.getContractFactory("VerifySignature");
  lib = await library.deploy();
  
  const Factory = await hre.ethers.getContractFactory("Factory", {
    libraries:{ VerifySignature: lib.address }
  });
  const factory = await Factory.deploy();

  await factory.deployed();

 

  console.log(`Factory deployed ${factory.address}`);
  console.log(`Deploying MultiSig wallet`);
  const tx = await factory.createWallet(array,3);
  const rc = await tx.wait(); // 0ms, as tx is already confirmed
  const event = rc.events.find(event => event.event === 'Created');
  const [multisig, to] = event.args;


  await factory.deployTransaction.wait(10);

  await hre.run("verify:verify", {
    address: factory.address,
    contract: "contracts/Factory.sol:Factory", //Filename.sol:ClassName
    constructorArguments: [],
 });

 await hre.run("verify:verify", {
  address: multisig,
  contract: "contracts/MultiSig.sol:MultiSig", //Filename.sol:ClassName
  constructorArguments: [array,3],
});

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
