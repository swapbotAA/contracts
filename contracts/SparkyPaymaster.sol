// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */

import "./@eth-infinitism-v0.4/core/BasePaymaster.sol";

contract SparkyPaymaster is BasePaymaster {

    mapping(address=>bool) private _isAuthorized;
    constructor(IEntryPoint _entryPoint, address authorizedBundler) BasePaymaster(_entryPoint) {
        _isAuthorized[authorizedBundler] = true;
    }

    /**
     * Validate a user operation.
     * @param userOp     - The user operation.
     * @param userOpHash - The hash of the user operation.
     * @param maxCost    - The maximum cost of the user operation.
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    )
        internal
        virtual
        override
        returns (bytes memory context, uint256 validationData)
    {
        context = "";
        if(_isAuthorized[tx.origin]){
            validationData = 0;
        } else {
            validationData = 1;

        }
    }

    function authorize(address bundler, bool isAllowed) onlyOwner external {
        _isAuthorized[bundler] = isAllowed;
    }

    
}
