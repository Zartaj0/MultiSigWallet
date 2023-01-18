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

  describe("Initial Tests", async function () {
    it("should show the balance of ERC20 token", async () => {
      expect(await multiSig.balanceErc20(tokenAddress)).to.be.equal(10000000)
    })

    it("owner is able to submit an ERC20 transaction", async () => {
      await expect(multiSig.submitERC20Tx(notOwner.address, tokenAddress, 100000, 0x00)).to.be.fulfilled;
      await expect(multiSig.connect(owner1).submitERC20Tx(notOwner.address, tokenAddress, 100000, 0x00)).to.be.fulfilled;

      let array = await multiSig.allTxs();
      expect(array.length).to.be.equal(2);
    })
    it("non-Owner is not able to submit transaction", async () => {
      await expect(multiSig.connect(notOwner).submitERC20Tx(notOwner.address, tokenAddress, 100000, 0x00)).to.be.revertedWith("you are not an owner")
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
      await expect(multiSig.connect(owner).submitEtherTx(notOwner.address, getEther("2"), 0x00)).to.be.fulfilled;
    });

    it("another address cannot submit ether transaction", async function () {
      await expect(multiSig.connect(notOwner).submitEtherTx(notOwner.address, getEther("2"), 0x00)).to.be.rejected;

    });

    it("transaction should be pushed in transactions array", async function () {
      await multiSig.connect(owner).submitEtherTx(notOwner.address, getEther("2"), 0x00);

      let array = await multiSig.allTxs();
      expect(array.length).to.be.equal(1);
    });

  })

  describe("Ether Transactions approval and execution", async function () {

    beforeEach(async () => {

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

  describe("approval of ERC20 tx", async () => {
    beforeEach(async () => {
      await multiSig.submitERC20Tx(notOwner.address, tokenAddress, 100000, 0x00);
      await multiSig.connect(owner1).submitERC20Tx(notOwner.address, tokenAddress, 100000, 0x00);
    })
    it("owner is able to approve the transaction", async () => {

      await expect(multiSig.approveTx(1)).to.be.fulfilled;
      await expect(multiSig.connect(owner1).approveTx(0)).to.be.fulfilled;
    })
    it("owner should not be able to approve the transaction twice", async () => {
      await expect(multiSig.approveTx(0)).to.be.revertedWith("Already confirmedTx");
      await expect(multiSig.connect(owner1).approveTx(1)).to.be.revertedWith("Already confirmedTx");

    })
    it("non-owner should not be able to approve the transaction", async () => {
      await expect(multiSig.connect(notOwner).approveTx(0)).to.be.revertedWith("you are not an owner");
    })
    it("after getting required approval transaction should execute", async () => {
      await multiSig.approveTx(1)
      let arr = (await multiSig.singleTx(1));
      expect(await arr.executed).to.be.true;
    })
    it("The recipient should get the tokens after execution", async () => {
      await multiSig.approveTx(1);
      expect(await token.balanceOf(notOwner.address)).to.be.equal(100000)
      await multiSig.connect(owner1).approveTx(0);
      expect(await token.balanceOf(notOwner.address)).to.be.equal(200000)
    })
  })
  describe("Submitting proposals", () => {
    it("owner can submit valid proposal to revoke owner", async () => {
      await expect(multiSig.submitProposal(0, zeroaddress, 0, 0x00)).to.be.revertedWith("This address is not an owner");
      await expect(multiSig.submitProposal(0, owner1.address, 0, 0x00)).to.be.fulfilled;
      let arr = await multiSig.allProposals();
      console.log(await multiSig.paused());
      expect(arr.length).to.be.equal(1);
    })

    it("owner can submit a valid proposal to add owner", async () => {
      await expect(multiSig.submitProposal(1, ownerToAdd.address, 0, 0x00)).to.be.fulfilled;
      await expect(multiSig.submitProposal(1, zeroaddress, 0, 0x00)).to.be.revertedWith("Zero address can't be owner");
      let arr = await multiSig.allProposals();
      expect(arr.length).to.be.equal(1);
    })
    it("owner can submit valid proposal to change policy", async () => {
      await expect(multiSig.submitProposal(2, zeroaddress, 3, 0x00)).to.be.fulfilled;
      await expect(multiSig.submitProposal(2, zeroaddress, 5, 0x00)).to.be.revertedWith("inavlid policy input");;
      let arr = await multiSig.allProposals();
      expect(arr.length).to.be.equal(1);
    })
    it("owner can submit valid proposal to pause contract", async () => {
      await expect(multiSig.submitProposal(3, zeroaddress, 0, true)).to.be.fulfilled;

      let arr = await multiSig.allProposals();
      expect(arr.length).to.be.equal(1);
    })
    it("nonowner can't submit proposal", async () => {
      await expect(multiSig.connect(notOwner).submitProposal(3, zeroaddress, 3, 0x00)).to.be.revertedWith("you are not an owner");
      let arr = await multiSig.allProposals();
      expect(arr.length).to.be.equal(0);
    })
  })
  describe("Approval And execution of revokeOwner proposals", () => {

    beforeEach(async () => {
      await multiSig.submitProposal(0, owner2.address, 0, 0x00)
    })
    it("owners can approve  proposal to revoke owner and owner should be revoked", async () => {
      console.log(await multiSig.ownerProposalDetails(0));
      await expect(multiSig.connect(owner1).approveProposal(0)).to.be.fulfilled;
      expect(await multiSig.checkOwner(owner2.address)).to.be.false;

    })

    it("revoked owner can't submit any proposal", async () => {
      await expect(multiSig.connect(owner1).approveProposal(0)).to.be.fulfilled;
      await expect(multiSig.connect(owner2).submitProposal(0, owner.address, 0, 0)).to.be.revertedWith("you are not an owner")
      await expect(multiSig.connect(owner2).submitEtherTx(notOwner.address, getEther("1"), 0)).to.be.revertedWith("you are not an owner")
      await expect(multiSig.connect(owner2).submitERC20Tx(notOwner.address, tokenAddress, 1000, 0)).to.be.revertedWith("you are not an owner")

    })
    it("non-owner can't approve", async () => {
      await expect(multiSig.connect(notOwner).approveProposal(0)).to.be.revertedWith("you are not an owner");

    })

  })
  describe("Approval And execution of addOwner proposals", () => {
    beforeEach(async()=>{
      await multiSig.submitProposal(1,ownerToAdd.address,0,0);
    })
    it("owner can approve the addowner proposal and newOwner should be added", async () => {
      expect(await multiSig.checkOwner(ownerToAdd.address)).to.be.false;
       
      await expect(multiSig.connect(owner1).approveProposal(0)).to.be.fulfilled;
       expect(await multiSig.checkOwner(ownerToAdd.address)).to.be.true;
    })

    it("new owner should get the privileges of owner", async () => {
      await expect(multiSig.connect(owner1).approveProposal(0)).to.be.fulfilled;
      await expect(multiSig.connect(ownerToAdd).submitProposal(0, owner.address, 0, 0)).to.be.fulfilled
      await expect(multiSig.connect(ownerToAdd).submitEtherTx(notOwner.address, getEther("1"), 0)).to.be.fulfilled
      await expect(multiSig.connect(ownerToAdd).submitERC20Tx(notOwner.address, tokenAddress, 1000, 0)).to.be.fulfilled
    })
    it("non-owner can't approve the proposal", async () => {
      await expect(multiSig.connect(notOwner).approveProposal(0)).to.be.revertedWith("you are not an owner");

    })
   
  })
  describe("Approval And execution of changePolicy proposals", () => {

    beforeEach(async()=>{
      await multiSig.submitProposal(2,ownerToAdd.address,3,0);
    })
    it("owner can approve the policy change proposal and policy should be changed", async () => {
      expect(await multiSig.requiredApproval()).to.be.equal(2)
       
      await expect(multiSig.connect(owner1).approveProposal(0)).to.be.fulfilled;
      expect(await multiSig.requiredApproval()).to.be.equal(3)
    })


    it("non-owner can't approve the proposal", async () => {
      await expect(multiSig.connect(notOwner).approveProposal(0)).to.be.revertedWith("you are not an owner");

    })
   
  })
  describe("Approval And execution of pausing contrtact proposals", () => {
    beforeEach(async()=>{
      await multiSig.submitProposal(3,zeroaddress,0,true);
    })
    it("owner can approve the policy change proposal and policy should be changed", async () => {
      expect(await multiSig.paused()).to.be.false;
       
      await expect(multiSig.connect(owner1).approveProposal(0)).to.be.fulfilled;
      expect(await multiSig.paused()).to.be.true;
    })


    it("non-owner can't approve the proposal", async () => {
      await expect(multiSig.connect(notOwner).approveProposal(0)).to.be.revertedWith("you are not an owner");

    })
  })

  describe("no function should run after the contract is paused",async()=>{
    beforeEach(async ()=>{
      await multiSig.submitProposal(3,zeroaddress,0,true);
      await expect(multiSig.connect(owner1).approveProposal(0)).to.be.fulfilled;
    })

    it("submit functions should revert",async()=>{
      await expect(multiSig.submitERC20Tx(notOwner.address, tokenAddress, 100000, 0x00)).to.be.revertedWith("wallet is paused");
      await expect(multiSig.connect(owner).submitEtherTx(notOwner.address, getEther("2"), 0x00)).to.be.revertedWith("wallet is paused");
      await expect(multiSig.submitProposal(0, owner1.address, 0, 0x00)).to.be.revertedWith("wallet is paused");
      await expect(multiSig.submitProposal(1, ownerToAdd.address, 0, 0x00)).to.be.revertedWith("wallet is paused");
      await expect(multiSig.submitProposal(2, zeroaddress, 3, 0x00)).to.be.revertedWith("wallet is paused");
      await expect(multiSig.submitProposal(3, zeroaddress, 0, false)).to.be.fulfilled;

    })
  })

});
