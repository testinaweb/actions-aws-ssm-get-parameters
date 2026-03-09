import { format } from "node:path";
import { ParameterProvider, Secret } from "./parameter-provider.class";
import { ActionParams } from "./types";
import {
  exportVariable,
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setOutput,
} from '@actions/core';

export class Action {
  constructor(private parameterProvider: ParameterProvider) {}

  // This function validates the input parameters and returns them in a structured format
  validateParams(): ActionParams {
    const formatParam = getInput('format');
    const format = formatParam ? (formatParam as 'env' | 'env-file') : 'env';

    const paramsParam = getMultilineInput('parameters', { required: true });
    const parameters = paramsParam
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const withDecryption = getBooleanInput('with-decryption');

    return { format, parameters, withDecryption };
  }

  // This function is currently not used but can be used in the future to process parameters in chunks if needed
  splitParametersAndWildcards(params: string[]): { parameters: string[]; wildcards: string[] } {
    const parameters: string[] = [];
    const wildcards: string[] = [];

    for (const param of params) {
      if (param.slice(-1) === '*') {
        wildcards.push(param);
      } else {
        parameters.push(param);
      }
    }
    return { parameters, wildcards };
  }

  // This function is currently not used but can be used in the future to process parameters in chunks if needed
  async processWildcardParameters(wildcards: string[], withDecryption: ActionParams['withDecryption'] = true): Promise<Secret[]> {
    const secrets: Secret[] = [];
    if (wildcards.length === 0) {
      return secrets;
    }

    for (const wildcard of wildcards) {
      const secretsFromWildcard = await this.parameterProvider.getParametersByPath(wildcard, withDecryption);
      info(`Processed wildcard: ${wildcard} with ${secretsFromWildcard?.length || 0} secrets`);
      secrets.push(...secretsFromWildcard);
    }
    return secrets;
  }

  async processParameters(parameters: string[], withDecryption: ActionParams['withDecryption'] = true): Promise<Secret[]> {
    const secrets: Secret[] = [];
    for (let i = 0; i < parameters.length; i += 10) {
      const parameterChunk = parameters.slice(i, i + 10);

      const secretsFromParameters = await this.parameterProvider.getParameters(parameterChunk, withDecryption);
      secrets.push(...secretsFromParameters);
    }
    return secrets;
  }

  formatToEnvironmentVariables(secrets: Secret[]): void{
    for (const secret of secrets) {
      exportVariable(secret.key, secret.value);
      setOutput(secret.key, secret.value);
    }
  }

  formatToEnvFile(secrets: Secret[]): void {
    const envFileContent = secrets.map(secret => `${secret.key}=${secret.value}`).join('\n');
    setOutput('envFileContent', envFileContent);
    // save file .env in the root of the repository
    // this file will be automatically deleted after the job is complete
    // and can be used in the next steps of the job
    const envFilePath = `${process.cwd()}/.env`;
    require('fs').writeFileSync(envFilePath, envFileContent);
  }

  // This function is currently not used but can be used in the future to process parameters in chunks if needed
  async run(): Promise<void> {
    const { format, parameters: rawParams, withDecryption } = this.validateParams() ;

    const { parameters, wildcards } = this.splitParametersAndWildcards(rawParams);

    const secrets: Secret[] = [];

    const secretsFromWildcard = await this.processWildcardParameters(wildcards, withDecryption);
    secrets.push(...secretsFromWildcard);

    const secretsFromParameters = await this.processParameters(parameters, withDecryption);
    secrets.push(...secretsFromParameters);

    switch (format) {
      case 'env-file':
        this.formatToEnvFile(secrets);
        info('Env file format selected');
        break;
      default:
        this.formatToEnvironmentVariables(secrets);
        info('Env variable format selected');
        break;
    }

    info('Job Complete');
  }
}

const actionFactory = () => {
  return new Action(new ParameterProvider());
}

export { actionFactory };
