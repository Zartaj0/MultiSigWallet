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
  beforeEach(async function () {
    [owner, owner1, owner2, notOwner] = await ethers.getSigners();
    owners = [owner, owner1, owner2];

    const MultiSig = await ethers.getContractFactory("MultiSig");
    multiSig = await MultiSig.deploy([owner.address, owner1.address, owner2.address], 2);
    tx = {
      to: multiSig.address,
      value: ethers.utils.parseEther('10', 'ether')
    };
    const transaction = await owner.sendTransaction(tx);

  })

  it("should mark all the owners as true in the mapping", async () => {

    expect(await multiSig.checkOwner(owner.address)).to.be.true;
    expect(await multiSig.checkOwner(owner1.address)).to.be.true;
    expect(await multiSig.checkOwner(owner2.address)).to.be.true

  })
  it("should push all the owners  in the owners array", async () => {
    let _owners = await multiSig.showOwners();
    expect(_owners.length).to.be.equal(3)

  })

  it("should set the correct policy ", async () => {
    expect(await multiSig.requiredApproval()).to.be.equal(2);
  })

  it("balance of wallet should be 10 ether", async function () {
    expect(await multiSig.balanceEther()).to.be.equal(ethers.utils.parseEther('10', 'ether'));

  });

  it("owner can submit ether transaction", async function () {
    await expect(multiSig.connect(owner).submitEtherTx(notOwner.address, getEther("2"), 0x00)).to.be.fulfilled;
  });

  it("another address cannot submit ether transaction", async function () {
    await expect(multiSig.connect(notOwner).submitEtherTx(notOwner.address, getEther("2"), 0x00)).to.be.rejected;

  });


  it("transaction should be pushed in transactions array", async function () {
    multiSig.connect(owner).submitEtherTx(notOwner.address, getEther("2"), 0x00);

    let array = await multiSig.allTxs();
    expect(array.length).to.be.greaterThan(0);
  });




  describe("Ether Transactions", async function () {

    this.beforeEach(async () => {

      multiSig.connect(owner).submitEtherTx(notOwner.address, getEther("3"), 0x00);

    })
    it("owner can't approve transaction twice", async () => {
      await expect(multiSig.connect(owner).approveTx(0)).to.be.rejected;

    })
    it("owner other than who submitted transaction can approve transaction", async function () {

      await expect(multiSig.connect(owner1).approveTx(0)).to.be.fulfilled;

    });
    it("non-owner should not be able to approve transaction", async function () {
      await expect(multiSig.connect(notOwner).approveTx(0)).to.be.revertedWith("you are not an owner");

    });
    it("recipient should get the ether after transaction is approved", async function () {
      let balanceBefore = BigInt(await ethers.provider.getBalance(notOwner.address));
      let newBalance = BigInt(await ethers.utils.parseEther("3"));
      await multiSig.connect(owner1).approveTx(0)

      expect(BigInt(await ethers.provider.getBalance(notOwner.address))).to.be.equal(newBalance + balanceBefore);
    });

  })

  describe("ERC20 transaction",async ()=>{
    this.beforeEach(async () =>{

    })

    it("should show the balance of ERC20 token", async ()=>{

    })
    
    it("owner is able to submit a transaction", async ()=>{
      
    })
    it("non-Owner is not able to submit transaction", async ()=>{
      
    })
  })




});
