const { expect } = require("chai");

describe ("MultiSig", function () {
  beforeEach(async function(){
    const [owner,Account1,Account2] = await ethers.getSigners();

    const MultiSig = await ethers.getContractFactory("MultiSig");
    const multiSig = await MultiSig.deploy();
  })
 
  describe("Deployment", function () {


    it("Should map the addresses to bool", async function () {
     expect
    });

    it("Should set the right owner", async function () {
      
    });

    it("Should receive and store the funds to lock", async function () {
      
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
       
      });

      it("Should revert with the right error if called from another account", async function () {
        
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        
      });
    });
  });
});
