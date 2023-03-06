import { providers } from "ethers/lib/ethers.js";
import sample from "lodash/sample";
import { NETWORK } from ".";

const MAINNET_RPC = [
  "http://rpc.gaussgang.com/",
];

const TESTNET_RPC = [
  "https://rpc.giltestnet.com",
];

const provider = new providers.JsonRpcProvider(NETWORK === "testnet" ? sample(TESTNET_RPC) : sample(MAINNET_RPC));

export default provider;
