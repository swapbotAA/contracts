//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniversalRouter {
    //SPDX-License-Identifier: MIT
    function execute(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external;
}
