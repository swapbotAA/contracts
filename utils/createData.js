const { ethers } = require("hardhat");

function createUserOperation(
    sender,
    nonce,
    initCode,
    callData,
    callGasLimit,
    verificationGasLimit,
    preVerificationGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    paymasterAndData,
    signature,

) {
    UserOperation = {
        sender,
        nonce,
        initCode,
        callData,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymasterAndData,
        signature,
    }

    return UserOperation
}

function createInitCode(
    factory,
    sender,
    nonce
) {

    let abi = ["function createAccount(address owner,uint salt)"];
    let iface = new ethers.utils.Interface(abi);
    let calldata = iface.encodeFunctionData("createAccount", [sender, nonce])
    let res = factory + calldata.slice(2)
    return res

}

function createCallData(
    funcName,
    funcParams
) {
    let abi = ["function transfer(address to, uint amount)", "function execute(address dest, uint value, bytes func)"];
    let iface = new ethers.utils.Interface(abi);
    return iface.encodeFunctionData(funcName, funcParams)
}

module.exports = { createUserOperation, createInitCode, createCallData }
