export interface ActionParams {
  format?: 'env' | 'env-file';
  parameters: string[];
  withDecryption?: boolean;
  awsRegion?: string;
}

