//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Wallet.sol";
import "./interface/ISwapRouter.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniswapRouter {
    address swapRouter = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address payable wallet;

    constructor(address payable walletAddress) {
        wallet = walletAddress;
    }

    function exactInputSingle(
        ISwapRouter.ExactInputSingleParams memory params,
        address user,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        bytes32 encodedData = keccak256(encodeExactInputSingleParams(params));
        require(
            ECDSA.recover(encodedData, v, r, s) == user,
            "UniswapRouter: invalid signature"
        );

        Wallet(wallet).withdrawERC20(user, params.tokenIn, params.amountIn);
        SafeERC20.safeApprove(
            IERC20(params.tokenIn),
            swapRouter,
            params.amountIn
        );
        uint256 amountOut = ISwapRouter(swapRouter).exactInputSingle(params);
        SafeERC20.safeApprove(IERC20(params.tokenOut), wallet, amountOut);
        Wallet(wallet).depositERC20(user, params.tokenOut, amountOut);
    }

    function encodeExactInputSingleParams(
        ISwapRouter.ExactInputSingleParams memory params
    ) public pure returns (bytes memory) {
        bytes memory res = abi.encode(params);
        return res;
    }
}
