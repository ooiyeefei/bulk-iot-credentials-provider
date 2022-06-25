"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkIotCredentialsProviderStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const sqs = require("aws-cdk-lib/aws-sqs");
const s3 = require("aws-cdk-lib/aws-s3");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const iam = require("aws-cdk-lib/aws-iam");
class BulkIotCredentialsProviderStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // s3 buckets
        // S3 bucket to store certificates and keys
        const provisioningBucket = new s3.Bucket(this, 'iotProvisioningS3Bucket', {
            versioned: false,
            bucketName: 'iot-provisioning-bucket',
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        // uploading local provisioning files to s3 bucket
        new s3deploy.BucketDeployment(this, 'BucketDeployment', {
            sources: [s3deploy.Source.asset('../provisioning')],
            destinationBucket: provisioningBucket,
        });
        // test resources provisioning
        // s3 buckets
        const generalBucket = new s3.Bucket(this, 'iotGeneralS3Bucket', {
            versioned: false,
            bucketName: 'iot-bucket-general',
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        const customerBucketAbc = new s3.Bucket(this, 'iotCustomerS3BucketAbc', {
            versioned: false,
            bucketName: 'iot-bucket-customer-abc',
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        const locationBucket123 = new s3.Bucket(this, 'iotLocationS3Bucket123', {
            versioned: false,
            bucketName: 'iot-bucket-location-123',
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        const locationBucket456 = new s3.Bucket(this, 'iotLocationS3Bucket456', {
            versioned: false,
            bucketName: 'iot-bucket-location-456',
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        // sqs 
        const generalQueue = new sqs.Queue(this, 'iotGeneralQueue', {
            queueName: 'iot-queue-general',
        });
        const individualQueue = new sqs.Queue(this, 'iotIndivQueue', {
            queueName: 'iot-queue-location-123',
        });
        // iam policies
        // s3 bucket policies
        const generalBucketPolicy = new iam.PolicyStatement({
            resources: [
                generalBucket.bucketArn,
                generalBucket.arnForObjects('*'),
            ],
            actions: [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ]
        });
        const individualBucketPolicy = new iam.PolicyStatement({
            resources: [
                "arn:aws:s3:::iot-bucket-${credentials-iot:ThingName}/*",
                "arn:aws:s3:::iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}/*",
                "arn:aws:s3:::iot-bucket-${credentials-iot:ThingName}",
                "arn:aws:s3:::iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}"
            ],
            actions: [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ]
        });
        generalBucketPolicy.addActions("s3:ListAllMyBuckets");
        // sqs bucket policies
        const generalQueuePolicy = new iam.PolicyStatement({
            resources: [
                generalQueue.queueArn,
            ],
            actions: [
                "sqs:DeleteMessage",
                "sqs:ReceiveMessage",
                "sqs:SendMessage",
                "sqs:GetQueueAttributes"
            ],
        });
        generalQueuePolicy.addActions("sqs:ListQueues");
        const dynamicIndivQueueArn = new aws_cdk_lib_1.StringConcat().join(individualQueue.queueArn.toString(), "");
        const individualQueuePolicy = new iam.PolicyStatement({
            resources: [
                dynamicIndivQueueArn
            ],
            actions: [
                "sqs:DeleteMessage",
                "sqs:ReceiveMessage",
                "sqs:SendMessage",
                "sqs:GetQueueAttributes"
            ],
        });
        // iam role
        const accessRole = new iam.Role(this, 'iotAccessRole', {
            roleName: 'iot-access-role',
            assumedBy: new iam.ServicePrincipal('credentials.iot.amazonaws.com'),
            maxSessionDuration: aws_cdk_lib_1.Duration.hours(12),
        });
        accessRole.addToPolicy(generalBucketPolicy);
        accessRole.addToPolicy(individualBucketPolicy);
        accessRole.addToPolicy(generalQueuePolicy);
        accessRole.addToPolicy(individualQueuePolicy);
    }
}
exports.BulkIotCredentialsProviderStack = BulkIotCredentialsProviderStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsay1pb3QtY3JlZGVudGlhbHMtcHJvdmlkZXItc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJidWxrLWlvdC1jcmVkZW50aWFscy1wcm92aWRlci1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBMkY7QUFFM0YsMkNBQTJDO0FBQzNDLHlDQUF5QztBQUN6QywwREFBMEQ7QUFDMUQsMkNBQTJDO0FBRTNDLE1BQWEsK0JBQWdDLFNBQVEsbUJBQUs7SUFHeEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixhQUFhO1FBQ2IsMkNBQTJDO1FBQzNDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUN4RSxTQUFTLEVBQUUsS0FBSztZQUNoQixVQUFVLEVBQUUseUJBQXlCO1lBQ3JDLGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsYUFBYSxFQUFFLDJCQUFhLENBQUMsT0FBTztTQUNyQyxDQUFDLENBQUM7UUFFSCxrREFBa0Q7UUFDbEQsSUFBSSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3RELE9BQU8sRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDbkQsaUJBQWlCLEVBQUUsa0JBQWtCO1NBQ3RDLENBQUMsQ0FBQztRQUVILDhCQUE4QjtRQUM5QixhQUFhO1FBQ2IsTUFBTSxhQUFhLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM5RCxTQUFTLEVBQUUsS0FBSztZQUNoQixVQUFVLEVBQUUsb0JBQW9C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ZUFBZSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUU3RixNQUFNLHFCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwRCxTQUFTLEVBQUU7Z0JBQ1Qsb0JBQW9CO2FBQ3JCO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLG1CQUFtQjtnQkFDbkIsb0JBQW9CO2dCQUNwQixpQkFBaUI7Z0JBQ2pCLHdCQUF3QjthQUN6QjtTQUNGLENBQUMsQ0FBQztRQUVILFdBQVc7UUFDWCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUNyRCxRQUFRLEVBQUUsaUJBQWlCO1lBQzNCLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQywrQkFBK0IsQ0FBQztZQUNwRSxrQkFBa0IsRUFBRSxzQkFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7U0FDdkMsQ0FBQyxDQUFDO1FBRUgsVUFBVSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzVDLFVBQVUsQ0FBQyxXQUFXLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUMvQyxVQUFVLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDM0MsVUFBVSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ2hELENBQUM7Q0FDRjtBQTVJRCwwRUE0SUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZW1vdmFsUG9saWN5LCBTdGFjaywgU3RhY2tQcm9wcywgU3RyaW5nQ29uY2F0LCBGbiwgRHVyYXRpb24gfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBzM2RlcGxveSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5cbmV4cG9ydCBjbGFzcyBCdWxrSW90Q3JlZGVudGlhbHNQcm92aWRlclN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBzM0J1Y2tldDogczMuQnVja2V0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gczMgYnVja2V0c1xuICAgIC8vIFMzIGJ1Y2tldCB0byBzdG9yZSBjZXJ0aWZpY2F0ZXMgYW5kIGtleXNcbiAgICBjb25zdCBwcm92aXNpb25pbmdCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdpb3RQcm92aXNpb25pbmdTM0J1Y2tldCcsIHtcbiAgICAgIHZlcnNpb25lZDogZmFsc2UsXG4gICAgICBidWNrZXROYW1lOiAnaW90LXByb3Zpc2lvbmluZy1idWNrZXQnLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgfSk7XG5cbiAgICAvLyB1cGxvYWRpbmcgbG9jYWwgcHJvdmlzaW9uaW5nIGZpbGVzIHRvIHMzIGJ1Y2tldFxuICAgIG5ldyBzM2RlcGxveS5CdWNrZXREZXBsb3ltZW50KHRoaXMsICdCdWNrZXREZXBsb3ltZW50Jywge1xuICAgICAgc291cmNlczogW3MzZGVwbG95LlNvdXJjZS5hc3NldCgnLi4vcHJvdmlzaW9uaW5nJyldLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IHByb3Zpc2lvbmluZ0J1Y2tldCxcbiAgICB9KTtcblxuICAgIC8vIHRlc3QgcmVzb3VyY2VzIHByb3Zpc2lvbmluZ1xuICAgIC8vIHMzIGJ1Y2tldHNcbiAgICBjb25zdCBnZW5lcmFsQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnaW90R2VuZXJhbFMzQnVja2V0Jywge1xuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICAgIGJ1Y2tldE5hbWU6ICdpb3QtYnVja2V0LWdlbmVyYWwnLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgfSk7XG5cbiAgICBjb25zdCBjdXN0b21lckJ1Y2tldEFiYyA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ2lvdEN1c3RvbWVyUzNCdWNrZXRBYmMnLCB7XG4gICAgICB2ZXJzaW9uZWQ6IGZhbHNlLFxuICAgICAgYnVja2V0TmFtZTogJ2lvdC1idWNrZXQtY3VzdG9tZXItYWJjJyxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IFJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgIH0pO1xuXG4gICAgY29uc3QgbG9jYXRpb25CdWNrZXQxMjMgPSBuZXcgczMuQnVja2V0KHRoaXMsICdpb3RMb2NhdGlvblMzQnVja2V0MTIzJywge1xuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICAgIGJ1Y2tldE5hbWU6ICdpb3QtYnVja2V0LWxvY2F0aW9uLTEyMycsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBSZW1vdmFsUG9saWN5LkRFU1RST1lcbiAgICB9KTtcblxuICAgIGNvbnN0IGxvY2F0aW9uQnVja2V0NDU2ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnaW90TG9jYXRpb25TM0J1Y2tldDQ1NicsIHtcbiAgICAgIHZlcnNpb25lZDogZmFsc2UsXG4gICAgICBidWNrZXROYW1lOiAnaW90LWJ1Y2tldC1sb2NhdGlvbi00NTYnLFxuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZXG4gICAgfSk7XG5cbiAgICAvLyBzcXMgXG4gICAgY29uc3QgZ2VuZXJhbFF1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnaW90R2VuZXJhbFF1ZXVlJywge1xuICAgICAgcXVldWVOYW1lOiAnaW90LXF1ZXVlLWdlbmVyYWwnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5kaXZpZHVhbFF1ZXVlID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnaW90SW5kaXZRdWV1ZScsIHtcbiAgICAgIHF1ZXVlTmFtZTogJ2lvdC1xdWV1ZS1sb2NhdGlvbi0xMjMnLFxuICAgIH0pO1xuXG4gICAgLy8gaWFtIHBvbGljaWVzXG4gICAgLy8gczMgYnVja2V0IHBvbGljaWVzXG4gICAgY29uc3QgZ2VuZXJhbEJ1Y2tldFBvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICBnZW5lcmFsQnVja2V0LmJ1Y2tldEFybixcbiAgICAgICAgZ2VuZXJhbEJ1Y2tldC5hcm5Gb3JPYmplY3RzKCcqJyksXG4gICAgICBdLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBcInMzOlB1dE9iamVjdFwiLFxuICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICBcInMzOkxpc3RCdWNrZXRcIixcbiAgICAgICAgXCJzMzpEZWxldGVPYmplY3RcIlxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgY29uc3QgaW5kaXZpZHVhbEJ1Y2tldFBvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICBcImFybjphd3M6czM6Ojppb3QtYnVja2V0LSR7Y3JlZGVudGlhbHMtaW90OlRoaW5nTmFtZX0vKlwiLFxuICAgICAgICBcImFybjphd3M6czM6Ojppb3QtYnVja2V0LSR7Y3JlZGVudGlhbHMtaW90OlRoaW5nVHlwZU5hbWV9LyR7Y3JlZGVudGlhbHMtaW90OlRoaW5nTmFtZX0vKlwiLFxuICAgICAgICBcImFybjphd3M6czM6Ojppb3QtYnVja2V0LSR7Y3JlZGVudGlhbHMtaW90OlRoaW5nTmFtZX1cIixcbiAgICAgICAgXCJhcm46YXdzOnMzOjo6aW90LWJ1Y2tldC0ke2NyZWRlbnRpYWxzLWlvdDpUaGluZ1R5cGVOYW1lfS8ke2NyZWRlbnRpYWxzLWlvdDpUaGluZ05hbWV9XCJcbiAgICAgIF0sXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIFwiczM6UHV0T2JqZWN0XCIsXG4gICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXG4gICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiLFxuICAgICAgICBcInMzOkRlbGV0ZU9iamVjdFwiXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICBnZW5lcmFsQnVja2V0UG9saWN5LmFkZEFjdGlvbnMoXG4gICAgICBcInMzOkxpc3RBbGxNeUJ1Y2tldHNcIlxuICAgIClcblxuICAgIC8vIHNxcyBidWNrZXQgcG9saWNpZXNcbiAgICBjb25zdCBnZW5lcmFsUXVldWVQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgZ2VuZXJhbFF1ZXVlLnF1ZXVlQXJuLFxuICAgICAgXSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgXCJzcXM6RGVsZXRlTWVzc2FnZVwiLFxuICAgICAgICBcInNxczpSZWNlaXZlTWVzc2FnZVwiLFxuICAgICAgICBcInNxczpTZW5kTWVzc2FnZVwiLFxuICAgICAgICBcInNxczpHZXRRdWV1ZUF0dHJpYnV0ZXNcIlxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGdlbmVyYWxRdWV1ZVBvbGljeS5hZGRBY3Rpb25zKFwic3FzOkxpc3RRdWV1ZXNcIilcblxuICAgIGNvbnN0IGR5bmFtaWNJbmRpdlF1ZXVlQXJuID0gbmV3IFN0cmluZ0NvbmNhdCgpLmpvaW4oaW5kaXZpZHVhbFF1ZXVlLnF1ZXVlQXJuLnRvU3RyaW5nKCksIFwiXCIpXG5cbiAgICBjb25zdCBpbmRpdmlkdWFsUXVldWVQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgZHluYW1pY0luZGl2UXVldWVBcm5cbiAgICAgIF0sXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIFwic3FzOkRlbGV0ZU1lc3NhZ2VcIixcbiAgICAgICAgXCJzcXM6UmVjZWl2ZU1lc3NhZ2VcIixcbiAgICAgICAgXCJzcXM6U2VuZE1lc3NhZ2VcIixcbiAgICAgICAgXCJzcXM6R2V0UXVldWVBdHRyaWJ1dGVzXCJcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBpYW0gcm9sZVxuICAgIGNvbnN0IGFjY2Vzc1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ2lvdEFjY2Vzc1JvbGUnLCB7XG4gICAgICByb2xlTmFtZTogJ2lvdC1hY2Nlc3Mtcm9sZScsXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnY3JlZGVudGlhbHMuaW90LmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1heFNlc3Npb25EdXJhdGlvbjogRHVyYXRpb24uaG91cnMoMTIpLFxuICAgIH0pO1xuXG4gICAgYWNjZXNzUm9sZS5hZGRUb1BvbGljeShnZW5lcmFsQnVja2V0UG9saWN5KTtcbiAgICBhY2Nlc3NSb2xlLmFkZFRvUG9saWN5KGluZGl2aWR1YWxCdWNrZXRQb2xpY3kpO1xuICAgIGFjY2Vzc1JvbGUuYWRkVG9Qb2xpY3koZ2VuZXJhbFF1ZXVlUG9saWN5KTtcbiAgICBhY2Nlc3NSb2xlLmFkZFRvUG9saWN5KGluZGl2aWR1YWxRdWV1ZVBvbGljeSk7XG4gIH1cbn1cbiJdfQ==