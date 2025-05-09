require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    rinkeby: {
      url: `https://mainnet.infura.io/v3/58526e4ef7ab49548360d15b63de81b8`,/*the network it is connected to*/
      accounts: [`02726821A7Eb58705bc919EA325d80294a3F2eA5`] /*the wallet address*/
    }
  }
};
