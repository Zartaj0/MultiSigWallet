require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    goerli:{
      accounts:[process.env.PRIVATE_KEY1],
      url:process.env.ALCHEMY_GOERLI_URL
    },
    mumbai:{
      accounts:[process.env.PRIVATE_KEY1],
      url:process.env.ALCHEMY_MUMBAI_URL
    }
  }
};
