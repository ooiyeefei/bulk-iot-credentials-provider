import { RemovalPolicy, Stack, StackProps, StringConcat, Fn, Duration, CfnOutput, aws_cloud9 as cloud9, SecretValue, aws_iot as iot } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
// import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { userInfo } from 'os';
// import * as path from 'path';
// import * as cloud9 from '@aws-cdk/aws-cloud9-alpha';

export class BulkIotCredentialsProviderStack extends Stack {
  s3Bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // s3 buckets
    // S3 bucket to store certificates and keys
    const provisioningBucket = new s3.Bucket(this, 'iotProvisioningS3Bucket', {
      versioned: false,
      bucketName: `${this.account}-iot-provisioning-bucket`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // uploading local provisioning files to s3 bucket
    // new s3deploy.BucketDeployment(this, 'BucketDeployment', {
    //   sources: [s3deploy.Source.asset(path.join(__dirname, '../provisioning'))],
    //   destinationBucket: provisioningBucket,
    // });

    // test resources provisioning
    // s3 buckets
    const generalBucket = new s3.Bucket(this, 'iotGeneralS3Bucket', {
      versioned: false,
      bucketName: `${this.account}-iot-bucket-general`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const customerBucketAbc = new s3.Bucket(this, 'iotCustomerS3BucketAbc', {
      versioned: false,
      bucketName: `${this.account}-iot-bucket-server-type`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const locationBucket123 = new s3.Bucket(this, 'iotLocationS3Bucket123', {
      versioned: false,
      bucketName: `${this.account}-iot-bucket-location-123`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const locationBucket456 = new s3.Bucket(this, 'iotLocationS3Bucket456', {
      versioned: false,
      bucketName: `${this.account}-iot-bucket-location-456`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // sqs 
    const generalQueue = new sqs.Queue(this, 'iotGeneralQueue', {
      queueName: `${this.account}-iot-queue-general`,
    });

    const individualQueue = new sqs.Queue(this, 'iotIndivQueue', {
      queueName: `${this.account}-iot-queue-location-123`,
    });

    // iam policies
    // s3 bucket policies
    const generalBucketPolicy = new iam.Policy(this, 'iotGeneralBucketPolicy', {
      policyName: 'iotGeneralBucketPolicy',
      statements: [
        new iam.PolicyStatement({
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
        }),
        new iam.PolicyStatement({
          resources: ["*"],
          actions: ["s3:ListAllMyBuckets"],
        }),
      ],
    });

    //   {
    //     "Version": "2012-10-17",
    //     "Statement": [
    //         {
    //             "Action": [
    //                 "s3:DeleteObject",
    //                 "s3:GetObject",
    //                 "s3:ListBucket",
    //                 "s3:PutObject"
    //             ],
    //             "Resource": [
    //                 "arn:aws:s3:::122852224663-iot-bucket-${credentials-iot:ThingName}",
    //                 "arn:aws:s3:::122852224663-iot-bucket-${credentials-iot:ThingName}/*",
    //                 "arn:aws:s3:::122852224663-iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}",
    //                 "arn:aws:s3:::122852224663-iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}/*"
    //             ],
    //             "Effect": "Allow"
    //         }
    //     ]
    // }
    const bucket_name_trunc = Fn.split('iot-bucket-', generalBucket.bucketArn.toString());

    // const bucket_resource = new StringConcat().join(bucket_name_trunc[0], "iot-bucket-${credentials-iot:ThingName}/*");

    const individualBucketPolicy = new iam.Policy(this, 'iotIndividualBucketPolicy', {
      policyName: 'iotIndividualBucketPolicy',
      statements: [
        new iam.PolicyStatement({
          resources: [
            Fn.join('', [Fn.select(0, bucket_name_trunc), "iot-bucket-${credentials-iot:ThingName}/*"]),
            Fn.join('', [Fn.select(0, bucket_name_trunc), "iot-bucket-${credentials-iot:ThingName}"]),
            Fn.join('', [Fn.select(0, bucket_name_trunc), "iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}/*"]),
            Fn.join('', [Fn.select(0, bucket_name_trunc), "iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}"]),
            // "arn:aws:s3:::iot-bucket-${credentials-iot:ThingName}/*",
            // "arn:aws:s3:::iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}/*",
            // "arn:aws:s3:::iot-bucket-${credentials-iot:ThingName}",
            // "arn:aws:s3:::iot-bucket-${credentials-iot:ThingTypeName}/${credentials-iot:ThingName}"
          ],
          actions: [
            "s3:PutObject",
            "s3:GetObject",
            "s3:ListBucket",
            "s3:DeleteObject"
          ]
        })
      ]
    });

    // sqs bucket policies
    const generalQueuePolicy = new iam.Policy(this, 'iotGeneralQueuePolicy', {
      policyName: 'iotGeneralQueuePolicy',
      statements: [
        new iam.PolicyStatement({
          resources: [
            generalQueue.queueArn,
          ],
          actions: [
            "sqs:DeleteMessage",
            "sqs:ReceiveMessage",
            "sqs:SendMessage",
            "sqs:GetQueueAttributes"
          ],
        }),
        new iam.PolicyStatement({
          resources: ["*"],
          actions: ["sqs:ListQueues"],
        })
      ]
    });

    // const dynamicIndivQueueArn = new StringConcat().join(individualQueue.queueArn.toString(), "")

    const individualQueuePolicy = new iam.Policy(this, 'iotIndividualQueuePolicy', {
      policyName: 'iotIndividualQueuePolicy',
      statements: [new iam.PolicyStatement({
        resources: [
          `arn:aws:sqs:${this.region}:${this.account}:${this.account}-iot-queue-\${credentials-iot:ThingName}`
        ],
        actions: [
          "sqs:DeleteMessage",
          "sqs:ReceiveMessage",
          "sqs:SendMessage",
          "sqs:GetQueueAttributes"
        ],
      })
      ]
    });

    // iot provisioning role policies
    const iotProvisioningPolicy = new iam.Policy(this, 'iotProvisioningPolicy', {
      policyName: 'iotProvisioningPolicy',
      statements: [
        new iam.PolicyStatement({
          actions: [
            "iotsitewise:BatchPutAssetPropertyValue",
            "iotanalytics:BatchPutMessage",
            "iotevents:BatchPutMessage"
          ],
          resources: ["*"],
        }),
      ],
    });


    // iam role
    const accessRole = new iam.Role(this, 'iotAccessRole', {
      roleName: 'iot-access-role',
      assumedBy: new iam.ServicePrincipal('credentials.iot.amazonaws.com'),
      maxSessionDuration: Duration.hours(12),
    });

    accessRole.attachInlinePolicy(generalBucketPolicy);
    accessRole.attachInlinePolicy(individualBucketPolicy);
    accessRole.attachInlinePolicy(generalQueuePolicy);
    accessRole.attachInlinePolicy(individualQueuePolicy);

    const c9IamRole = new iam.Role(this, 'C9IamRole', {
      roleName: 'cloud9-admin-access-role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ]
    });

    const BatchPutMessagePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: [
            "iotsitewise:BatchPutAssetPropertyValue",
            "iotanalytics:BatchPutMessage",
            "iotevents:BatchPutMessage"
          ],
        }),
      ],
    });

    const iotProvisioningRole = new iam.Role(this, 'iotProvisioningRole', {
      roleName: 'iot-provisioning-role',
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
      maxSessionDuration: Duration.hours(12),
      inlinePolicies: {
        BatchPutMessage: BatchPutMessagePolicy,
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSIoTRuleActions'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSIoTLogging'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSIoTThingsRegistration'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });

    iotProvisioningRole.attachInlinePolicy(iotProvisioningPolicy);

    // pass role policy to roles
    const passRolePolicy = new iam.PolicyStatement({
      resources: [
        accessRole.roleArn,
      ],
      actions: [
        "iam:GetRole",
        "iam:PassRole",
      ],
    });

    const iotDeployer = new iam.User(this, 'iotDeployer', {
      userName: 'iot-deployer',
      password: SecretValue.unsafePlainText('i0t-deployer-p@33w0rd'),
    });

    iotDeployer.addToPolicy(passRolePolicy);

    // iot access and roles
    const iotRoleAlias = new iot.CfnRoleAlias(this, 'iotRoleAlias', {
      roleAlias: 'server-access-role-alias',
      roleArn: accessRole.roleArn,
      credentialDurationSeconds: 43200,
    });

    const iotAssumeRolePolicy = new iot.CfnPolicy(this, 'iotAssumeRolePolicy', {
      policyName: 'iotAssumeRolePolicy',
      policyDocument: {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": "iot:AssumeRoleWithCertificate",
            "Resource": iotRoleAlias.attrRoleAliasArn.toString(),
          }
        ]
      },
    });

    // const c9InstanceProfile = new iam.CfnInstanceProfile(this, 'C9InstanceProfile', {
    //   roles: [c9IamRole.roleName],
    // });

    // create a cloud9 ec2 environment in a new VPC
    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 3 });
    // const c9Instance = new ec2.Instance(this, 'C9Instance', {
    //   vpc,
    //   machineImage: new ec2.AmazonLinuxImage(),
    //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
    // });

    // c9Instance.instance.iamInstanceProfile = c9InstanceProfile.toString();

    const c9Env = new cloud9.CfnEnvironmentEC2(this, 'Cloud9Env', {
      instanceType: 't3.micro',
      ownerArn: "{subsitute your assumed role arn}",
      subnetId: vpc.publicSubnets[0].subnetId,
      repositories: [{
        pathComponent: 'bulk-iot-credentials',
        repositoryUrl: 'https://github.com/ooiyeefei/bulk-iot-credentials-provider.git',
      }],
    });

    // const provisioningTemplateBody = {
    //   "Parameters": {
    //     "ThingName": {
    //       "Type": "String"
    //     },
    //     "ThingTypeName": {
    //       "Type": "String"
    //     },
    //     "ThingGroups": {
    //       "Type": "String"
    //     },
    //     "CSR": {
    //       "Type": "String"
    //     },
    //   },
    //   "Resources": {
    //     "thing": {
    //       "Type": "AWS::IoT::Thing",
    //       "Properties": {
    //         "ThingName": { "Ref": "ThingName" },
    //         "ThingTypeName": "server-type",
    //         "ThingGroups": [
    //           "server-group",
    //         ]
    //       }
    //     },
    //     "certificate": {
    //       "Type": "AWS::IoT::Certificate",
    //       "Properties": {
    //         "CertificateSigningRequest": { "Ref": "CSR" },
    //         CertificateId: {
    //           Ref: 'AWS::IoT::Certificate::Id',
    //         },
    //         "Status": "ACTIVE"
    //       }
    //     },
    //     "policy": {
    //       "Type": "AWS::IoT::Policy",
    //       "Properties": {
    //         "PolicyName": iotAssumeRolePolicy.toString(),
    //       }
    //     }
    //   }
    // }

    // const provisiongTemplate = new iot.CfnProvisioningTemplate(this, 'iot-provisioning-template', {
    //   provisioningRoleArn: iotProvisioningRole.roleArn,
    //   templateBody: JSON.stringify(provisioningTemplateBody),
    // });

    // print the Cloud9 IDE URL in the output
    // new CfnOutput(this, 'URL', { value: c9Env.getAtt('Url').toString() });
    new CfnOutput(this, 'Bucket', { value: provisioningBucket.bucketArn });
    new CfnOutput(this, 'ProvisioningRole', { value: iotProvisioningRole.roleArn });
    new CfnOutput(this, 'RoleAlias', { value: iotRoleAlias.attrRoleAliasArn });
  }
}
