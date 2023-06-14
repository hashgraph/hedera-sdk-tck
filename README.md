# hedera-sdk-tck
A TCK (Technology Compatibility Kit) used to verify compliant implementations of
a Hedera SDK

# test-driver-js

## Setup

Clone repository

    git clone git@github.com:hashgraph/hedera-sdk-tck.git

Enter Project directory

    cd test-driver-js


### Decide between Testnet or a local node

#### Testnet
* Get a Hedera testnet account ID and private key from Hedera [here](https://portal.hedera.com/register)
* rename `.env.testnet` to `.env`
* Add ECDSA account ID and private key to `.env`

#### Local node
* Start your [hedera-local-node](https://github.com/hashgraph/hedera-local-node)
* rename `.env.custom_node` to `.env`

### Start a JSON-RPC server

Start only the JSON-RPC sever for the SDK you want to test.

### Install and run

Install packages with npm

    npm install


Run specific test file

    npm run test test/account/test_CreateAccount.js

Run all tests

    npm run test


### Reports
After running `npm run test` the generated HTML and JSON reports can be found in the mochawesome-report folder