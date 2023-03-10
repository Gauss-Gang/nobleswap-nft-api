import { providers } from "ethers";
import sample from "lodash/sample";
import { NETWORK } from ".";

const MAINNET_RPC = [
  "https://rpc.gaussgang.com/",
];

const TESTNET_RPC = [
  "https://rpc.giltestnet.com",
];

const provider = new providers.JsonRpcProvider(sample(TESTNET_RPC));

export default provider;
