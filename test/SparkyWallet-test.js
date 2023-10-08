const { expect } = require("chai");
const { ethers } = require("hardhat");
require('dotenv').config()



describe("Sparky-Wallet", function () {

    beforeEach("deploying Wallet", async function () {
        signer = new ethers.Wallet(process.env.PRIVATE_KEY)

        SparkyAccountFactory = await ethers.getContractFactory("SparkyAccountFactory");
        sparkyAccountFactory = await SparkyAccountFactory.deploy(process.env.ENTRYPOINT_SEPOLIA)
        await sparkyAccountFactory.deployed()

        SparkyAccount = await ethers.getContractFactory("SparkyAccount")
        sparkyAccount = await SparkyAccount.deploy(process.env.ENTRYPOINT_SEPOLIA)
        await sparkyAccount.deployed()




    })
    it("should manually create account successfully", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 1)
        let account = SparkyAccount.attach(addr)
        let tx = await sparkyAccountFactory.createAccount(signer.address, 1)

        await expect(tx)
            .to.emit(account, 'SparkyAccountInitialized').withArgs(
                process.env.ENTRYPOINT_SEPOLIA,
                signer.address
            );
        let receipt = await tx.wait()
        // console.log(receipt)
        // expect(addr).to.equal("0x0000")
    })

})
