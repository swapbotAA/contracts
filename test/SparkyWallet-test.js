const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createInitCode, createCallData } = require("../utils/createData")
const { createTypedDataAndSign, UserOperationWithoutSig } = require("../utils/signTypedData")

require('dotenv').config()
const helpers = require("@nomicfoundation/hardhat-network-helpers");

UNI = process.env.UNI_SEPOLIA
WETH = process.env.WETH_SEPOLIA
ROUTER = process.env.SWAPROUTER02_SEPOLIA
CHAINID = process.env.HARDHAT_CHAINID
describe("Sparky-Wallet", function () {

    beforeEach("deploying Wallet", async function () {
        provider = ethers.provider
        signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
        // user = await ethers.getImpersonatedSigner("0x4431642f3c12dc155d4f7829a5d8d39aed754dab")
        dev = await ethers.getImpersonatedSigner("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5")
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
        Uni = await ethers.getContractAt("IERC20", UNI)

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
        await iWETH9.connect(signer).deposit({ value: oneEther })
        await iWETH9.connect(signer).transfer(addr, oneEther)
        expect(await iWETH9.balanceOf(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        let func = createCallData("transfer", [signer.address, oneEther])
        let calldata = createCallData("execute", [WETH, 0, func])
        // create account & transfer erc20
        let userOperationWithoutSig = new UserOperationWithoutSig(
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
        )
        let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
        let userOperation = userOperationWithoutSig.addSig(sig)

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

        // let func = iface.encodeFunctionData("transfer", [signer.address, oneEther])
        // let calldata = iface.encodeFunctionData("execute", [WETH, 0, func])
        let func = createCallData("transfer", [signer.address, oneEther])
        let calldata = createCallData("execute", [WETH, 0, func])
        // create account and do nothing
        {
            let nonce = await entryPoint.getNonce(addr, 0)
            let userOperationWithoutSig = new UserOperationWithoutSig(
                addr,
                0,
                initCode,
                "0x",
                300000,
                400000,
                300000,
                10000000000,
                5000000000,
                sparkyPaymaster.address
            )

            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            let userOperation = userOperationWithoutSig.addSig(sig)

            // let userOperation = createUserOperation(
            //     addr,
            //     nonce.toString(),
            //     initCode,
            //     "0x",
            //     300000,
            //     400000,
            //     300000,
            //     10000000000,
            //     5000000000,
            //     sparkyPaymaster.address,
            //     sig
            // )
            // console.log(userOperation)

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
        // transfer erc20
        {
            let nonce = await entryPoint.getNonce(addr, 0)
            let userOperationWithoutSig = new UserOperationWithoutSig(
                addr,
                nonce,
                "0x",
                calldata,
                300000,
                300000,
                100000,
                10000000000,
                5000000000,
                sparkyPaymaster.address
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            // let userOperation = createUserOperation(
            //     addr,
            //     nonce,
            //     "0x",
            //     calldata,
            //     300000,
            //     300000,
            //     100000,
            //     10000000000,
            //     5000000000,
            //     sparkyPaymaster.address,
            //     sig
            // )
            let userOperation = userOperationWithoutSig.addSig(sig)

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


    it("should create account with EntryPoint & approve & swap ERC20", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)
        // transfer 0.1 weth to addr
        await iWETH9.connect(dev).deposit({ value: oneEther })
        await iWETH9.connect(dev).transfer(addr, oneEther)
        expect(await iWETH9.balanceOf(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        // create account & approve weth
        let userOperation_1
        {

            let func = createCallData("approve", [ROUTER, oneEther])
            let calldata = createCallData("execute", [WETH, 0, func])
            let userOperationWithoutSig = new UserOperationWithoutSig(
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
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation_1 = userOperationWithoutSig.addSig(sig)

            // userOperation_1 = createUserOperation(
            //     addr,
            //     0,
            //     initCode,
            //     calldata,
            //     300000,
            //     300000,
            //     100000,
            //     10000000000,
            //     5000000000,
            //     sparkyPaymaster.address,
            //     sig
            // )
        }
        // console.log(userOperation_1)
        // swap weth
        let userOperation_2
        {
            let params = {
                tokenIn: WETH,
                tokenOut: UNI,
                fee: 3000,
                recipient: addr,
                amountIn: oneEther,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            }
            let func = createCallData("exactInputSingle", [params])
            let calldata = createCallData("execute", [ROUTER, 0, func])
            // create account & transfer erc20
            let userOperationWithoutSig = new UserOperationWithoutSig(
                addr,
                1,
                "0x",
                calldata,
                300000,
                300000,
                100000,
                10000000000,
                5000000000,
                sparkyPaymaster.address,
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation_2 = userOperationWithoutSig.addSig(sig)

            // userOperation_2 = createUserOperation(
            //     addr,
            //     1,
            //     "0x",
            //     calldata,
            //     300000,
            //     300000,
            //     100000,
            //     10000000000,
            //     5000000000,
            //     sparkyPaymaster.address,
            //     sig
            // )
        }


        await helpers.setCode(entryPoint.address, process.env.SIMULATION_BYTECODE);
        // console.log(await entryPointSimulations.callStatic.simulateValidation(userOperation_1))
        // hre.tracer.enabled = true;
        let res = await entryPointSimulations.connect(dev).callStatic.simulateHandleOp(userOperation_1, "0x0000000000000000000000000000000000000000", "0x")

        console.log(res)
        // expect(res.targetSuccess).to.equal(true)

        beforeBalance = await Uni.balanceOf(addr)
        // console.log("WETH: ", await iWETH9.balanceOf(addr))
        await entryPoint.connect(dev).handleOps([userOperation_1, userOperation_2], dev.address)
        afterBalance = await Uni.balanceOf(addr)
        expect(afterBalance.sub(beforeBalance)).to.not.equal(0)

        // hre.tracer.enabled = false;

        // await expect(tx)
        //     .to.emit(account, 'SparkyAccountInitialized').withArgs(
        //         entryPoint.address,
        //         signer.address
        //     )
        //     .to.emit(iWETH9, 'Transfer').withArgs(
        //         account.address,
        //         signer.address,
        //         oneEther
        //     );
        // console.log("WETH: ", await iWETH9.balanceOf(addr))

        // console.log("UNI: ", afterBalance.sub(beforeBalance))
    })
    it("should create account with EntryPoint & approve & swap ERC20 use batch execute", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)
        // transfer 0.1 weth to addr
        await iWETH9.connect(dev).deposit({ value: oneEther })
        await iWETH9.connect(dev).transfer(addr, oneEther)
        expect(await iWETH9.balanceOf(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        // create account & approve weth
        let userOperation
        {
            let func_approve = createCallData("approve", [ROUTER, oneEther])
            let params = {
                tokenIn: WETH,
                tokenOut: UNI,
                fee: 3000,
                recipient: addr,
                amountIn: oneEther,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            }
            let func_swap = createCallData("exactInputSingle", [params])
            // let calldata = createCallData("executeBatch", [[WETH, 0, func_approve],[ROUTER, 0 ,func_swap]])
            let calldata = createCallData("executeBatch", [[WETH, ROUTER], [0, 0], [func_approve, func_swap]])

            let userOperationWithoutSig = new UserOperationWithoutSig(
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
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation = userOperationWithoutSig.addSig(sig)
            // userOperation = createUserOperation(
            //     addr,
            //     0,
            //     initCode,
            //     calldata,
            //     300000,
            //     300000,
            //     100000,
            //     10000000000,
            //     5000000000,
            //     sparkyPaymaster.address,
            //     sig
            // )
        }

        beforeBalance = await Uni.balanceOf(addr)
        // console.log(beforeBalance)
        // console.log("WETH: ", await iWETH9.balanceOf(addr))
        let tx = await entryPoint.connect(dev).handleOps([userOperation], dev.address)
        afterBalance = await Uni.balanceOf(addr)
        await expect(tx)
            .to.emit(Uni, 'Transfer')
            .to.emit(iWETH9, 'Transfer')
        expect(afterBalance.sub(beforeBalance)).to.not.equal(0)
    })
    it("should create account with EntryPoint & swap ETH", async function () {
        let addr = await sparkyAccountFactory.getAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)
        // transfer 0.1 eth to addr
        await dev.sendTransaction({
            to: addr,
            value: oneEther
        });


        expect(await provider.getBalance(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        // create account & approve weth
        let userOperation
        {
            let params = {
                tokenIn: WETH,
                tokenOut: UNI,
                fee: 3000,
                recipient: addr,
                amountIn: oneEther,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            }
            let func_swap = createCallData("exactInputSingle", [params])
            let calldata = createCallData("execute", [ROUTER, oneEther, func_swap])

            let userOperationWithoutSig = new UserOperationWithoutSig(
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
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation = userOperationWithoutSig.addSig(sig)
            // userOperation = createUserOperation(
            //     addr,
            //     0,
            //     initCode,
            //     calldata,
            //     300000,
            //     300000,
            //     100000,
            //     10000000000,
            //     5000000000,
            //     sparkyPaymaster.address,
            //     sig
            // )
        }

        beforeBalance = await Uni.balanceOf(addr)
        // console.log(beforeBalance)
        // console.log("WETH: ", await iWETH9.balanceOf(addr))
        let tx = await entryPoint.connect(dev).handleOps([userOperation], dev.address)
        afterBalance = await Uni.balanceOf(addr)
        await expect(tx)
            .to.emit(Uni, 'Transfer')
            .to.emit(iWETH9, 'Transfer')
        expect(afterBalance.sub(beforeBalance)).to.not.equal(0)
    })
})
