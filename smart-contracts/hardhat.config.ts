import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainId: 80002,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Source verification on Polygonscan (Amoy). Lets the explorer decode method
  // names (issueBatch / revokeLeaf / addIssuer) and params, and exposes the
  // Read/Write Contract tabs. Run: npx hardhat verify --network polygonAmoy <addr>
  etherscan: {
    // Etherscan API V2 — a single key works across all chains (Amoy included).
    apiKey: process.env.POLYGONSCAN_API_KEY || "",
  },
};

export default config;
