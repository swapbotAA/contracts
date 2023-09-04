//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Register is Ownable {
    mapping(address=>bool) _isApprovedRouter;

    event NewRouterApproved(address indexed router);
    event RouterRemoved(address indexed router);


    function isApproved(address register) public view returns(bool){
        return _isApprovedRouter[register];
    }
    function addRouter(address newRouter) onlyOwner external {
        require(!isApproved(newRouter), "Register: already approved");
        _isApprovedRouter[newRouter]=true;
        emit NewRouterApproved(newRouter);
    }

    function removeRouter(address router) onlyOwner external {
        require(isApproved(router), "Register: router not approved");
        _isApprovedRouter[router]=false;
        emit RouterRemoved(router);
    }
}