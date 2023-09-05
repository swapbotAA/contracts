//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Wallet.sol";
// import "./interface/ISwapRouter.sol";
import "./interface/IV3SwapRouter.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
contract UniswapRouter {
    // solhint-disable-next-line
    bytes32 public DOMAIN_SEPARATOR;

    string public name = "UniswapRouter";
    address swapRouter;
    address payable wallet;

    constructor(address payable walletAddress, address _swapRouter) {
        wallet = walletAddress;
        swapRouter = _swapRouter;
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    function exactInputSingle(
        IV3SwapRouter.ExactInputSingleParams memory params,
        bytes32 salt,
        address user,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
         // compute digest according to eip712
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(encodeExactInputSingleParams(params,salt))
            )
        );
        require(
            ECDSA.recover(digest, v, r, s) == user,
            "UniswapRouter: invalid signature"
        );
    

        Wallet(wallet).withdrawERC20(user, params.tokenIn, params.amountIn);
        SafeERC20.safeApprove(
            IERC20(params.tokenIn),
            swapRouter,
            params.amountIn
        );
        uint256 amountOut = IV3SwapRouter(swapRouter).exactInputSingle(params);

        SafeERC20.safeApprove(IERC20(params.tokenOut), wallet, amountOut);
        Wallet(wallet).depositERC20(user, params.tokenOut, amountOut);
    }

    function encodeExactInputSingleParams(
        IV3SwapRouter.ExactInputSingleParams memory params, bytes32 salt
    ) public pure returns (bytes memory) {
        bytes32 hashed = keccak256("ExactInputSingleParams(address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96,bytes32 salt)");
        bytes memory res = abi.encode(hashed,params,salt);
        return res;
    }

  
}
