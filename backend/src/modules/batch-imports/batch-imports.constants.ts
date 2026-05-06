export const BATCH_IMPORT_QUEUE = 'batch-imports';
export const BATCH_IMPORT_JOB_PROCESS = 'process_batch';

export interface BatchImportJobData {
  batchImportId: string;
}

export interface BatchRowError {
  row: number | null;
  field: string | null;
  error: string;
}
