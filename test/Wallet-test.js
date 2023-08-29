const { expect } = require("chai");
const { ethers } = require("hardhat");


WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
SWAPROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
describe("Wallet", function () {

    beforeEach("deploying Wallet", async function () {
        const Wallet = await ethers.getContractFactory("Wallet");
        wallet = await Wallet.deploy();
        await wallet.deployed()
    })

    it("Should deployed successfully", async function () {


        expect(await wallet.WETH9()).to.equal(WETH);


    });
});
