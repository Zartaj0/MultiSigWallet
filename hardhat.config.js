require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.16",
  settings: {
    Optimizer: {
      enabled: true,
      runs: 0,
    },
  },
  networks:{
    goerli:{
      accounts:[process.env.PRIVATE_KEY1],
      url:process.env.ALCHEMY_GOERLI_URL
    },
    mumbai:{
      accounts:[process.env.PRIVATE_KEY1],
      url:process.env.ALCHEMY_MUMBAI_URL
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN
  }
};
