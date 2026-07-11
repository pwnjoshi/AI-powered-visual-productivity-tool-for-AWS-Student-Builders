import json
import uuid
import datetime
import urllib.request
import urllib.error
import boto3

# Initialize AWS DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SavedArchitectures')

NEBIUS_API_KEY = "v1.CmQKHHN0YXRpY2tleS1lMDBjYzR4OTF6ZGY4MXduY2cSIXNlcnZpY2VhY2NvdW50LWUwMGF2Z2tjMW1nc2FkMTVtYjIMCK-IyNIGEISn0sYBOgwIrovgnQcQgOr3jAJAAloDZTAw.AAAAAAAAAAER6M_CLvG2FQ-MFFF78sWXsx_Au_YWXB555Uiq7szJP6CcWZFIRpxfUJ-MYxavahCrCpjXen2G08T0U_-iCRsI"
NEBIUS_URL = "https://api.tokenfactory.nebius.com/v1/chat/completions"

SYSTEM_PROMPT = """You are CloudBlueprint, an expert AWS Solutions Architect assistant.
Your task is to take a user's project idea and recommend a suitable AWS architecture.

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
  "estimated_monthly_cost": "Free tier eligible | ~$X/month"
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

        refine_mode = body.get('refine', False)
        
        if refine_mode:
            refine_system_prompt = "You are a prompt engineering expert. Take the user's project idea and rewrite it into a clear, detailed, and professional project description that specifies functional requirements, user interactions, and components. Return ONLY the refined description paragraph. Do not include any introduction, explanations, formatting, or markdown code blocks."
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
        
        # Hydrate with UUID and Timestamp
        arch_id = str(uuid.uuid4())
        created_at = datetime.datetime.utcnow().isoformat() + 'Z'
        
        result['arch_id'] = arch_id
        result['idea_text'] = idea
        result['created_at'] = created_at
        
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
