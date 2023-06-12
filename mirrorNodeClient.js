import axios from "axios";

class MirrorNodeClient {
  constructor() {
    this.mirrorNodeRestUrl = process.env.MIRROR_NODE_REST_URL;
    this.nodeDelay = process.env.NODE_DELAY;
  }

  async getAccountData(accountId) {
    await this.delay();
    const url = `${this.mirrorNodeRestUrl}/api/v1/accounts?account.id=${accountId}`;
    const response = await axios.get(url);
    return response.data;
  }

  async getBalanceData(accountId) {
    await this.delay();
    const url = `${this.mirrorNodeRestUrl}/api/v1/balances?account.id=${accountId}`;
    const response = await axios.get(url);
    return response.data;
  }

  async delay() {
    return new Promise((resolve) => setTimeout(resolve, this.nodeDelay));
  }
}

export default new MirrorNodeClient();
