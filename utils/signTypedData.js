const { ethers } = require("hardhat");


async function createTypedDataAndSign(tokenIn, tokenOut, fee, routerAddress, amountIn, amountOutMinimum, signer, chainId, salt) {
    const domain = {
        name: 'UniswapRouter',
        version: '1',
        chainId: chainId,
        verifyingContract: routerAddress
    };
    const types = {
        ExactInputSingleParams: [
            { name: 'tokenIn', type: 'address' },
            { name: 'tokenOut', type: 'address' },
            { name: 'fee', type: 'uint24' },
            { name: 'recipient', type: 'address' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMinimum', type: 'uint256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' },
            { name: 'salt', type: 'bytes32' }
        ],
    };
    let value = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: fee,
        recipient: routerAddress,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0,
        salt: salt
    }

    signature = await signer._signTypedData(domain, types, value);
    let r = "0x" + signature.slice(2, 66)
    let s = "0x" + signature.slice(66, 130)
    let v = "0x" + signature.slice(130, 132)
    let res = {
        value: value,
        r: r,
        s: s,
        v: v
    }
    return res
}



module.exports = { createTypedDataAndSign }