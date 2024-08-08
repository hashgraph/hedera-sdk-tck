import axios from 'axios';

class MirrorNodeClient {
  constructor() {
    this.mirrorNodeRestUrl = process.env.MIRROR_NODE_REST_URL;
    this.NODE_TIMEOUT = process.env.NODE_TIMEOUT;
  }

  async getAccountData(accountId) {
    const url = `${this.mirrorNodeRestUrl}/api/v1/accounts?account.id=${accountId}`;
    return this.retryUntilData(url, 'accounts');
  }

  async getBalanceData(accountId) {
    const url = `${this.mirrorNodeRestUrl}/api/v1/balances?account.id=${accountId}`;
    return this.retryUntilData(url, 'balances');
  }

  async getTokenData(tokenId) {
    const url = `${this.mirrorNodeRestUrl}/api/v1/tokens?token.id=${tokenId}`;
    return this.retryUntilData(url, 'tokens');
  }

  async retryUntilData(url, dataKey) {
    const maxRetries = Math.floor(this.NODE_TIMEOUT / 1000); // retry once per second
    let retries = 0;
    
    while(retries < maxRetries) {
      const response = await axios.get(url);

      // If the array is not empty, return the data
      if(response.data[dataKey] && response.data[dataKey].length > 0) {
        return response.data;
      }

      // If the array is empty, delay for a second before the next try
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
    }
    
    throw new Error('Max retries reached without data');
  }
}

export default new MirrorNodeClient();
