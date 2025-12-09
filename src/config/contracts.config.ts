import { InterfaceAbi } from "ethers";
import paymentExecutorAbi from "../abis/payment-executor.json";
import multisenderAbi from "../abis/multisender.json";
import { config } from "./env.config";
import { EventRoutingKeys, ExchangeNames } from "../utils/enum";

interface ContractEvent {
  eventName: keyof typeof EventRoutingKeys;
  argNames: string[];
}

export interface ContractConfig {
  address: string;
  abi: InterfaceAbi;
  events: ContractEvent[];
  exchangeName: ExchangeNames;
}

export const CONTRACTS_TO_LISTEN: ContractConfig[] = [
  {
    address: config.paymentExecutorAddress,
    abi: paymentExecutorAbi,
    exchangeName: ExchangeNames.PaymentExecutor,
    events: [
      {
        eventName: "PaymentExecuted",
        argNames: ["payer", "referenceId", "totalAmount"],
      },
      {
        eventName: "PartnerPaid",
        argNames: ["partner", "referenceId", "amount"],
      },
      {
        eventName: "PartnerOwedRecorded",
        argNames: ["partner", "referenceId", "amount"],
      },
      { eventName: "Withdraw", argNames: ["to", "amount", "reason"] },
    ],
  },
  {
    address: config.multisenderAddress,
    abi: multisenderAbi,
    exchangeName: ExchangeNames.Multisender,
    events: [
      {
        eventName: "TokensDistributed",
        argNames: ["sender", "recipientCount", "totalAmount"],
      },
      {
        eventName: "TokensSent",
        argNames: ["recipient", "amount", "success"],
      },
      {
        eventName: "OwnershipTransferred",
        argNames: ["newOwner"],
      },
    ],
  },
];
