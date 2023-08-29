//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract immutableState {

    address public WETH9;
    address public swapRouter;
    constructor(address _WETH9, address _swapRouter){
        WETH9 = _WETH9;
        swapRouter = _swapRouter;
    }
}