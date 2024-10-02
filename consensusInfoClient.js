import {
  AccountBalanceQuery,
  AccountId,
  AccountInfoQuery,
  Client,
} from "@hashgraph/sdk";

class ConsensusInfoClient {
  constructor() {
    if (
      process.env.NODE_IP &&
      process.env.NODE_ACCOUNT_ID &&
      process.env.MIRROR_NETWORK
    ) {
      const node = {
        [process.env.NODE_IP]: AccountId.fromString(
          process.env.NODE_ACCOUNT_ID,
        ),
      };
      this.sdkClient = Client.forNetwork(node);
    } else {
      this.sdkClient = Client.forTestnet();
    }

    this.sdkClient.setOperator(
      process.env.OPERATOR_ACCOUNT_ID,
      process.env.OPERATOR_ACCOUNT_PRIVATE_KEY,
    );
  }

  async getBalance(accountId) {
    return this.executeAccountMethod(accountId, new AccountBalanceQuery());
  }

  async getAccountInfo(accountId) {
    return this.executeAccountMethod(accountId, new AccountInfoQuery());
  }

  async executeAccountMethod(accountId, method) {
    method.setAccountId(accountId);
    return method.execute(this.sdkClient);
  }
}

export default new ConsensusInfoClient();
