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
module.exports = { createUserOperation, createInitCode }
