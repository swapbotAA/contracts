const { expect } = require("chai");
const { ethers } = require("hardhat");
const { domain ,types } = require("../utils/signTypedData.js")
ZEROADDRESS = "0x0000000000000000000000000000000000000000"
WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
SWAPROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
CHAINID = 31337
describe("Wallet", function () {

    beforeEach("deploying Wallet", async function () {

        signer = await ethers.getImpersonatedSigner("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
        dev = await ethers.getImpersonatedSigner("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5")

        oneEther = ethers.utils.parseEther("1")
        twoEther = ethers.utils.parseEther("2")
        threeEther = ethers.utils.parseEther("3")

        const Register = await ethers.getContractFactory("Register");
        const Wallet = await ethers.getContractFactory("Wallet");
        iWETH9 = await ethers.getContractAt("IWETH9", WETH);
        iUSDC = await ethers.getContractAt("IERC20", USDC);
        iDai = await ethers.getContractAt("IERC20", DAI);



        register = await Register.deploy();
        wallet = await Wallet.deploy(register.address, process.env.WETH_MAINNET);
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
    it("depositERC20()", async function () {
        // console.log(oneEther)
        // console.log(await wallet.balanceOf(signer.address, signer.address))
        await iDai.connect(signer).approve(wallet.address, oneEther)
        await wallet.connect(signer).depositERC20(signer.address, DAI, oneEther)
        // await wallet.connect(signer).depositETH(signer.address, { value: oneEther })
        expect(await wallet.balanceOf(signer.address, DAI)).to.equal(oneEther)
        // await wallet.connect(signer).depositETH(signer.address, { value: oneEther })

       

    });
    it("withdrawERC20", async function (){
        await iDai.connect(signer).approve(wallet.address, oneEther)
        await wallet.connect(signer).depositERC20(signer.address, DAI, oneEther)
        await wallet.connect(signer).withdrawERC20(signer.address, DAI, oneEther)
        expect(await wallet.balanceOf(signer.address, DAI)).to.equal(0)

        await iDai.connect(signer).approve(wallet.address, oneEther)
        await wallet.connect(signer).depositERC20(signer.address, DAI, oneEther)
        // revert when withdrawETH others balance
        try {
            tx = await wallet.connect(dev).withdrawERC20(signer.address, DAI, oneEther)
            throw null
        } catch (err) {
            expect(err.message).to.include("Wallet: invalid sender")
        }
    })

});
