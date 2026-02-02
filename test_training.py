import requests
import os

# Test training endpoint
test_voice_id = "test_voice_demo"
audio_file_path = "D:/Pod-app-zai/rvc/temp/68fe33b9e9b7fa0276a9469e_output.wav"

print(f"🧪 Testing voice training...")
print(f"   Voice ID: {test_voice_id}")
print(f"   Audio: {audio_file_path}")

# Prepare the request
with open(audio_file_path, 'rb') as audio_file:
    files = {
        'audio': ('test_voice.wav', audio_file, 'audio/wav')
    }
    data = {
        'voice_id': test_voice_id,
        'voice_name': 'Test Voice Demo'
    }
    
    print(f"\n📤 Sending training request...")
    response = requests.post('http://localhost:5000/train', files=files, data=data, timeout=60)
    
    print(f"\n📥 Response Status: {response.status_code}")
    print(f"📥 Response: {response.json()}")
    
    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            print(f"\n✅ Training completed successfully!")
            print(f"   Model path: {result.get('model_path')}")
        else:
            print(f"\n❌ Training failed: {result.get('error')}")
    
    # Check progress
    print(f"\n📊 Checking training progress...")
    progress_response = requests.get(f'http://localhost:5000/training-progress/{test_voice_id}')
    print(f"   Progress: {progress_response.json()}")
    
    # Check if model was saved
    weights_dir = "D:/Pod-app-zai/rvc/weights"
    expected_file = f"{weights_dir}/{test_voice_id}.wav"
    if os.path.exists(expected_file):
        file_size = os.path.getsize(expected_file)
        print(f"\n✅ Reference audio saved: {expected_file} ({file_size} bytes)")
    else:
        print(f"\n❌ Reference audio NOT found: {expected_file}")
