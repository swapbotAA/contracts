const { expect } = require("chai");
const { ethers } = require("hardhat");
const { hre } = require("hardhat");

const helpers = require("@nomicfoundation/hardhat-network-helpers");


describe("Test override", function () {


    it("override successfully", async function(){
        // await helpers.setBalance(address, 100n ** 18n);

        const Test = await ethers.getContractFactory("Test");
        const test = await Test.deploy();

        const TestSimulation = await ethers.getContractFactory("TestSimulation");
        const bytecode = "0x6080604052348015600f57600080fd5b506004361060285760003560e01c80636d4ce63c14602d575b600080fd5b60336045565b60405190815260200160405180910390f35b6000805460529060016057565b905090565b60008219821115607757634e487b7160e01b600052601160045260246000fd5b50019056fea2646970667358221220605644122c684ddc74ae01ece2793d07b2a504276b7474e7849c99c8d3fbb23564736f6c634300080c0033"
      
        await helpers.setCode(test.address, bytecode);

        const testSimulation = TestSimulation.attach(test.address);

        expect(await testSimulation.get()).to.equal(2)

    })
})