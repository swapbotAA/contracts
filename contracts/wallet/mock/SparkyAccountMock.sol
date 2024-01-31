// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "../SparkyAccount.sol";


contract SparkyAccountMock is SparkyAccount {
    using ECDSA for bytes32;

    constructor(IEntryPoint anEntryPoint, address router) SparkyAccount(anEntryPoint, router){

    }

     /// implement template method of BaseAccount
    function verifySig(
        UserOperation calldata userOp, address validateAddress, uint256 chainId
    ) public view returns (address) {
        bytes32 nameHash = keccak256(
            "UserOperationWithoutSig(address sender,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData)"
        );

        bytes32 typedHash = keccak256(
            abi.encodePacked(nameHash, IUserOperation.pack(userOp))
        );

        bytes32 domainSeparator = _getSeparator(validateAddress,chainId);

        bytes32 hash = ECDSA.toTypedDataHash(domainSeparator, typedHash);
        address recover = hash.recover(userOp.signature);
        return recover;
    }

        function _getSeparator(address validateAddress, uint256 chainId)
        internal
        pure
        returns (bytes32 domainSeparator)
    {
        domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("SparkyAccount")),
                keccak256(bytes("1")),
                chainId,
                address(validateAddress)
            )
        );
    }
}
