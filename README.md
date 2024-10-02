# Hedera SDK TCK

A Technology Compatibility Kit (TCK) is a set of tools, documentation, and test suites used to verify whether a software implementation conforms to a specific technology standard or specification. The hedera-sdk-tck aims to verify compliant implementations of
a Hedera SDK. It will encompass tests that validate the implmentation of consensus node software transactions and queries, performance and longevity testing.

# test-driver-js

## Setup

Clone repository

    git clone git@github.com:hashgraph/hedera-sdk-tck.git

### Decide between Testnet or a local node

#### Testnet

- Get a Hedera testnet account ID and private key from Hedera [here](https://portal.hedera.com/register)
- rename `.env.testnet` to `.env`
- Add ECDSA account ID and private key to `.env`

#### Local node

- Start your [hedera-local-node](https://github.com/hashgraph/hedera-local-node)
- rename `.env.custom_node` to `.env`

### Start a JSON-RPC server

Start only the JSON-RPC server for the SDK you want to test. The JSON-RPC server for the specified SDK will parse the JSON formatted request received by the test driver. The JSON-RPC server will execute the corresponding function or procedure associated with that method and prepare the response in JSON format to send back to the test driver. 

### Install and run

Install packages with npm

    npm install

Run specific test file

    npm run test test/account/test_accountCreateTransaction.js

Run all tests

    npm run test

### Reports

After running `npm run test` the generated HTML and JSON reports can be found in the mochawesome-report folder

### Linting and Formatting
To ensure code quality and consistent styling, you can run ESLint and Prettier on the codebase.

To check for **code issues**, run:

    npm run lint

To **format** the code run:

    npm run format


## Support

If you have a question on how to use the product, please see our
[support guide](https://github.com/hashgraph/.github/blob/main/SUPPORT.md).

## Contributing

Contributions are welcome. Please see the
[contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md)
to see how you can get involved.

## Code of Conduct

This project is governed by the
[Contributor Covenant Code of Conduct](https://github.com/hashgraph/.github/blob/main/CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code of conduct. Please report unacceptable behavior
to [oss@hedera.com](mailto:oss@hedera.com).

## License

[Apache License 2.0](LICENSE)
