# IoT Credentials Provider for bulk devices

This is a project to test bulk devices with IoT Credentials Provider.

Deployment will use AWS CDK. Follow the steps below to get started.

## Prerequisites
- Install CDK and run npm install
```

sudo yum install jq
```
- export related values to environment
```
# change to your preferred region accordingly
export AWS_REGION=ap-southeast-1
# substitute {accountID} with your account ID 
export S3_BUCKET={accountID}-iot-provisioning-bucket
```
- `cdk bootstrap`
- BEFORE cdk deploy, change the owner-arn of the cloud9 environment

## Resources provisioned
- AWS Cloud9 instance provides terminal access, editor, awscli
- S3 Buckets required for Bulk Provisioning and testing
- VPC with public subnet + Security Group
- IAM Role required for provisioning scenarios and testing

## Deploy
- `cdk synth`
- `cdk deploy`
- get provisionined iot-provisioining-role arn and export to cloud9 environment
`export ARN_IOT_PROVISIONING_ROLE={sub 'iot-provisioning-role' ARN from your account}` //get from IAM > Role > iot-provisioning-role

## Complete the remaining provisioining of certificates and registration to IoT Core
### Bulk create certificates
- Open Cloud9 environment created for you. `cd provisioning-template/provisioning`
- Create keys and certificate signing requests (CSRs) and upload to s3 provisioning bucket
```
# We have 2 buckets to test for 2 different locations, "location-123" and "location-456"
THING_NAME=location-12

# number of things to create
NUM_THINGS=8

sh mk-bulk.sh $THING_NAME $NUM_THINGS
```
- You will notice Keys, CSRs and the file bulk.json are created in a directory with the naming-scheme `$THING_NAME-YYYY-mm-dd_H-M-S` in your Cloud9 environment

```
# cd to the directory where keys/CSRs where created
cd $THING_NAME-YYYY-mm-dd_H-M-S

# copy bulk.json to S3
aws s3 cp bulk.json s3://$S3_BUCKET/

# verify that the file was copied
aws s3 ls s3://$S3_BUCKET/
```
### Create thing type, group and register things in bulk with IoT Core
- Create a bulk thing registration task
```
aws iot create-thing-type \
    --thing-type-name "server-type"

aws iot create-thing-group \
    --thing-group-name server-group

aws iot start-thing-registration-task \
  --template-body file://../templateBody.json \
  --input-file-bucket $S3_BUCKET \
  --input-file-key bulk.json --role-arn $ARN_IOT_PROVISIONING_ROLE

```

- When successful the command returns a taskId. The output looks similar to:
```
 "taskId": "ef76b9b0-53d4-4f7c-b4f9-0c103030743e"
```

### Track your tasks and get results to store your .crt files for successful tasks 
- Assign the taskId to a shell variable. Use of the subsequent commands will be easier.
```
TASK_ID=[YOUR_TASK_ID_FROM_THE_OUTPUT_ABOVE]
```

- Find out if your task succeeded with result output or having errors with the following (Try a few times until you get a long string output of `"resourceLinks"` from either `ERRORS` or `RESULTS`):
```
aws iot list-thing-registration-task-reports \
  --report-type ERRORS --task-id $TASK_ID

aws iot list-thing-registration-task-reports \
  --report-type RESULTS --task-id $TASK_ID		
```

- If you encounter errors use the following command to download the error messages. They are stored in the file errors.json. Examine the messages and solve the root cause.
```
# cd to `$THING_NAME-YYYY-mm-dd_H-M-S` folder
wget -O errors.json $(aws iot list-thing-registration-task-reports --task-id $TASK_ID --report-type ERRORS | jq -r '.resourceLinks[]')
```

- If you get output from the report-type RESULTS from the command above you can download the output for this command from a URL. The output will be stored in the file results.json
```
# cd to `$THING_NAME-YYYY-mm-dd_H-M-S` folder
wget -O results.json $(aws iot list-thing-registration-task-reports --task-id $TASK_ID --report-type RESULTS | jq -r '.resourceLinks[]')
```

- Take a look at the file results.json
- Write all the certificates from the file results.json to files for the related thing. Do it on your own or use a python script that we have prepared for you (from your directory where you stored `results.json`):
```
# cd to `$THING_NAME-YYYY-mm-dd_H-M-S` folder
python3 ../bulk-result.py results.json
```
- You will see something like this below. If you open the directory of where you stored your CSRs and keys `$THING_NAME-YYYY-mm-dd_H-M-S` , you will notice all respective `.crt` files have been stored in the same directory. You will need these to get the credential tokens.
```
creating file location-121.crt for thing location-121
creating file location-122.crt for thing location-122
creating file location-123.crt for thing location-123
creating file location-124.crt for thing location-124
creating file location-125.crt for thing location-125
creating file location-126.crt for thing location-126
creating file location-127.crt for thing location-127
creating file location-128.crt for thing location-128
```

## Get IoT endpoint and test credentials and assumption of roles
- Run the following command in the AWS CLI to obtain your AWS account-specific endpoint for the credentials provider. See the [DescribeEndpoint](https://docs.aws.amazon.com/iot/latest/apireference/API_DescribeEndpoint.html) API documentation for further details.
```
aws iot describe-endpoint --endpoint-type iot:CredentialProvider

# Sample output
{
    "endpointAddress": "<your_aws_account_specific_prefix>.credentials.iot.ap-southeast-1.amazonaws.com"
}
```

## Test cases
- make an HTTPS request to the credentials provider to fetch a security token
```
curl --cert {thingName}.crt --key {thingName}.key -H "x-amzn-iot-thingname: {thingName}" https://{your_aws_account_specific_prefix}.credentials.iot.{AWS_REGION}.amazonaws.com/role-aliases/{iot_role_alias_name}/credentials

# You will get a long json output for credentials
```
- assume role by using the returned token credentials
```
## Assume the IoT role
export AWS_ACCESS_KEY_ID=<access-key-id> 
export AWS_SECRET_ACCESS_KEY=<secret-access-key> 
export AWS_SESSION_TOKEN=<session-token>
```
- to test s3 bucket, copy a sample test.txt file provided for you with respective buckets
- to test sqs queue, send a message to the respective queues

More details of respective cases as below:


## Other Notes

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
