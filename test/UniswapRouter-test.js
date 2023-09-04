const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createTypedDataAndSign } = require("../utils/signTypedData.js");
require('dotenv').config()

ZEROADDRESS = "0x0000000000000000000000000000000000000000"
WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
SWAPROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
DEADLINE = "5792089237316195423570985008687907853269984665640564039457584007913129639935"
CHAINID = 31337

describe("Wallet", function () {

    beforeEach("deploying Wallet", async function () {

        // [signer] = await ethers.getSigners();
        signer = new ethers.Wallet(process.env.PRIVATE_KEY)
        otherSigners = await ethers.getSigners();
        anotherSigner = otherSigners[0]
        // user == signer, use signer to sign a message and use user to sign a tx
        user = await ethers.getImpersonatedSigner("0x4431642f3c12dc155d4f7829a5d8d39aed754dab")
        dev = await ethers.getImpersonatedSigner("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5")

        oneEther = ethers.utils.parseEther("1")
        twoEther = ethers.utils.parseEther("2")
        threeEther = ethers.utils.parseEther("3")
        tenGwei = "10000000000"

        someEther = ethers.utils.parseEther("0.005")

        const Register = await ethers.getContractFactory("Register");
        const Wallet = await ethers.getContractFactory("Wallet");
        const UniswapRouter = await ethers.getContractFactory("UniswapRouter");

        iWETH9 = await ethers.getContractAt("IWETH9", WETH);
        iUSDC = await ethers.getContractAt("IERC20", USDC);
        iDai = await ethers.getContractAt("IERC20", DAI);

        register = await Register.deploy();
        await register.deployed()
        wallet = await Wallet.deploy(register.address, process.env.WETH_MAINNET);
        await wallet.deployed()
        uniswapRouter = await UniswapRouter.deploy(wallet.address, process.env.SWAPROUTER_MAINNET);
        await uniswapRouter.deployed()

        await register.addRouter(uniswapRouter.address)

    })

    it("Should deployed successfully", async function () {
        expect(await uniswapRouter.name()).to.equal("UniswapRouter");
    });

    it("exactInputSingle()", async function () {

        await wallet.depositETH(signer.address, { value: someEther })

        {
            let { value, r, s, v } = await createTypedDataAndSign(WETH, USDC, 3000, uniswapRouter.address, DEADLINE, someEther, signer, CHAINID)
            await uniswapRouter.connect(user).exactInputSingle(value, signer.address, v, r, s)
            
        }

        {
            usdcBalance = await wallet.balanceOf(signer.address, USDC)
            let { value, r, s, v } = await createTypedDataAndSign(USDC, DAI, 3000, uniswapRouter.address, DEADLINE, usdcBalance, signer, CHAINID)
            await uniswapRouter.connect(user).exactInputSingle(value, signer.address, v, r, s)
            daiBalance = await wallet.balanceOf(signer.address, DAI)
            await wallet.connect(user).withdrawERC20(user.address, DAI, daiBalance)
        }


    })

});
