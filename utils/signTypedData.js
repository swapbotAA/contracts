const { ethers } = require("hardhat");

class UserOperationWithoutSig {
    constructor(sender, nonce, initCode, callData, callGasLimit, verificationGasLimit, preVerificationGas, maxFeePerGas, maxPriorityFeePerGas, paymasterAndData) {
        this.sender = sender,
            this.nonce = nonce,
            this.initCode = initCode,
            this.callData = callData,
            this.callGasLimit = callGasLimit,
            this.verificationGasLimit = verificationGasLimit,
            this.preVerificationGas = preVerificationGas,
            this.maxFeePerGas = maxFeePerGas,
            this.maxPriorityFeePerGas = maxPriorityFeePerGas,
            this.paymasterAndData = paymasterAndData
    }
    addSig(signature) {
        let UserOperation = {
            sender: this.sender,
            nonce: this.nonce,
            initCode: this.initCode,
            callData: this.callData,
            callGasLimit: this.callGasLimit,
            verificationGasLimit: this.verificationGasLimit,
            preVerificationGas: this.preVerificationGas,
            maxFeePerGas: this.maxFeePerGas,
            maxPriorityFeePerGas: this.maxPriorityFeePerGas,
            paymasterAndData: this.paymasterAndData,
            signature,
        }

        return UserOperation
    }
}



async function createTypedDataAndSign(UserOperationWithoutSig, chainId, signer) {
    const domain = {
        name: 'SparkyAccount',
        version: '1',
        chainId: chainId,
        verifyingContract: UserOperationWithoutSig.sender
    };
    const types = {
        UserOperationWithoutSig: [
            { name: 'sender', type: 'address' },
            { name: 'nonce', type: 'uint256' },
            { name: 'initCode', type: 'bytes' },
            { name: 'callData', type: 'bytes' },
            { name: 'callGasLimit', type: 'uint256' },
            { name: 'verificationGasLimit', type: 'uint256' },
            { name: 'preVerificationGas', type: 'uint256' },
            { name: 'maxFeePerGas', type: 'uint256' },
            { name: 'maxPriorityFeePerGas', type: 'uint256' },
            { name: 'paymasterAndData', type: 'bytes' },
        ],
    };
    // let typedDataEncoder = new ethers.utils._TypedDataEncoder.from(types) 
    // console.log(typedDataEncoder)
    // console.log(typedDataEncoder.hashDomain(domain))
    // console.log(ethers.utils._TypedDataEncoder.hash(domain, types, { ...UserOperationWithoutSig }))
    // console.log(ethers.utils._TypedDataEncoder.encode(domain, types, { ...UserOperationWithoutSig }))
    // console.log(ethers.utils._TypedDataEncoder.hashDomain(domain))

    // console.log(signer)

    signature = await signer._signTypedData(domain, types, { ...UserOperationWithoutSig })
    return signature
}



module.exports = { createTypedDataAndSign, UserOperationWithoutSig }