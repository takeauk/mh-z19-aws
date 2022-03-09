import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');

export class GreengrassLambdaStack extends cdk.Stack {

    public readonly greengrassLambdaAlias: lambda.Alias;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // GreengrassにデプロイするLambda関数の作成
        const greengrassLambda = new lambda.Function(this, 'CO2MetricHandler', {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.fromAsset('handlers'),
            handler: 'CO2MetricHandler.CO2MetricHandler',
        });
        const version = greengrassLambda.currentVersion;

        // Greengrass Lambdaとして使用する場合、エイリアスを指定する必要がある
        this.greengrassLambdaAlias = new lambda.Alias(this, 'CO2MetricHandlerAlias', {
            aliasName: 'product',
            version: version
        })
    }
}