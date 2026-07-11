import os
import zipfile
import json
import time
import boto3
from botocore.exceptions import ClientError

# Use the named profile specifically requested
session = boto3.Session(profile_name='cloudblueprint', region_name='us-east-1')

iam_client = session.client('iam')
dynamodb_client = session.client('dynamodb')
lambda_client = session.client('lambda')
apigateway_client = session.client('apigateway')

ROLE_NAME = "CloudBlueprintExecutionRole"
TABLE_NAME = "SavedArchitectures"

def zip_directory(path, zip_name):
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.endswith('.py'):
                    zipf.write(os.path.join(root, file), file)

def create_execution_role():
    print("Creating IAM Execution Role...")
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    try:
        role = iam_client.create_role(
            RoleName=ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        role_arn = role['Role']['Arn']
        print(f"Role created: {role_arn}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'EntityAlreadyExists':
            role = iam_client.get_role(RoleName=ROLE_NAME)
            role_arn = role['Role']['Arn']
            print(f"Role already exists: {role_arn}")
        else:
            raise e

    # Attach basic policies for Lambda, DynamoDB and Bedrock Nova
    policies = [
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
        "arn:aws:iam::aws:policy/AmazonBedrockFullAccess" # Allows Lambda to invoke Bedrock Nova
    ]
    for policy in policies:
        iam_client.attach_role_policy(RoleName=ROLE_NAME, PolicyArn=policy)
    
    # Wait for IAM role replication
    print("Waiting 10s for IAM propagation...")
    time.sleep(10)
    return role_arn

def create_dynamodb_table():
    print("Creating DynamoDB table SavedArchitectures...")
    try:
        dynamodb_client.create_table(
            TableName=TABLE_NAME,
            KeySchema=[{"AttributeName": "arch_id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "arch_id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST"
        )
        print("Table creation initiated.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Table already exists.")
        else:
            raise e

def deploy_lambda(name, handler, zip_path, role_arn):
    print(f"Deploying Lambda function: {name}...")
    with open(zip_path, 'rb') as f:
        zipped_code = f.read()

    try:
        lambda_client.create_function(
            FunctionName=name,
            Runtime='python3.12',
            Role=role_arn,
            Handler=handler,
            Code={'ZipFile': zipped_code},
            Description=f'CloudBlueprint {name} function',
            Timeout=30,
            MemorySize=256
        )
        print(f"Lambda {name} created successfully.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceConflictException':
            lambda_client.update_function_code(
                FunctionName=name,
                ZipFile=zipped_code
            )
            print(f"Lambda {name} code updated successfully.")
        else:
            raise e

def setup_api_gateway():
    print("Setting up API Gateway Rest API...")
    
    # Check if API exists
    apis = apigateway_client.get_rest_apis().get('items', [])
    api_id = None
    for api in apis:
        if api['name'] == 'CloudBlueprintAPI':
            api_id = api['id']
            break
            
    if not api_id:
        new_api = apigateway_client.create_rest_api(
            name='CloudBlueprintAPI',
            description='API for CloudBlueprint application',
            endpointConfiguration={'types': ['REGIONAL']}
        )
        api_id = new_api['id']
        print(f"Created API Gateway: {api_id}")
    else:
        print(f"API Gateway already exists: {api_id}")

    # Root resource
    resources = apigateway_client.get_resources(restApiId=api_id)['items']
    root_id = [r['id'] for r in resources if r['path'] == '/'][0]

    # Setup /generate resource
    setup_route(api_id, root_id, "generate", "POST", "GeneratorFunction")
    # Setup /history resource
    setup_route(api_id, root_id, "history", "GET", "HistoryFunction")

    # Deploy API
    apigateway_client.create_deployment(
        restApiId=api_id,
        stageName='Prod'
    )
    
    region = session.region_name
    api_url = f"https://{api_id}.execute-api.{region}.amazonaws.com/Prod/"
    print(f"\nAPI Gateway fully deployed! Live URL: {api_url}")
    return api_url

def setup_route(api_id, parent_id, path_part, method, lambda_name):
    # Check if resource exists
    resources = apigateway_client.get_resources(restApiId=api_id)['items']
    res_id = None
    for r in resources:
        if r.get('pathPart') == path_part:
            res_id = r['id']
            break
            
    if not res_id:
        res = apigateway_client.create_resource(
            restApiId=api_id,
            parentId=parent_id,
            pathPart=path_part
        )
        res_id = res['id']

    # Setup Method
    try:
        apigateway_client.put_method(
            restApiId=api_id,
            resourceId=res_id,
            httpMethod=method,
            authorizationType='NONE'
        )
    except ClientError as e:
        if e.response['Error']['Code'] != 'ConflictException':
            raise e

    # Setup Integration
    region = session.region_name
    account_id = session.client('sts').get_caller_identity()['Account']
    lambda_arn = f"arn:aws:lambda:{region}:{account_id}:function:{lambda_name}"
    
    uri = f"arn:aws:apigateway:{region}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations"
    
    apigateway_client.put_integration(
        restApiId=api_id,
        resourceId=res_id,
        httpMethod=method,
        type='AWS_PROXY',
        integrationHttpMethod='POST',
        uri=uri
    )

    # Lambda Permission to allow API Gateway invocation
    try:
        lambda_client.add_permission(
            FunctionName=lambda_name,
            StatementId=f"apigateway-invoke-{path_part}",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{region}:{account_id}:{api_id}/*/{method}/{path_part}"
        )
    except ClientError as e:
        if e.response['Error']['Code'] != 'ResourceConflictException':
            raise e

    # Setup OPTIONS Method for CORS
    try:
        apigateway_client.put_method(
            restApiId=api_id,
            resourceId=res_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )
        apigateway_client.put_integration(
            restApiId=api_id,
            resourceId=res_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={"application/json": "{\"statusCode\": 200}"}
        )
        apigateway_client.put_method_response(
            restApiId=api_id,
            resourceId=res_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseModels={"application/json": "Empty"},
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Origin': True
            }
        )
        apigateway_client.put_integration_response(
            restApiId=api_id,
            resourceId=res_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseTemplates={"application/json": ""},
            responseParameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': f"'{method},OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            }
        )
    except ClientError as e:
        if e.response['Error']['Code'] != 'ConflictException':
            raise e

def deploy_frontend_to_s3():
    print("Setting up S3 bucket for static hosting...")
    s3_client = session.client('s3')
    
    # Generate unique bucket name based on account ID
    account_id = session.client('sts').get_caller_identity()['Account']
    bucket_name = f"cloudblueprint-frontend-{account_id}"
    
    try:
        s3_client.create_bucket(Bucket=bucket_name)
        print(f"Created S3 bucket: {bucket_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'BucketAlreadyOwnedByYou':
            print(f"Bucket already exists and owned by you: {bucket_name}")
        else:
            raise e

    # Configure website hosting properties
    s3_client.put_bucket_website(
        Bucket=bucket_name,
        WebsiteConfiguration={
            'IndexDocument': {'Suffix': 'index.html'},
            'ErrorDocument': {'Key': 'index.html'}
        }
    )

    # Configure public access block (remove blocking rules)
    s3_client.put_public_access_block(
        Bucket=bucket_name,
        PublicAccessBlockConfiguration={
            'BlockPublicAcls': False,
            'IgnorePublicAcls': False,
            'BlockPublicPolicy': False,
            'RestrictPublicBuckets': False
        }
    )

    # Set Bucket Policy to allow Public Read
    bucket_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            }
        ]
    }
    s3_client.put_bucket_policy(
        Bucket=bucket_name,
        Policy=json.dumps(bucket_policy)
    )

    # Upload frontend files (index.html, index.css, app.js)
    frontend_dir = 'frontend'
    content_types = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript'
    }

    for file_name in os.listdir(frontend_dir):
        file_path = os.path.join(frontend_dir, file_name)
        if os.path.isfile(file_path):
            ext = file_name.split('.')[-1]
            content_type = content_types.get(ext, 'binary/octet-stream')
            
            print(f"Uploading {file_name} to S3...")
            with open(file_path, 'rb') as f:
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=file_name,
                    Body=f,
                    ContentType=content_type
                )

    live_site_url = f"http://{bucket_name}.s3-website-{session.region_name}.amazonaws.com"
    print(f"\nFrontend fully deployed to S3! Live URL: {live_site_url}")
    return live_site_url

def main():
    print("Starting CloudBlueprint AWS Deployment...\n")
    
    # 1. Package Lambdas
    zip_directory('backend/generator', 'generator.zip')
    zip_directory('backend/history', 'history.zip')
    
    # 2. IAM setup
    role_arn = create_execution_role()
    
    # 3. DynamoDB
    create_dynamodb_table()
    
    # 4. Deploy functions
    deploy_lambda('GeneratorFunction', 'lambda_function.lambda_handler', 'generator.zip', role_arn)
    deploy_lambda('HistoryFunction', 'lambda_function.lambda_handler', 'history.zip', role_arn)
    
    # 5. API Gateway
    api_url = setup_api_gateway()
    
    # 6. S3 Static Web Deployment
    live_site_url = deploy_frontend_to_s3()
    
    # Cleanup zip files
    if os.path.exists('generator.zip'): os.remove('generator.zip')
    if os.path.exists('history.zip'): os.remove('history.zip')
    
    print("\nBackend and Frontend deployment complete!")

if __name__ == "__main__":
    main()
