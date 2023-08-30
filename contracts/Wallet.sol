//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interface/IWETH9.sol";
import "./ImmutableState.sol";

contract Wallet  {
    address public WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    mapping(address => mapping(address => uint256)) public balanceOf;

    event Deposit(
        address indexed user,
        address indexed contractAddress,
        uint256 amount
    );
    event Withdraw(
        address indexed user,
        address indexed contractAddress,
        uint256 amount
    );

    function depositETH(address user) external payable {
        IWETH9(WETH9).deposit{value: msg.value}();
        balanceOf[user][WETH9] += msg.value;
        emit Deposit(user, address(0), msg.value);
    }

    function depositERC20(
        address user,
        address contractAdress,
        uint256 amount
    ) external {
        SafeERC20.safeTransferFrom(
            IERC20(contractAdress),
            msg.sender,
            address(this),
            amount
        );
        balanceOf[user][contractAdress] += amount;
        emit Deposit(user, contractAdress, amount);
    }

    function withdrawETH(address user, uint256 amount) external {
        require(msg.sender == user, "Wallet: invalid sender");
        require(
            balanceOf[user][WETH9] >= amount,
            "Wallet: insufficient ethers"
        );
        balanceOf[user][WETH9] -= amount;
        IWETH9(WETH9).withdraw(amount);
        (bool success, ) = address(msg.sender).call{value: amount}("");
        require(success, "Wallet: low-level call failed");
        emit Withdraw(user, address(0), amount);
    }

    function withdrawERC20(
        address user,
        address contractAddress,
        uint256 amount
    ) external {
        require(msg.sender == user, "Wallet: invalid sender");
        require(
            balanceOf[user][contractAddress] >= amount,
            "Wallet: insufficient tokens"
        );
        balanceOf[user][contractAddress] -= amount;
        SafeERC20.safeTransfer(IERC20(contractAddress), msg.sender, amount);
        emit Withdraw(user, contractAddress, amount);
    }

    receive() external payable {
    }
}
