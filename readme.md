# Sparky Contracts - Account Abstraction

## Overview

Sparky smart contracts are sets of ERC4337 account abstraction components built on top of [eth-infinitism](https://github.com/eth-infinitism/account-abstraction). It is compatible with wide deployed `EntryPoint` contracts with several implementations:

- **Sparky Account Proxy**: UUPS proxy contracts to deploy on target address, this contract is the actual instance of a smart account.
- **Sparky Account Implementation**: the logic contract for proxy contract, can execute arbituary message calls to external contracts. Sparky account check the legitimacy of a message call by verifying its ECDSA signature.
- **Sparky Account Factory**: contracts for deploying proxy contract.
- **Sparky Paymaster**: gas payment contracts.

## Get started

Copy `.env.example`, paste to `.env`, fill necessary values and run installation,

```shell
npm install
```

## Test

Execute tests under `/test` folder.

```shell
npx hardhat test
```

## Deployment

You need to manually implement the deployment scripts under `/scripts` folder.

Below is an example for deploying account factory

`deploy.js`

```javascript
require('dotenv').config()
SWAPROUTER = process.env.UNIVERSALROUTER_BSC
ENTRYPOINT = process.env.ENTRYPOINT

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const SparkyAccountFactory = await ethers.getContractFactory("SparkyAccountFactory");
  sparkyAccountFactory = await SparkyAccountFactory.deploy(ENTRYPOINT, SWAPROUTER)
  await sparkyAccountFactory.deployed()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly hanadle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

run scripts

```
`npx hardhat run --network your_network ./scripts/deploy.js`
```

## Verify on Etherscan

Run following command to open source your code on Etherscan, learn more about [hardhat-verify](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify)

```shell
npx hardhat verify --network your_network contract_address "constructor 1" "constructor 2"...
```

