export const BLOCKCHAIN_QUEUE = 'blockchain';

export const BLOCKCHAIN_JOB_ISSUE = 'issue_credential';
export const BLOCKCHAIN_JOB_REVOKE = 'revoke_credential';

export interface BlockchainTxJobData {
  transactionId: string;
}
