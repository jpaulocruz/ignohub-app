import json

with open('/Users/macbook/.gemini/antigravity/brain/c29d4792-4cac-4968-86f2-77a1ba1d124f/.system_generated/steps/5924/output.txt', 'r') as f:
    data = json.load(f)

for event in data.get('result', []):
    msg = event.get('event_message', '')
    if event.get('status_code') == 500 or 'error' in msg.lower():
        print(f"Timestamp: {event.get('timestamp')}")
        print(f"Function: {event.get('function_id')}")
        print(f"Message: {msg}")
        print("-" * 20)
