require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");



/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 0,
      },
    }
  },

  networks: {
    goerli: {
      accounts: [process.env.PRIVATE_KEY1],
      url: process.env.ALCHEMY_GOERLI_URL
    },
    mumbai: {
      accounts: [process.env.PRIVATE_KEY1],
      url: process.env.ALCHEMY_MUMBAI_URL
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP
  }
};
