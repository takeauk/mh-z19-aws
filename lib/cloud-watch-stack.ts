import cdk = require('@aws-cdk/core');
import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import cloudwatchactions = require('@aws-cdk/aws-cloudwatch-actions');
import iam = require('@aws-cdk/aws-iam')
import sns = require('@aws-cdk/aws-sns')
import chatbot = require('@aws-cdk/aws-chatbot')

interface CloudWatchStackProps extends cdk.StackProps {
    notificationSlackChannelId: string,
    notificationSlackWorkspaceId: string
}

export class CloudWatchStack extends cdk.Stack {

    constructor(scope: cdk.Construct, id: string, props?: CloudWatchStackProps) {
        super(scope, id, props);

        const chatbotRole = new iam.Role(this, "chatbot-role", {
            roleName: "chatbot-role",
            assumedBy: new iam.ServicePrincipal("sns.amazonaws.com"),
        });

        chatbotRole.addToPolicy(
            new iam.PolicyStatement({
                resources: ["*"],
                actions: [
                    "cloudwatch:Describe*",
                    "cloudwatch:Get*",
                    "cloudwatch:List*",
                ],
            })
        );

        const topic = new sns.Topic(this, "notification-topic", {
            displayName: "ChatbotNotificationTopic",
            topicName: "ChatbotNotificationTopic",
        });

        const cloudwatchAlarm = new cloudwatch.Alarm(this, 'CO2Alert', {
            metric: new cloudwatch.Metric({
                namespace: 'IoT',
                metricName: 'CO2'
            }),
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_UPPER_THRESHOLD,
            threshold: 1000,
            evaluationPeriods: 5,
        });

        const cloudwatchAlarmAction = new cloudwatchactions.SnsAction(topic);
        cloudwatchAlarm.addAlarmAction(cloudwatchAlarmAction);

        const chatBot = new chatbot.CfnSlackChannelConfiguration(this, "CO2SlackNotification", {
            configurationName: "co2-slack-notification",
            iamRoleArn: chatbotRole.roleArn,
            slackWorkspaceId: props!.notificationSlackWorkspaceId,
            slackChannelId: props!.notificationSlackChannelId,
            snsTopicArns: [topic.topicArn],
        });
    }
}
