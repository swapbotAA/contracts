require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config()
require("hardhat-tracer");

// require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const privateKey =

  // You need to export an object to set up your config
  // Go to https://hardhat.org/config/ to learn more

  /**
   * @type import('hardhat/config').HardhatUserConfig
   */
  module.exports = {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API,
    },
    networks: {
      hardhat: {
        forking: {
          // url: "https://mainnet.infura.io/v3/b6b76cf6eef242a197dd2916d295210c",
          // blockNumber: 16045624,
          url: "https://sepolia.infura.io/v3/b6b76cf6eef242a197dd2916d295210c",
          blockNumber: 4227276,
        },
        gas: 5000000
        // account:[]
      },
      sepolia: {
        url: "https://sepolia.infura.io/v3/b6b76cf6eef242a197dd2916d295210c",
        accounts: [process.env.PRIVATE_KEY],
        gas: 2100000
      }
    },

    solidity: {
      compilers: [
        {
          version: "0.8.12",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        },
        {
          version: "0.8.7",
          settings: {
            optimizer: {
              enabled: true,
              runs: 200
            }
          }
        },
      ],

    },


  };


