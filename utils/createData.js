const { ethers } = require("hardhat");


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
    let abi = [
        "function transfer(address to, uint amount)",
        "function approve(address spender, uint amount)",
        "function execute(address dest, uint value, bytes func)",
        "function executeBatch(address[] dest, uint[] value, bytes[] func)",
        "function exactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,address recipient,uint amountIn,uint amountOutMinimum,uint160 sqrtPriceLimitX96) params)"
    ];
    let iface = new ethers.utils.Interface(abi);
    return iface.encodeFunctionData(funcName, funcParams)
}

module.exports = { createInitCode, createCallData }
