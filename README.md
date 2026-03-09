# AWS SSM Get Parameters GitHub Action

A GitHub Action to retrieve parameters from AWS Systems Manager (SSM) Parameter Store and set them as environment variables or an environment file for use in subsequent steps.

## Features

- ✅ Retrieve parameters from AWS SSM Parameter Store
- ✅ Support for wildcard patterns to fetch multiple parameters
- ✅ Support for encrypted SecretString parameters
- ✅ Set parameters as environment variables or an env file
- ✅ Configurable AWS region

## Usage

### Basic Example

```yaml
- name: Get SSM Parameters
  uses: junomedical/actions-aws-ssm-get-parameters@v1
  with:
    parameters: /myapp/database-url,/myapp/api-key
    aws-region: eu-central-1
```

### Using Wildcard Patterns

```yaml
- name: Get SSM Parameters with Wildcards
  uses: junomedical/actions-aws-ssm-get-parameters@v1
  with:
    parameters: /myapp/*,/shared/config
    aws-region: eu-central-1
    with-decryption: 'true'
```

### Set Parameters as Env File

```yaml
- name: Get SSM Parameters as File
  uses: junomedical/actions-aws-ssm-get-parameters@v1
  with:
    parameters: /myapp/db-url,/myapp/api-key
    format: env-file
    aws-region: eu-central-1
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `parameters` | ✅ | - | List of SSM parameter names or wildcard patterns to retrieve, separated by commas |
| `format` | ❌ | `env` | Output format: `env` (environment variables) or `env-file` (environment file) |
| `with-decryption` | ❌ | `true` | Whether to decrypt SecureString SSM parameters |
| `aws-region` | ❌ | - | AWS region where parameters are stored. If not provided, uses environment or AWS configuration |

## Outputs

The action sets environment variables or creates an environment file based on the `format` input.

### Format: `env`
Environment variables are set directly and available in subsequent steps:
```bash
echo $DATABASE_URL  # Value from SSM
```

### Format: `env-file`
Parameters are written to `$GITHUB_ENV` and automatically loaded for subsequent steps.

## Prerequisites

You need to configure AWS credentials in your workflow. Use the official [AWS credentials action](https://github.com/aws-actions/configure-aws-credentials):

```yaml
- name: "Configure AWS credentials via OIDC"
  uses: aws-actions/configure-aws-credentials@v6.0.0
  with:
    role-to-assume: arn:aws:iam::616519942006:role/github-actions-role
    aws-region: eu-central-1
    role-session-name: github-actions-session

- name: Get SSM Parameters
  uses: junomedical/actions-aws-ssm-get-parameters@v1
  with:
    parameters: /myapp/config
    aws-region: eu-central-1
```

## IAM Permissions Required

Your AWS IAM user or role needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "arn:aws:kms:*:*:key/*"
    }
  ]
}
```

## Examples

### Example: Database Configuration

```yaml
name: Deploy Application

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: "Configure AWS credentials via OIDC"
        uses: aws-actions/configure-aws-credentials@v6.0.0
        with:
          role-to-assume: arn:aws:iam::616519942006:role/github-actions-role
          aws-region: eu-central-1
          role-session-name: github-actions-session

      - name: Get Database Credentials
        uses: junomedical/actions-aws-ssm-get-parameters@v1
        with:
          parameters: /myapp/*
          with-decryption: 'true'

      - name: Deploy Application
        run: |
          npm install
          npm run build
          npm run deploy
        env:
          DB_HOST: ${{ env.db-host }}
          DB_USER: ${{ env.db-user }}
          DB_PASSWORD: ${{ env.db-password }}
```

### Example: Multiple Services

```yaml
- name: Get All Service Configs
  uses: junomedical/actions-aws-ssm-get-parameters@v1
  with:
    parameters: /services/*
    format: env
    aws-region: us-west-2

- name: Use Parameters
  run: echo "Service A: $SERVICE_A_CONFIG"
```

## Development

### Building

```bash
npm run build
```

### Packaging

```bash
npm run package
```

### Testing

```bash
npm test
```

### All-in-one

```bash
npm run all
```

## License

MIT License - see the [LICENSE](LICENSE) file for details

## Support

For issues, questions, or contributions, please create an issue on [GitHub](https://github.com/junomedical/actions-aws-ssm-get-parameters/issues).
