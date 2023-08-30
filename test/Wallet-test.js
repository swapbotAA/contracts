const { expect } = require("chai");
const { ethers } = require("hardhat");


WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
SWAPROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
describe("Wallet", function () {

    beforeEach("deploying Wallet", async function () {

        signer = await ethers.getImpersonatedSigner("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
        dev = await ethers.getImpersonatedSigner("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5")

        oneEther = ethers.utils.parseEther("1")
        twoEther = ethers.utils.parseEther("2")
        threeEther = ethers.utils.parseEther("3")

        const Wallet = await ethers.getContractFactory("Wallet");
        iWETH9 = await ethers.getContractAt("IWETH9", WETH);

        wallet = await Wallet.deploy();
        await wallet.deployed()
    })

    it("Should deployed successfully", async function () {
        expect(await wallet.WETH9()).to.equal(WETH);
    });
    it("depositETH()", async function () {
        // console.log(oneEther)
        // console.log(await wallet.balanceOf(signer.address, signer.address))
        await wallet.connect(signer).depositETH(signer.address, { value: oneEther })
        expect(await wallet.balanceOf(signer.address, WETH)).to.equal(oneEther)

        await wallet.connect(signer).depositETH(signer.address, { value: oneEther })
        expect(await wallet.balanceOf(signer.address, WETH)).to.equal(twoEther)
        expect(await iWETH9.balanceOf(wallet.address)).to.equal(twoEther)

    });
    it("withdrawETH", async function () {
        await wallet.connect(signer).depositETH(signer.address, { value: twoEther })
        // revert when withdrawETH others balance
        try {
            tx = await wallet.connect(dev).withdrawETH(signer.address, oneEther)
            throw null
        } catch (err) {
            console.log(err.message)
            expect(err.message).to.include("Wallet: invalid sender")
        }
        // valid operatioin
        let tx = await wallet.connect(signer).withdrawETH(signer.address, oneEther)
        await expect(tx).to.changeEtherBalance(signer, oneEther)
        expect(await wallet.balanceOf(signer.address, WETH)).to.equal(oneEther)

        tx = await wallet.connect(signer).withdrawETH(signer.address, oneEther)
        await expect(tx).to.changeEtherBalance(signer, oneEther)
        expect(await wallet.balanceOf(signer.address, WETH)).to.equal(0)
        // revert when do not have balance
        try {
            tx = await wallet.connect(signer).withdrawETH(signer.address, oneEther)
            throw null
        } catch (err) {
            expect(err.message).to.include("Wallet: insufficient ethers")
        }

    })
});
