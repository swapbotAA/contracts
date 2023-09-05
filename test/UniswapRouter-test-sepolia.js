const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createTypedDataAndSign } = require("../utils/signTypedData.js");
require('dotenv').config()

ZEROADDRESS = "0x0000000000000000000000000000000000000000"
WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
SWAPROUTER = process.env.SWAPROUTER02_SEPOLIA
SALT = "0x0000000000000000000000000000000000000000000000000000000000000000"
CHAINID = process.env.HARDHAT_CHAINID

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

        someEther = ethers.utils.parseEther("0.01")

        const Register = await ethers.getContractFactory("Register");
        const Wallet = await ethers.getContractFactory("Wallet");
        const UniswapRouter = await ethers.getContractFactory("UniswapRouter");

        iWETH9 = await ethers.getContractAt("IWETH9", WETH);
        // iUSDC = await ethers.getContractAt("IERC20", USDC);
        // iDai = await ethers.getContractAt("IERC20", DAI);

        register = await Register.deploy();
        await register.deployed()
        wallet = await Wallet.deploy(register.address, WETH);
        await wallet.deployed()
        uniswapRouter = await UniswapRouter.deploy(wallet.address, SWAPROUTER);
        await uniswapRouter.deployed()

        await register.addRouter(uniswapRouter.address)

    })

    it("Should deployed successfully", async function () {
        expect(await uniswapRouter.name()).to.equal("UniswapRouter");
    });

    it("exactInputSingle()", async function () {

        await wallet.depositETH(signer.address, { value: someEther })
        someEther = await wallet.balanceOf(signer.address, WETH)

        {
            let { value, r, s, v } = await createTypedDataAndSign(WETH, UNI, 3000, uniswapRouter.address, someEther, 0, signer, CHAINID, SALT)
            await uniswapRouter.connect(user).exactInputSingle(value, SALT, signer.address, v, r, s)
        }

        {
            uniBalance = await wallet.balanceOf(signer.address, UNI)
            let { value, r, s, v } = await createTypedDataAndSign(UNI, WETH, 3000, uniswapRouter.address, uniBalance, 0, signer, CHAINID, SALT)
            await uniswapRouter.connect(user).exactInputSingle(value, SALT, signer.address, v, r, s)
            wethBalance = await wallet.balanceOf(signer.address, WETH)
            await wallet.connect(user).withdrawERC20(user.address, WETH, wethBalance)
        }


    })

});
