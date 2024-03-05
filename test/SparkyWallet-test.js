const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createInitCode, createCallData } = require("../utils/createData")
const { createTypedDataAndSign, UserOperationWithoutSig } = require("../utils/signTypedData")

require('dotenv').config()
const helpers = require("@nomicfoundation/hardhat-network-helpers");

UNI = process.env.UNI
WETH = process.env.WBNB
ETH = process.env.WBNB
// ROUTER = process.env.SWAPROUTER02_SEPOLIA
ROUTER = process.env.SWAPROUTER02
CHAINID = process.env.HARDHAT_CHAINID

CallGasLimit = 300000
VerificationGasLimit = 350000
PreVerificationGas = 100000
MaxFeePerGas = 10000000000;
MaxPriorityFeePerGas = 5000000000


describe("Sparky-Wallet", function () {

    beforeEach("deploying Wallet", async function () {
        provider = ethers.provider
        signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
        // user = await ethers.getImpersonatedSigner("0x4431642f3c12dc155d4f7829a5d8d39aed754dab")

        bundler = await ethers.getImpersonatedSigner("0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5")
        await network.provider.send("hardhat_setBalance", [bundler.address, "0xffffffffffffffffffffffff"])
        await network.provider.send("hardhat_setBalance", [signer.address, "0xffffffffffffffffffffffff"])


        EntryPoint = await ethers.getContractFactory("EntryPoint")
        entryPoint = await EntryPoint.deploy()
        // entryPoint = EntryPoint.attach(process.env.ENTRYPOINT)

        SparkyAccountFactory = await ethers.getContractFactory("SparkyAccountFactory");
        sparkyAccountFactory = await SparkyAccountFactory.deploy(entryPoint.address, ROUTER)
        await sparkyAccountFactory.deployed()

        SparkyAccount = await ethers.getContractFactory("SparkyAccount")
        // sparkyAccount = await SparkyAccount.deploy(entryPoint.address, ROUTER)



        // EntryPointSimulations = await ethers.getContractFactory("EntryPointSimulations")
        // entryPointSimulations = EntryPointSimulations.attach(entryPoint.address)


        iWETH9 = await ethers.getContractAt("IWETH9", WETH);
        Uni = await ethers.getContractAt("IERC20", UNI)

        // await sparkyAccount.deployed()

        oneEther = ethers.utils.parseEther("0.1")

        // set paymaste
        SparkyPaymaster = await ethers.getContractFactory("SparkyPaymaster")
        sparkyPaymaster = await SparkyPaymaster.deploy(entryPoint.address, bundler.address)


        await sparkyPaymaster.deposit({ value: oneEther })

        SparkyAccountMock = await ethers.getContractFactory("SparkyAccountMock")
        sparkyAccountMock = await SparkyAccountMock.deploy(entryPoint.address, ROUTER)

    })
    it("should manually create account successfully", async function () {
        let addr = await sparkyAccountFactory.findAddress(signer.address, 1)
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
        let addr = await sparkyAccountFactory.findAddress(signer.address, 1)
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
        let addr = await sparkyAccountFactory.findAddress(signer.address, 0)
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
            // 0,
            initCode,
            calldata,
            CallGasLimit,
            VerificationGasLimit,
            PreVerificationGas,
            MaxFeePerGas,
            MaxPriorityFeePerGas,
            sparkyPaymaster.address,
        )
        let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
        let userOperation = userOperationWithoutSig.addSig(sig)
        userOperation.nonce = 0
        beforeBalance = await iWETH9.balanceOf(signer.address)
        let tx = await entryPoint.connect(bundler).handleOps([userOperation], signer.address)
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
        expect(await sparkyAccountMock.verifySig(userOperation, addr, CHAINID)).to.equal(signer.address)


    })

    it("should withdraw ERC20 with deployed account", async function () {
        let addr = await sparkyAccountFactory.findAddress(signer.address, 0)
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
                // 0,
                initCode,
                "0x",
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address
            )

            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            let userOperation = userOperationWithoutSig.addSig(sig)
            userOperation.nonce = 0
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
            let tx = await entryPoint.connect(bundler).handleOps([userOperation], signer.address)
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
                // nonce,
                "0x",
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            let userOperation = userOperationWithoutSig.addSig(sig)
            userOperation.nonce = nonce
            // await helpers.setCode(entryPoint.address, process.env.SIMULATION_BYTECODE);
            // await entryPointSimulations.simulateValidation(userOperation)
            // console.log(await entryPoint.getUserOpHash(userOperation))
            beforeBalance = await iWETH9.balanceOf(signer.address)
            let tx = await entryPoint.connect(bundler).handleOps([userOperation], signer.address)
            await expect(tx)
                .to.emit(iWETH9, 'Transfer').withArgs(
                    account.address,
                    signer.address,
                    oneEther
                );
            afterBalance = await iWETH9.balanceOf(signer.address)
            expect(afterBalance.sub(beforeBalance)).to.equal(oneEther)

            // handleOp called by unauthorized bundler should revert
            try {
                userOperation.nonce = await entryPoint.getNonce(addr, 0)
                await entryPoint.connect(signer).handleOps([userOperation], signer.address)
                throw null
            } catch (err) {
                console.log(err.message)
                expect(err.message).to.include("VM Exception");
            }
        }
    
    })


    it("should create account with EntryPoint & approve & swap ERC20", async function () {
        let addr = await sparkyAccountFactory.findAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)
        // transfer 0.1 weth to addr
        await iWETH9.connect(bundler).deposit({ value: oneEther })
        await iWETH9.connect(bundler).transfer(addr, oneEther)
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
                // 0,
                initCode,
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address,
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation_1 = userOperationWithoutSig.addSig(sig)
            userOperation_1.nonce = 0

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
                // 1,
                "0x",
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address,
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation_2 = userOperationWithoutSig.addSig(sig)
            userOperation_2.nonce = 1

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


        // await helpers.setCode(entryPoint.address, process.env.SIMULATION_BYTECODE);
        // console.log(await entryPointSimulations.callStatic.simulateValidation(userOperation_1))
        // hre.tracer.enabled = true;
        // let res = await entryPointSimulations.connect(bundler).callStatic.simulateHandleOp(userOperation_1, "0x0000000000000000000000000000000000000000", "0x")

        // expect(res.targetSuccess).to.equal(true)

        beforeBalance = await Uni.balanceOf(addr)
        // console.log("WETH: ", await iWETH9.balanceOf(addr))
        await entryPoint.connect(bundler).handleOps([userOperation_1, userOperation_2], bundler.address)
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
        let addr = await sparkyAccountFactory.findAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)
        // transfer 0.1 weth to addr
        await iWETH9.connect(bundler).deposit({ value: oneEther })
        await iWETH9.connect(bundler).transfer(addr, oneEther)
        expect(await iWETH9.balanceOf(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        // create account & approve weth
        let userOperation
        {
            let func_approve = createCallData("approve", [ROUTER, oneEther])
            let params = {
                tokenIn: ETH,
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
                // 0,
                initCode,
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address,
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation = userOperationWithoutSig.addSig(sig)
            userOperation.nonce = 0

        }

        beforeBalance = await Uni.balanceOf(addr)
        // console.log(beforeBalance)
        // console.log("WETH: ", await iWETH9.balanceOf(addr))
        let tx = await entryPoint.connect(bundler).handleOps([userOperation], bundler.address)
        afterBalance = await Uni.balanceOf(addr)
        await expect(tx)
            .to.emit(Uni, 'Transfer')
            .to.emit(iWETH9, 'Transfer')
        expect(afterBalance.sub(beforeBalance)).to.not.equal(0)
    })
    it("should create account with EntryPoint & swap ETH", async function () {
        let addr = await sparkyAccountFactory.findAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)
        // transfer 0.1 eth to addr
        await bundler.sendTransaction({
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
                // 0,
                initCode,
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address,
            )
            let sig = await createTypedDataAndSign(userOperationWithoutSig, CHAINID, signer)
            userOperation = userOperationWithoutSig.addSig(sig)
            userOperation.nonce = 0

        }

        beforeBalance = await Uni.balanceOf(addr)
        // console.log(beforeBalance)
        // console.log("WETH: ", await iWETH9.balanceOf(addr))
        let tx = await entryPoint.connect(bundler).handleOps([userOperation], bundler.address)
        afterBalance = await Uni.balanceOf(addr)
        await expect(tx)
            .to.emit(Uni, 'Transfer')
            .to.emit(iWETH9, 'Transfer')
        expect(afterBalance.sub(beforeBalance)).to.not.equal(0)
    })
    it("should create account with EntryPoint & delegate & swap ETH", async function () {
        let addr = await sparkyAccountFactory.findAddress(signer.address, 0)
        let account = SparkyAccount.attach(addr)
        // transfer 0.1 eth to addr
        await bundler.sendTransaction({
            to: addr,
            value: oneEther
        });

        expect(await provider.getBalance(addr)).to.equal(oneEther)
        // create initCode
        let initCode = createInitCode(sparkyAccountFactory.address, signer.address, 0)
        // create user operation
        let userOperation_delegate
        {
            let delegatee = bundler.address;
            let bool = true;
            // let func = createCallData("delegate", [delegatee, bool])
            // let calldata = createCallData("execute", [addr, 0, func])
            let calldata = createCallData("delegate", [delegatee, bool])
            let userOperationWithoutSig_delegate = new UserOperationWithoutSig(
                addr,
                // 0,
                initCode,
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address,
            )
            let sig_delegate = await createTypedDataAndSign(userOperationWithoutSig_delegate, CHAINID, signer)
            userOperation_delegate = userOperationWithoutSig_delegate.addSig(sig_delegate)
            userOperation_delegate.nonce = 0

        }
        await entryPoint.connect(bundler).handleOps([userOperation_delegate], bundler.address)
        expect(await account.isDelegated(bundler.address)).to.equal(true)


        let userOperation_swap
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

            let userOperationWithoutSig_swap = new UserOperationWithoutSig(
                addr,
                // 0,
                "0x",
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address,
            )
            // no longer need a sig, input a default value
            let sig = "0xb4f36dabf4aa03898f3519278b19e8ddacb551271b769020916085079f3acdeb650e81b81a5f1a5a8eceb0a33c0af52465011509ddaefbb79e041612d2cc04d51b"
            userOperation_swap = userOperationWithoutSig_swap.addSig(sig)
            userOperation_swap.nonce = 1
        }

        beforeBalance = await Uni.balanceOf(addr)
        // console.log(beforeBalance)
        // console.log("WETH: ", await iWETH9.balanceOf(addr))

        let tx = await entryPoint.connect(bundler).handleOps([userOperation_swap], bundler.address)
        // let tx = await entryPoint.connect(bundler).handleOps([userOperation_delegate, userOperation_swap], bundler.address)

        afterBalance = await Uni.balanceOf(addr)
        await expect(tx)
            .to.emit(Uni, 'Transfer')
            .to.emit(iWETH9, 'Transfer')
        expect(afterBalance.sub(beforeBalance)).to.not.equal(0)


        try {
            let func_approve = createCallData("approve", [ROUTER, oneEther])
            let calldata = createCallData("execute", [WETH, 0, func_approve])
            let userOperationWithoutSig = new UserOperationWithoutSig(
                addr,
                // 0,
                '0x',
                calldata,
                CallGasLimit,
                VerificationGasLimit,
                PreVerificationGas,
                MaxFeePerGas,
                MaxPriorityFeePerGas,
                sparkyPaymaster.address,
            )
            let sig = "0xb4f36dabf4aa03898f3519278b19e8ddacb551271b769020916085079f3acdeb650e81b81a5f1a5a8eceb0a33c0af52465011509ddaefbb79e041612d2cc04d51b"
            userOperation = userOperationWithoutSig.addSig(sig)
            userOperation.nonce = 2
            await entryPoint.connect(bundler).handleOps([userOperation], bundler.address)
            throw null
        } catch (err) {
            console.log(err.message)
            expect(err.message).to.include("custom error")
        }
    })
    it("temp test", async function () {


        userOp = {
            "sender": "0x4A3fB5CFBdDffecce8f7956F1ca55c7d0aa323cE",
            "nonce": 0,
            "callData": "0xb61d27f60000000000000000000000003bfa4769fb09eefc5a80d6e87c3b9c650f7ae48e000000000000000000000000000000000000000000000000000009184e72a000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e404e45aaf000000000000000000000000bb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c00000000000000000000000055d398326f99059ff775485246999027b31979550000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000004a3fb5cfbddffecce8f7956f1ca55c7d0aa323ce000000000000000000000000000000000000000000000000000009184e72a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "callGasLimit": "300000",
            "initCode": "0x128cc7ce4a50905a58c01bc3b4dbce816722496f5fbfb9cf000000000000000000000000c3d1e2c5a81687d73ae861dfddb4baacec22d4950000000000000000000000000000000000000000000000000000000000000001",
            "maxFeePerGas": "3600000000",
            "maxPriorityFeePerGas": "3000000000",
            "paymasterAndData": "0xbbf04ef94e5bd84c24ad4b7d9707a9867acd642b",
            "preVerificationGas": "100000",
            "signature": "0xd0f681cbd0582e6d9c0481869730f30eaeaf421573f74a9a5e2e0394f074326e34e216fc97052dbc0426bab95b88ea75af35133ac901e38ceeb13e9bb3f30eae1b",
            "verificationGasLimit": "300000"
        }

        let address = await sparkyAccountMock.verifySig(userOp, "0x4A3fB5CFBdDffecce8f7956F1ca55c7d0aa323cE", 56)
        console.log(address)
    })
})
