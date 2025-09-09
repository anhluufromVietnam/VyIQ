import requests
import json

API_URL = "https://thu-necessary-substantially-primarily.trycloudflare.com/projects/1/ask"
QUESTION = "What is the main goal of this project?"

headers = {
    "Content-Type": "application/json"
}

payload = {
    "question": QUESTION
}

try:
    print(f"📡 Sending request to {API_URL}...")
    response = requests.post(API_URL, headers=headers, data=json.dumps(payload))

    print(f"🔁 Status code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print("✅ Response:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("❌ Error response:")
        print(response.text)

except requests.exceptions.RequestException as e:
    print(f"🚨 Request failed: {e}")
