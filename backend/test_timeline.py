#!/usr/bin/env python3
import httpx
import json

r = httpx.post('http://localhost:8000/api/v1/auth/login', json={'email':'analyst@demo.com','password':'password123'})
token = r.json()['access_token']

headers = {'Authorization': f'Bearer {token}'}
r = httpx.get('http://localhost:8000/api/v1/incidents', headers=headers)
incidents = r.json()
print(f'Found {len(incidents)} incidents')

# Find one with detections
for incident in incidents:
    if incident['id'] == 'incident-feb36380':  # We know this has detections
        incident_id = incident['id']
        print(f'Testing timeline for {incident_id}')
        r = httpx.get(f'http://localhost:8000/api/v1/incidents/{incident_id}/timeline', headers=headers)
        print(f'Status: {r.status_code}')
        timeline = r.json()
        
        for item in timeline.get('timeline', []):
            print(f"\nAttack: {item['technique_id']} at {item['occurred_at']}")
            print(f"  Detected: {item['detected']}")
            for det in item.get('detections', []):
                print(f"    - Rule: {det['rule_name']} (confidence: {det['confidence']})")
        
        break
