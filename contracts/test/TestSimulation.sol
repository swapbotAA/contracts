//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;


contract TestSimulation {
    uint256 internal value;

    function get() external view returns(uint256){
        return value+1;
    }
}