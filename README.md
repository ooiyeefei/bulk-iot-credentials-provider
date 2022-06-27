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
  - IoT Core provisioning bucket ("{accountID}-iot-provisioning-bucket")
  - For testing 4x buckets
    - {accountID}-iot-bucket-general (all location will have access)
    - {accountID}-iot-bucket-server-type (group by 'Thing type', each location will only have access to their respective prefix)
    - {accountID}-iot-bucket-location-123 (only accessible by thing 'location-123')
    - {accountID}-iot-bucket-location-456 (only accessible by thing 'location-456' have access)
- VPC with public subnet + Security Group (For Cloud9)
- IAM Role required for provisioning scenarios and testing
  - 1x `iot-access-role`, with 4x policies
    - 1x general S3 bucket permission policy
    - 1x general SQS queue permission policy
    - 1x individual S3 bucket dynamic permission policy
    - 1x individual SQS queue dynamic permission policy
- IoT core
  - Things - naming convention
    - Thing type = all default to 'server-type'
    - Thing group = all default to 'server-group'
    - Thing = location ID (e.g. location-123, location-456)
  - 1x IoT role aliases (`server-access-role-alias`) - alias to the above IAM role `iot-access-role` **credential-duration-seconds 43200 (must be equal or lower than IAM roles max duration)
  - 1x IoT policy (`iotAssumeRolePolicy`) - allowing `iot:AssumeRoleWithCertificate` for `server-access-role-alias`


## Deploy CDK stack
- please ensure you have installed and setup AWS CDK (V2) https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html `npm install aws-cdk-lib`
- `cdk synth`
- `cdk deploy`
- get provisionined iot-provisioining-role arn and export to cloud9 environment
`export ARN_IOT_PROVISIONING_ROLE={sub 'iot-provisioning-role' ARN from your account}` //get from IAM > Role > iot-provisioning-role

## Complete the remaining provisioining of certificates and registration to IoT Core
### Bulk create certificates for location-12x
- Open Cloud9 environment created for you and change directory to "provisioning" folder > `cd provisioning`
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

### Repeat to bulk create certificates for location-45x
```
# change directory out from the folder storing certs and keys for location-12x
cd ..
THING_NAME=location-45

# number of things to create
NUM_THINGS=8

sh mk-bulk.sh $THING_NAME $NUM_THINGS
```

- You will notice a new folder is created for Keys, CSRs and the file bulk.json are created in a directory with the naming-scheme `$THING_NAME-YYYY-mm-dd_H-M-S` in your Cloud9 environment
```
# cd to the directory where keys/CSRs where created for location-45x
cd $THING_NAME-YYYY-mm-dd_H-M-S

# copy bulk.json to S3
aws s3 cp bulk.json s3://$S3_BUCKET/

# verify that the file was copied
aws s3 ls s3://$S3_BUCKET/
```

### Create thing type, group and register things in bulk with IoT Core
- Create a bulk thing registration task
```
# Note: you don't have to create thing-type and thing-group since we have created that first time.

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
creating file location-121.crt for thing location-451
creating file location-122.crt for thing location-452
creating file location-123.crt for thing location-453
creating file location-124.crt for thing location-454
creating file location-125.crt for thing location-455
creating file location-126.crt for thing location-456
creating file location-127.crt for thing location-457
creating file location-128.crt for thing location-458
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

## Check your assumed role
aws sts get-caller-identity

## Should get the iot-role-alias role as output
{
    "UserId": "XXXXXXXXXXXXXXXXX",
    "Account": "{accountID}",
    "Arn": "arn:aws:sts::{accountID}:assumed-role/iot-access-role/XXXXX"
}
```
- to test s3 bucket, copy a sample test.txt file provided for you with respective buckets
- to test sqs queue, send a message to the respective queues

More details of respective test cases as below:
| No. | Test Case                                                                                                                                                                                                                          | Test actions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Expected result                                                                                                                                | What does this means?                                                                                                                     |
|-----|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
|   1 | Thing without policy to assume IoT credential (under attached certificate)                                                                                                                                                         | curl —cert thingName.crt --key thingName.key -H "x-amzn-iot-thingname: thingName" https://<your_aws_account_specific_prefix>.credentials.iot.eu-west-2.amazonaws.com/role-aliases/server-access-role-alias/credentials                                                                                                                                                                                                                                                                                                                                                                                                                | 'Access denied' when curl with respective .crt and .key to get tokens, because it's without certificate                                        | Thing without certificate is unable to assume role                                                                                        |
|   2 | Showing IoT policy assigned ties strictly with ability to assume role alias (even with same IAM role and policy scope)                                                                                                             | 1) assign location-123 thing with policy that allow access to role alias "server-access-role-alias" but NOT "xxx-role-alias" (even though both aliases are tied to the same IAM role "server-access-role"  2) curl --cert location-123.crt --key location-123.key -H "x-amzn-iot-thingname: location-123" https://xxxxxxxxxx.credentials.iot.{AWS_REGION}.amazonaws.com/role-aliases/server-access-role-alias/credentials  3) curl --cert location-123.crt —key location-123.key -H "x-amzn-iot-thingname: location-123" https://xxxxxxxxxx.credentials.iot.{AWS_REGION}.amazonaws.com/role-aliases/xxx-access-role-alias/credentials | Step 2 with "server-access-role-alias" > Able to generate tokens  Step 3 with "xxx-access-role-alias" > "Access denied"                        | Validating the right policy attaching to respective certificate to allow the thing/ server to assume the right IAM role.                  |
|   3 | S3 bucket access for general bucket                                                                                                                                                                                                | 1) assume into respective location-456 access keys  2) aws s3 cp ../test.txt s3://{accountID}-iot-bucket-general OR use aws s3api put-object   3) aws s3 cp ../test.txt s3://{any-other-bucket}                                                                                                                                                                                                                                                                                                                                                                                                                                       | Step 2 with iot-general-bucket > upload succeeded  Step 3 with other bucket > access denied                                                    | This means the assumed role with the right policy allows the right bucket access                                                          |
|   4 | S3 bucket access with dynamic policies using substitute "${credentials-iot:ThingName}"   - individual location specific bucket                                                                                                     | 1) assume into respective location-456 access keys  2) aws s3 cp ../test.txt s3://{accountID}-iot-bucket-location-456 OR - aws s3api put-object —bucket {accountID}-iot-bucket-location-456 --key test.txt —body ../test.txt  3) aws s3 cp ../test.txt s3://{accountID}-iot-bucket-location-123                                                                                                                                                                                                                                                                                                                                       | Step 2 with prefix location-456 > upload succeeded  Step 3 with prefix location-123 > access denied                                            | This shows the attribute based policy that substitute the thing name to allow access to the specific location bucket                      |
|   5 | S3 bucket access with dynamic policies using substitute "${credentials-iot:ThingName}" and "${credentials-iot:ThingTypeName}"   - thing type (server-type) specific bucket (including multiple location IDs as separated prefixes) | 1) assume into respective location-456 access keys  2) aws s3 cp ../test.txt s3://{accountID}-iot-bucket-server-type/location-456 OR use aws s3api put-object  3) aws s3 cp ../test.txt s3://{accountID}-iot-bucket-server-type/location-123 OR use aws s3api put-object                                                                                                                                                                                                                                                                                                                                                              | Step 2 with prefix location-456 > upload succeeded  Step 3 with prefix location-123 > access denied                                            | This shows the attribute based policy that substitute the thing name to allow access only to the respective prefixes with the same bucket |
|   6 | SQS access to general SQS queue 'iot-queue-general'                                                                                                                                                                                | 1) assume into respective location-456 access keys  2) aws sqs send-message --queue-url {insert iot-queue-general url} --message-body "Test sending to sqs queue."  3) repeat by assuming into other location-xxx access                                                                                                                                                                                                                                                                                                                                                                                                              | Step 2 & 3 can send message successfully with any location ID assumed                                                                          | This means right policy to assume role allow any location to access the general SQS queue                                                 |
|   7 | SQS access with dynamic policies using substitute "${credentials-iot:ThingName}"   - individual SQS queue e.g. 'iot-queue-location-456'                                                                                            | 1) assume into respective location-456 access keys  2) aws sqs send-message --queue-url {insert iot-queue-location-123 url} --message-body "Test sending to sqs queue."  3) repeat by assuming into other location-123 access                                                                                                                                                                                                                                                                                                                                                                                                         | Step 2 assumed location-456 accessing location-123 queue >access denied  Step 3 assumed location-456 accessing location-123 queue > successful | This means that they dynamic policy allows only the respective location ID to access the queue name that has their respective name        |


## Other Notes

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
