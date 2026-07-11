import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('SavedArchitectures')

def lambda_handler(event, context):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
        
    try:
        # Scan DynamoDB table (fine for simple history view at hackathon scale)
        response = table.scan(Limit=50)
        items = response.get('Items', [])
        
        # Sort client-side / lambda-side by created_at descending
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(items)
        }
    except Exception as e:
        print(f"Error scanning DynamoDB: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
