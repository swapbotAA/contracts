// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");
require('dotenv').config()
SWAPROUTER = process.env.SWAPROUTER02_SEPOLIA
ENTRYPOINT = process.env.ENTRYPOINT_SEPOLIA

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const SparkyAccountFactory = await ethers.getContractFactory("SparkyAccountFactory");
  sparkyAccountFactory = await SparkyAccountFactory.deploy(ENTRYPOINT)
  await sparkyAccountFactory.deployed()
  console.log("sparkyAccountFactory: ", sparkyAccountFactory.address)
  SparkyAccount = await ethers.getContractFactory("SparkyAccount")
  sparkyAccount = await SparkyAccount.deploy(ENTRYPOINT)
  console.log("SparkyAccount: ", sparkyAccount.address)

  SparkyPaymaster = await ethers.getContractFactory("SparkyPaymaster")
  sparkyPaymaster = await SparkyPaymaster.deploy(ENTRYPOINT)
  console.log("sparkyPaymaster: ", sparkyPaymaster.address)

  oneEther = ethers.utils.parseEther("0.1")

  await sparkyPaymaster.deposit({ value: oneEther })
  console.log("Done")

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
