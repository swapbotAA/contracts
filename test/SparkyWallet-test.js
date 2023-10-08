const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createUserOperation, createInitCode } = require("../utils/createUserOperation")
require('dotenv').config()
const helpers = require("@nomicfoundation/hardhat-network-helpers");

UNI = process.env.UNI_SEPOLIA
WETH = process.env.WETH_SEPOLIA

describe("Sparky-Wallet", function () {

    beforeEach("deploying Wallet", async function () {
        provider = ethers.provider
        signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
        // user = await ethers.getImpersonatedSigner("0x4431642f3c12dc155d4f7829a5d8d39aed754dab")
        // dev = await ethers.getImpersonatedSigner("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5")
        EntryPoint = await ethers.getContractFactory("EntryPoint")
        entryPoint = await EntryPoint.deploy()
        // entryPoint = EntryPoint.attach(process.env.ENTRYPOINT_SEPOLIA)
        SparkyAccountFactory = await ethers.getContractFactory("SparkyAccountFactory");
        sparkyAccountFactory = await SparkyAccountFactory.deploy(entryPoint.address)
        await sparkyAccountFactory.deployed()

        SparkyAccount = await ethers.getContractFactory("SparkyAccount")
        sparkyAccount = await SparkyAccount.deploy(entryPoint.address)



        EntryPointSimulations = await ethers.getContractFactory("EntryPointSimulations")
        entryPointSimulations = EntryPointSimulations.attach(entryPoint.address)


        iWETH9 = await ethers.getContractAt("IWETH9", WETH);

        await sparkyAccount.deployed()

        oneEther = ethers.utils.parseEther("0.1")

        // set paymaste
        SparkyPaymaster = await ethers.getContractFactory("SparkyPaymaster")
        sparkyPaymaster = await SparkyPaymaster.deploy(entryPoint.address)


        await sparkyPaymaster.deposit({ value: oneEther })

    })
    it("should manually create account successfully", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 1)
        let account = SparkyAccount.attach(addr)
        let tx = await sparkyAccountFactory.createAccount(signer.address, 1)

        await expect(tx)
            .to.emit(account, 'SparkyAccountInitialized').withArgs(
                entryPoint.address,
                signer.address
            );
        // let receipt = await tx.wait()
        // console.log(receipt)
        // expect(addr).to.equal("0x0000")
    })
    it("should manually deposit and withdrawl erc20 successfully", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 1)
        let account = SparkyAccount.attach(addr)

        await iWETH9.connect(signer).deposit({ value: oneEther })
        await iWETH9.connect(signer).transfer(addr, oneEther)

        expect(await iWETH9.balanceOf(addr)).to.equal(oneEther)
        let tx = await sparkyAccountFactory.createAccount(signer.address, 1)

        await expect(tx)
            .to.emit(account, 'SparkyAccountInitialized').withArgs(
                entryPoint.address,
                signer.address
            );

        let abi = ["function transfer(address to, uint amount)"];
        let iface = new ethers.utils.Interface(abi);
        let calldata = iface.encodeFunctionData("transfer", [signer.address, oneEther])

        expect(await iWETH9.balanceOf(signer.address)).to.equal(0)
        await account.connect(signer).execute(iWETH9.address, 0, calldata)
        expect(await iWETH9.balanceOf(signer.address)).to.equal(oneEther)


    })

    it("should create account with EntryPoint & withdraw ERC20", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)

        // transfer 0.1 weth to addr
        // console.log(await iWETH9.balanceOf(signer.address))
        await iWETH9.connect(signer).deposit({ value: oneEther })
        await iWETH9.connect(signer).transfer(addr, oneEther)
        expect(await iWETH9.balanceOf(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        let abi = ["function transfer(address to, uint amount)", "function execute(address dest, uint value, bytes func)"];
        let iface = new ethers.utils.Interface(abi);
        let func = iface.encodeFunctionData("transfer", [signer.address, oneEther])
        let calldata = iface.encodeFunctionData("execute", [WETH, 0, func])


        let userOperation = createUserOperation(
            addr,
            0,
            initCode,
            calldata,
            300000,
            300000,
            100000,
            10000000000,
            5000000000,
            sparkyPaymaster.address,
            "0x"
        )

        // await helpers.setCode(entryPoint.address, process.env.SIMULATION_BYTECODE);
        // await entryPointSimulations.simulateValidation(userOperation)
        // console.log(await entryPoint.getUserOpHash(userOperation))
        beforeBalance = await iWETH9.balanceOf(signer.address)
        let tx = await entryPoint.handleOps([userOperation], signer.address)
        await expect(tx)
            .to.emit(account, 'SparkyAccountInitialized').withArgs(
                entryPoint.address,
                signer.address
            )
            .to.emit(iWETH9, 'Transfer').withArgs(
                account.address,
                signer.address,
                oneEther
            );
        afterBalance = await iWETH9.balanceOf(signer.address)
        expect(afterBalance.sub(beforeBalance)).to.equal(oneEther)

    })

    it("should withdraw ERC20 with deployed account", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)

        // transfer 0.1 weth to addr
        // console.log(await iWETH9.balanceOf(signer.address))
        await iWETH9.connect(signer).deposit({ value: oneEther })
        await iWETH9.connect(signer).transfer(addr, oneEther)
        expect(await iWETH9.balanceOf(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        let abi = ["function transfer(address to, uint amount)", "function execute(address dest, uint value, bytes func)"];
        let iface = new ethers.utils.Interface(abi);
        let func = iface.encodeFunctionData("transfer", [signer.address, oneEther])
        let calldata = iface.encodeFunctionData("execute", [WETH, 0, func])


        {
            let nonce = await entryPoint.getNonce(addr, 0)
            let userOperation = createUserOperation(
                addr,
                nonce,
                initCode,
                "0x",
                300000,
                300000,
                100000,
                10000000000,
                5000000000,
                sparkyPaymaster.address,
                "0x"
            )

            // await helpers.setCode(entryPoint.address, process.env.SIMULATION_BYTECODE);
            // await entryPointSimulations.simulateValidation(userOperation)
            // console.log(await entryPoint.getUserOpHash(userOperation))
            beforeBalance = await iWETH9.balanceOf(signer.address)
            let tx = await entryPoint.handleOps([userOperation], signer.address)
            await expect(tx)
                .to.emit(account, 'SparkyAccountInitialized').withArgs(
                    entryPoint.address,
                    signer.address
                )
        }
        {
            let nonce = await entryPoint.getNonce(addr, 0)
            let userOperation = createUserOperation(
                addr,
                nonce,
                "0x",
                calldata,
                300000,
                300000,
                100000,
                10000000000,
                5000000000,
                sparkyPaymaster.address,
                "0x"
            )

            // await helpers.setCode(entryPoint.address, process.env.SIMULATION_BYTECODE);
            // await entryPointSimulations.simulateValidation(userOperation)
            // console.log(await entryPoint.getUserOpHash(userOperation))
            beforeBalance = await iWETH9.balanceOf(signer.address)
            let tx = await entryPoint.handleOps([userOperation], signer.address)
            await expect(tx)
                .to.emit(iWETH9, 'Transfer').withArgs(
                    account.address,
                    signer.address,
                    oneEther
                );
            afterBalance = await iWETH9.balanceOf(signer.address)
            expect(afterBalance.sub(beforeBalance)).to.equal(oneEther)
        }




    })




})
