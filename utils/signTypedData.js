const { ethers } = require("hardhat");
ZEROADDRESS = "0x0000000000000000000000000000000000000000"
WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
MAX = "5792089237316195423570985008687907853269984665640564039457584007913129639935"
// All properties on a domain are optional


async function createTypedDataAndSign(tokenIn, tokenOut, fee, routerAddress,deadline, amountIn, signer, chainId) {
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
            { name: 'deadline', type: 'uint256' },
            { name: 'amountIn', type: 'uint256' },
            { name: 'amountOutMinimum', type: 'uint256' },
            { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
    };
    let value = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: fee,
        recipient: routerAddress,
        deadline: deadline,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
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