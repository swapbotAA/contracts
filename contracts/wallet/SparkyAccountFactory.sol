// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./SparkyAccount.sol";

/**
 * A sample factory contract for SparkyAccount
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample factory).
 * The factory's createAccount returns the target account address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract SparkyAccountFactory {
    SparkyAccount public immutable accountImplementation;

    constructor(IEntryPoint _entryPoint, address router) {
        accountImplementation = new SparkyAccount(_entryPoint, router);
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createAccount(
        address owner,
        uint256 salt
    ) public returns (SparkyAccount ret) {
        address addr = findAddress(owner, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return SparkyAccount(payable(addr));
        }
        ret = SparkyAccount(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(SparkyAccount.initialize, (owner))
                )
            )
        );
    }

    // function createAccount(address owner,uint256 salt) public returns (address) {
    //     address addr = findAddress(owner, salt);
    //     uint codeSize = addr.code.length;
    //     if (codeSize > 0) {
    //         // return SparkyAccount(payable(addr));
    //         return addr;
    //     }
    //     SparkyAccount(payable(new ERC1967Proxy{salt : bytes32(salt)}(
    //             address(accountImplementation),
    //             abi.encodeCall(SparkyAccount.initialize, (owner))
    //         )));

    //     return addr;
    // }

    /**
     * calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function findAddress(
        address owner,
        uint256 salt
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplementation),
                            abi.encodeCall(SparkyAccount.initialize, (owner))
                        )
                    )
                )
            );
    }
}
