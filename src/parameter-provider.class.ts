import { getInput, info, setSecret } from "@actions/core";
import { SSMClient, GetParametersByPathCommand,GetParametersCommand, GetParametersCommandInput, SSMClientConfig, GetParametersCommandOutput, GetParametersByPathCommandOutput, GetParametersByPathCommandInput} from '@aws-sdk/client-ssm';

export interface Secret {
  key: string;
  value: string;
}

export class ParameterProvider {
  private client: SSMClient;

  constructor(client?: SSMClient, awsRegion?: string) {
    if (!client) {
      const config: SSMClientConfig = {};
      let awsRegionParam = awsRegion || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
      if (!awsRegionParam) {
        awsRegionParam = getInput('aws-region');
      }
      if (awsRegionParam) {
        config.region = awsRegionParam;
      }
      this.client = new SSMClient(config);
    } else {
      this.client = client;
    }
  }

  async getParametersByPath(path: string, withDecryption: boolean): Promise<Secret[]> {
    const input: GetParametersByPathCommandInput = {
      Path: path,
      Recursive: true,
      WithDecryption: withDecryption,
      // MaxResults: Number("int"),
      // NextToken: "STRING_VALUE",
    };
    const command = new GetParametersByPathCommand(input);
    const response = (await this.client.send(command)) as GetParametersByPathCommandOutput;
    return this.prepareResponse(response);
  }

  async getParameters(parameterNames: string[], withDecryption: boolean): Promise<Secret[]> {
    const input: GetParametersCommandInput = {
      Names: parameterNames,
      WithDecryption: withDecryption,
    };
    const command = new GetParametersCommand(input);
    const response = (await this.client.send(command)) as GetParametersCommandOutput;
    return this.prepareResponse(response);
  }

  prepareResponse(response: GetParametersCommandOutput | GetParametersByPathCommandOutput): Secret[] {
    if (!response?.Parameters || response.Parameters.length === 0) {
      return [];
    }

    const responseArray: Secret[] = []
    for (const parameter of response.Parameters) {
      const key = parameter?.Name ? parameter.Name.split('/').slice(-1)[0] : undefined;
      const value = parameter?.Value;

      if (!key || !value) {
        continue;
      }

      if (parameter.Type === 'SecureString') {
        setSecret(value);
      }

      responseArray.push({key, value});
      info(`Parameter ${key} retrieved`);
    }
    return responseArray;
  }

}

