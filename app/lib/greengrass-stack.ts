import cdk = require('@aws-cdk/core');
import iot = require('@aws-cdk/aws-iot');
import lambda = require('@aws-cdk/aws-lambda');
import greengrass = require('@aws-cdk/aws-greengrass');

interface GreengrassstackProps extends cdk.StackProps {
    greengrassLambdaAlias: lambda.Alias
}

export class GreengrassStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: GreengrassstackProps) {
        super(scope, id, props);

        const thingName = this.node.tryGetContext('greengrassCoreThingName')
        const groupName = this.node.tryGetContext('greengrassGroupName')
        const certArn = this.node.tryGetContext('greengrassCoreCertArn');
        const region: string = cdk.Stack.of(this).region;
        const accountId: string = cdk.Stack.of(this).account;
        const snsConnectorTopicArn = this.node.tryGetContext('snsConnectorTopicArn')

        // AWS IoTのモノの作成
        const iotThing = new iot.CfnThing(this, 'Thing', {
            thingName: thingName
        });

        if (iotThing.thingName !== undefined) {

            const thingArn = `arn:aws:iot:${region}:${accountId}:thing/${iotThing.thingName}`;

            // ポリシーを作成
            const iotPolicy = new iot.CfnPolicy(this, 'Policy', {
                policyName: 'Raspberry_Pi_Policy',
                policyDocument: {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "iot:*",
                                "greengrass:*",
                            ],
                            "Resource": [
                                "*"
                            ]
                        }
                    ]
                }
            });
            iotPolicy.addDependsOn(iotThing);

            // 証明書にポリシーをアタッチ
            if (iotPolicy.policyName !== undefined) {
                const policyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(this, 'PolicyPrincipalAttachment', {
                    policyName: iotPolicy.policyName,
                    principal: certArn
                })
                policyPrincipalAttachment.addDependsOn(iotPolicy)
            }

            // モノに証明書をアタッチ
            const thingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(this, 'ThingPrincipalAttachment', {
                thingName: iotThing.thingName,
                principal: certArn
            });
            thingPrincipalAttachment.addDependsOn(iotThing)

            // Greengrass Coreの作成
            const coreDefinition = new greengrass.CfnCoreDefinition(this, 'CoreDefinition', {
                name: 'Raspberry_Pi_Core',
                initialVersion: {
                    cores: [
                        {
                            certificateArn: certArn,
                            id: '1',
                            thingArn: thingArn
                        }
                    ]
                }
            });
            coreDefinition.addDependsOn(iotThing)

            // Greengrassリソースの作成
            const resourceDefinition = new greengrass.CfnResourceDefinition(this, 'ResourceDefinition', {
                name: 'Resource',
            });

            const subscriptionDefinition = new greengrass.CfnSubscriptionDefinition(this, 'SubscriptionDefinition', {
                name: 'metric_subscription'
            });

            const subscriptionDefinitionVersion = new greengrass.CfnSubscriptionDefinitionVersion(this, "SubscriptionDefinitionVersion", {
                subscriptionDefinitionId: subscriptionDefinition.ref,
                subscriptions: [
                    {
                        id: "1",
                        source: props.greengrassLambdaAlias.functionArn,
                        subject: 'metrics/co2',
                        target: 'cloud'
                    }
                ]
            });

            // シリアルデータの読み込み、書き込み先のリソースを定義
            const resourceDefinitionVersion = new greengrass.CfnResourceDefinitionVersion(this, 'ResourceDefinitionVersion', {
                resourceDefinitionId: resourceDefinition.attrId,
                resources: [
                    {
                        id: '1',
                        name: 'serial_resource',
                        resourceDataContainer: {
                            localDeviceResourceData: {
                                sourcePath: '/dev/ttyAMA0',
                                groupOwnerSetting: {
                                    autoAddGroupOwner: false,
                                    groupOwner: 'dialout'
                                }
                            }
                        }
                    },
                ]
            });

            // Greengrass Lambdaの作成
            const functionDefinition = new greengrass.CfnFunctionDefinition(this, 'FunctionDefinition', {
                name: thingName,
                initialVersion: {
                    functions: [
                        {
                            id: '1',
                            functionArn: props.greengrassLambdaAlias.functionArn,
                            functionConfiguration: {
                                encodingType: 'binary',
                                memorySize: 65536,
                                pinned: true,
                                timeout: 3,
                                environment: {
                                    // ログファイルを書き出すため、リソースの書き込み権限を与える
                                    resourceAccessPolicies: [
                                        {
                                            resourceId: '1',
                                            permission: 'rw'
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            });

            // Greengrassグループの作成
            const group = new greengrass.CfnGroup(this, 'Group', {
                name: groupName,
                initialVersion: {
                    coreDefinitionVersionArn: coreDefinition.attrLatestVersionArn,
                    subscriptionDefinitionVersionArn: subscriptionDefinitionVersion.ref,
                    resourceDefinitionVersionArn: resourceDefinitionVersion.ref,
                    functionDefinitionVersionArn: functionDefinition.attrLatestVersionArn
                }
            });

            // 一連のDefinitionの作成が終わったらグループを作成
            group.addDependsOn(coreDefinition)
            group.addDependsOn(subscriptionDefinition)
            group.addDependsOn(resourceDefinition)
            group.addDependsOn(functionDefinition)
        }
    }
}