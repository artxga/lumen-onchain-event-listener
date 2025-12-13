export enum EventRoutingKeys {
  PaymentExecuted = "payment.executed",
  PartnerPaid = "partner.paid",
  PartnerOwedRecorded = "partner.owed",
  Withdraw = "withdraw",

  TokensDistributed = "tokens.distributed",
  TokensSent = "tokens.sent",
  OwnershipTransferred = "ownership.transferred",
}

export enum ExchangeNames {
  PaymentExecutor = "pexcon.events",
  Multisender = "multisender.events",
}
