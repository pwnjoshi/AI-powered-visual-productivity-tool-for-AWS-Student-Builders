import json
import uuid
import datetime
import urllib.request
import urllib.error
import boto3
import os
import base64

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SavedArchitectures')
ssm = boto3.client('ssm')

# Dynamically retrieve credentials from AWS Systems Manager (SSM) Parameter Store
def get_secure_parameter(param_name, env_fallback):
    try:
        # Fetch decrypted parameter from SSM
        response = ssm.get_parameter(Name=param_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"SSM Fetch failed for {param_name}, falling back to Environment: {e}")
        return os.environ.get(env_fallback, "")

NEBIUS_API_KEY = get_secure_parameter("/cloudblueprint/nebius_api_key", "NEBIUS_API_KEY")
NEBIUS_URL = "https://api.tokenfactory.nebius.com/v1/chat/completions"

BEDROCK_API_KEY = get_secure_parameter("/cloudblueprint/bedrock_api_key", "BEDROCK_API_KEY")
BEDROCK_OPENAI_URL = "https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions"
BEDROCK_MODEL = "us.amazon.nova-2-lite-v1:0"

SYSTEM_PROMPT = """You are CloudBlueprint, an expert AWS Solutions Architect assistant.
Your task is to take a user's project idea and recommend a suitable AWS architecture.

Ensure the architecture is fully detailed and production-ready. Recommend all necessary components for a production application:
- Hosting/CDN layer (e.g., S3, Amplify, CloudFront)
- API/Routing layer (e.g., API Gateway, Route 53)
- Compute layer (e.g., Lambda, ECS, Fargate)
- Auth & Security layer (e.g., Cognito, IAM, Secrets Manager)
- Database & Storage layer (e.g., DynamoDB, RDS, S3)
- Integration & Monitoring layer (e.g., SNS, SQS, CloudWatch)

For the cost estimate: DO NOT output broad ranges like "~$100-$500/month". Instead, calculate a realistic, granular monthly cost estimate based on the recommended services (e.g., "Free tier eligible", "DynamoDB: ~$0.59/mo, Lambda: ~$1.20/mo (Total: ~$1.79/mo)", "ECS/Fargate + RDS Aurora: ~$34.50/mo").

You must return ONLY a JSON object and nothing else. No markdown wrapping (like ```json), no preamble, no explanations outside the JSON.
The JSON must follow this exact shape:
{
  "services": ["ServiceA", "ServiceB", "ServiceC"],
  "architecture_summary": "A short, one-paragraph explanation of how the pieces connect and work.",
  "build_steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "complexity": "Beginner | Intermediate | Advanced",
  "estimated_monthly_cost": "Granular service cost breakdown..."
}
"""

def lambda_handler(event, context):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    try:
        # Load request body
        body = json.loads(event.get('body', '{}'))
        idea = body.get('idea', '').strip()
        
        if not idea:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Project idea is required'})
            }

        selected_model = body.get('model', 'gemma')
        refine_mode = body.get('refine', False)
        
        if refine_mode:
            refine_system_prompt = "You are a prompt engineering expert. Take the user's project idea and rewrite it into a clear, detailed, and professional project description that specifies functional requirements, user interactions, and components. Return ONLY the refined description paragraph. Do not include any introduction, explanations, formatting, or markdown code blocks."
            
            if selected_model == 'bedrock':
                try:
                    payload = {
                        "model": BEDROCK_MODEL,
                        "messages": [
                            {"role": "system", "content": refine_system_prompt},
                            {"role": "user", "content": f"Refine this project idea: {idea}"}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 500
                    }
                    req = urllib.request.Request(
                        BEDROCK_OPENAI_URL,
                        data=json.dumps(payload).encode('utf-8'),
                        headers={
                            "Authorization": f"Bearer {BEDROCK_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        method='POST'
                    )
                    with urllib.request.urlopen(req) as response:
                        res_body = json.loads(response.read().decode('utf-8'))
                        refined_text = res_body['choices'][0]['message']['content'].strip()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'refined_idea': refined_text})
                    }
                except Exception as bedrock_refine_err:
                    print(f"Bedrock refine failed, falling back to Gemma: {bedrock_refine_err}")
                    # Fall through to Gemma below
            
            # Gemma fallback / default
            payload = {
                "model": "google/gemma-3-27b-it",
                "messages": [
                    {"role": "system", "content": refine_system_prompt},
                    {"role": "user", "content": f"Refine this project idea: {idea}"}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            req = urllib.request.Request(
                NEBIUS_URL,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    "Authorization": f"Bearer {NEBIUS_API_KEY}",
                    "Content-Type": "application/json"
                },
                method='POST'
            )
            try:
                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode('utf-8'))
                    refined_text = res_body['choices'][0]['message']['content'].strip()
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'refined_idea': refined_text})
                }
            except Exception as re:
                raise Exception(f"Failed to refine prompt: {re}")

        raw_text = None
        
        if selected_model == 'bedrock':
            try:
                payload = {
                    "model": BEDROCK_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": idea}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1000
                }
                req = urllib.request.Request(
                    BEDROCK_OPENAI_URL,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={
                        "Authorization": f"Bearer {BEDROCK_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    method='POST'
                )
                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode('utf-8'))
                    raw_text = res_body['choices'][0]['message']['content'].strip()
            except Exception as bedrock_err:
                print(f"Bedrock invocation failed, falling back to Gemma: {bedrock_err}")
                # Fall through to Gemma instead of throwing an error

        if not raw_text:
            # Request payload for Gemma 3 27B model
            payload = {
                "model": "google/gemma-3-27b-it",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": idea}
                ],
                "temperature": 0.2,
                "max_tokens": 1000
            }

            req = urllib.request.Request(
                NEBIUS_URL,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    "Authorization": f"Bearer {NEBIUS_API_KEY}",
                    "Content-Type": "application/json"
                },
                method='POST'
            )

            try:
                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode('utf-8'))
                    raw_text = res_body['choices'][0]['message']['content'].strip()
            except urllib.error.HTTPError as he:
                error_details = he.read().decode('utf-8')
                print(f"Nebius HTTP Error: {error_details}")
                raise Exception(f"Nebius API returned status {he.code}: {error_details}")

        # Clean markdown code blocks if the model returned them
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()
        
        result = json.loads(raw_text)
        
        # Fetch client metrics from API Gateway request context / headers
        request_context = event.get('requestContext', {})
        identity = request_context.get('identity', {})
        
        # IP Address
        client_ip = identity.get('sourceIp', 'unknown-ip')
        if client_ip == 'unknown-ip' and 'headers' in event:
            client_ip = event['headers'].get('X-Forwarded-For', event['headers'].get('x-forwarded-for', 'unknown-ip'))
            
        # User Agent (browser & OS info)
        user_agent = identity.get('userAgent', 'unknown-agent')
        if user_agent == 'unknown-agent' and 'headers' in event:
            user_agent = event['headers'].get('User-Agent', event['headers'].get('user-agent', 'unknown-agent'))

        # Fetch custom user identifier / country if forwarded by API Gateway/CloudFront
        client_country = 'unknown-country'
        if 'headers' in event:
            client_country = event['headers'].get('CloudFront-Viewer-Country', event['headers'].get('cloudfront-viewer-country', 'unknown-country'))

        # Hydrate with UUID, Timestamp, and Metrics Metadata
        arch_id = str(uuid.uuid4())
        created_at = datetime.datetime.utcnow().isoformat() + 'Z'
        
        result['arch_id'] = arch_id
        result['idea_text'] = idea
        result['created_at'] = created_at
        result['client_ip'] = client_ip
        result['user_agent'] = user_agent
        result['client_country'] = client_country
        result['selected_model'] = selected_model
        
        # Save to DynamoDB
        table.put_item(Item=result)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error handling generator: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
