require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config()
require("hardhat-tracer");

require("hardhat-gas-reporter");

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
      apiKey: process.env.BSCSCAN_API,
      // apiKey: process.env.ETHERSCAN_API,

    },
    networks: {
      hardhat: {
        forking: {
          // url: "https://mainnet.infura.io/v3/b6b76cf6eef242a197dd2916d295210c",
          // blockNumber: 16045624,
          // url: "https://eth-sepolia.g.alchemy.com/v2/ZLVKiHfu_pItPKYwb0-u6uHDNqjB1bB7",
          url:"https://lingering-skilled-glade.bsc.quiknode.pro/2ada68de517b7ab3d92271ce0540215c7aa26a7d/",
          blockNumber: 35663348,
        },
        gas: 5000000
        // account:[]
      },
      sepolia: {
        url: "https://eth-sepolia.g.alchemy.com/v2/ZLVKiHfu_pItPKYwb0-u6uHDNqjB1bB7",
        accounts: [process.env.PRIVATE_KEY],
        gas: 2100000
      },
      bsc: {
        url: "https://lingering-skilled-glade.bsc.quiknode.pro/2ada68de517b7ab3d92271ce0540215c7aa26a7d/",
        accounts: [process.env.PRIVATE_KEY],
        gasPrice: 3000000000 // 3gwei
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


