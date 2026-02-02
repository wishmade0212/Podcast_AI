# RVC Voice Cloning Service
# Python service for voice training and conversion using RVC (Retrieval-based Voice Conversion)

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import json
import subprocess
import tempfile
import shutil
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuration
RVC_ROOT = os.path.join(os.path.dirname(__file__), 'rvc')
MODELS_DIR = os.path.join(RVC_ROOT, 'models')
WEIGHTS_DIR = os.path.join(RVC_ROOT, 'weights')
LOGS_DIR = os.path.join(RVC_ROOT, 'logs')
TEMP_DIR = os.path.join(RVC_ROOT, 'temp')

# Create directories
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(WEIGHTS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# Check if RVC is installed
RVC_AVAILABLE = False
try:
    sys.path.append(os.path.join(RVC_ROOT, 'rvc-python'))
    from rvc_infer import RVCInference
    RVC_AVAILABLE = True
    print("✅ RVC is available")
except ImportError:
    print("⚠️  RVC not installed. Using mock mode.")
    print("   Install RVC: pip install rvc-python or clone RVC-Project repository")

class RVCService:
    """Service for managing RVC voice models"""
    
    def __init__(self):
        self.models = {}
        self.load_existing_models()
    
    def load_existing_models(self):
        """Load existing trained models"""
        if os.path.exists(WEIGHTS_DIR):
            for model_file in os.listdir(WEIGHTS_DIR):
                if model_file.endswith('.pth'):
                    model_name = model_file.replace('.pth', '')
                    self.models[model_name] = {
                        'path': os.path.join(WEIGHTS_DIR, model_file),
                        'status': 'ready'
                    }
        print(f"📦 Loaded {len(self.models)} existing models")
    
    def train_model(self, voice_id, audio_path, voice_name):
        """
        Train a new RVC model from audio sample
        
        Args:
            voice_id: Unique identifier for the voice
            audio_path: Path to audio sample file
            voice_name: Name of the voice
        
        Returns:
            dict with training status
        """
        if not RVC_AVAILABLE:
            # Mock training for development
            return self._mock_training(voice_id, voice_name)
        
        try:
            print(f"🎤 Training RVC model for: {voice_name}")
            
            # Create model directory
            model_dir = os.path.join(LOGS_DIR, voice_id)
            os.makedirs(model_dir, exist_ok=True)
            
            # Step 1: Preprocess audio (split into chunks)
            print("  1. Preprocessing audio...")
            subprocess.run([
                'python', 'rvc/preprocess.py',
                '--input', audio_path,
                '--output', model_dir,
                '--sr', '40000'
            ], check=True)
            
            # Step 2: Extract features
            print("  2. Extracting features...")
            subprocess.run([
                'python', 'rvc/extract_features.py',
                '--input', model_dir,
                '--model', 'hubert_base'
            ], check=True)
            
            # Step 3: Train model (simplified training)
            print("  3. Training model...")
            subprocess.run([
                'python', 'rvc/train.py',
                '--exp_dir', model_dir,
                '--name', voice_id,
                '--epochs', '100',
                '--save_every_epoch', '50'
            ], check=True)
            
            # Step 4: Export model
            print("  4. Exporting model...")
            model_path = os.path.join(WEIGHTS_DIR, f"{voice_id}.pth")
            
            self.models[voice_id] = {
                'path': model_path,
                'status': 'ready',
                'name': voice_name
            }
            
            print(f"✅ Model trained successfully: {voice_id}")
            
            return {
                'success': True,
                'model_id': voice_id,
                'model_path': model_path,
                'status': 'ready'
            }
            
        except Exception as e:
            print(f"❌ Training failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'status': 'failed'
            }
    
    def _mock_training(self, voice_id, voice_name):
        """Mock training for development without RVC installed"""
        print(f"🎭 Mock training: {voice_name}")
        
        # Simulate training delay
        import time
        time.sleep(2)
        
        # Create dummy model file
        model_path = os.path.join(WEIGHTS_DIR, f"{voice_id}.pth")
        with open(model_path, 'w') as f:
            f.write(f"Mock RVC model for {voice_name}")
        
        self.models[voice_id] = {
            'path': model_path,
            'status': 'ready',
            'name': voice_name
        }
        
        return {
            'success': True,
            'model_id': voice_id,
            'model_path': model_path,
            'status': 'ready',
            'mock': True
        }
    
    def convert_voice(self, model_id, input_audio_path, output_path):
        """
        Convert audio using trained RVC model
        
        Args:
            model_id: ID of the trained model
            input_audio_path: Path to input audio
            output_path: Path to save converted audio
        
        Returns:
            dict with conversion status
        """
        if model_id not in self.models:
            return {'success': False, 'error': 'Model not found'}
        
        if not RVC_AVAILABLE:
            # Mock conversion
            return self._mock_conversion(input_audio_path, output_path)
        
        try:
            print(f"🔄 Converting audio with model: {model_id}")
            
            model = self.models[model_id]
            
            # Run RVC inference
            subprocess.run([
                'python', 'rvc/infer.py',
                '--model', model['path'],
                '--input', input_audio_path,
                '--output', output_path,
                '--pitch', '0',
                '--filter_radius', '3',
                '--index_rate', '0.5',
                '--volume_envelope', '1',
                '--protect', '0.5'
            ], check=True)
            
            print(f"✅ Audio converted successfully")
            
            return {
                'success': True,
                'output_path': output_path
            }
            
        except Exception as e:
            print(f"❌ Conversion failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _mock_conversion(self, input_path, output_path):
        """Mock conversion for development"""
        print(f"🎭 Mock conversion")
        
        # Copy input to output (no actual conversion)
        shutil.copy(input_path, output_path)
        
        return {
            'success': True,
            'output_path': output_path,
            'mock': True
        }
    
    def delete_model(self, model_id):
        """Delete a trained model"""
        if model_id in self.models:
            model = self.models[model_id]
            if os.path.exists(model['path']):
                os.remove(model['path'])
            del self.models[model_id]
            return {'success': True}
        return {'success': False, 'error': 'Model not found'}

# Initialize service
rvc_service = RVCService()

# API Routes

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'rvc_available': RVC_AVAILABLE,
        'models_loaded': len(rvc_service.models)
    })

@app.route('/train', methods=['POST'])
def train_model():
    """
    Train a new RVC model
    
    Expected form data:
    - audio: Audio file
    - voice_id: Unique identifier
    - voice_name: Name of the voice
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        voice_id = request.form.get('voice_id')
        voice_name = request.form.get('voice_name', 'Unknown')
        
        if not voice_id:
            return jsonify({'success': False, 'error': 'voice_id is required'}), 400
        
        # Save uploaded audio temporarily
        temp_audio = os.path.join(TEMP_DIR, f"{voice_id}_input.wav")
        audio_file.save(temp_audio)
        
        # Train model
        result = rvc_service.train_model(voice_id, temp_audio, voice_name)
        
        # Cleanup
        if os.path.exists(temp_audio):
            os.remove(temp_audio)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/convert', methods=['POST'])
def convert_audio():
    """
    Convert audio using trained model
    
    Expected form data:
    - audio: Input audio file
    - model_id: ID of trained model
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        model_id = request.form.get('model_id')
        
        if not model_id:
            return jsonify({'success': False, 'error': 'model_id is required'}), 400
        
        # Save input audio
        temp_input = os.path.join(TEMP_DIR, f"{model_id}_input.wav")
        audio_file.save(temp_input)
        
        # Convert audio
        temp_output = os.path.join(TEMP_DIR, f"{model_id}_output.wav")
        result = rvc_service.convert_voice(model_id, temp_input, temp_output)
        
        if result['success']:
            # Return converted audio
            return send_file(temp_output, mimetype='audio/wav')
        else:
            return jsonify(result), 500
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def list_models():
    """List all trained models"""
    return jsonify({
        'success': True,
        'models': [
            {
                'id': model_id,
                'name': model_data.get('name', model_id),
                'status': model_data['status']
            }
            for model_id, model_data in rvc_service.models.items()
        ]
    })

@app.route('/models/<model_id>', methods=['DELETE'])
def delete_model(model_id):
    """Delete a trained model"""
    result = rvc_service.delete_model(model_id)
    return jsonify(result)

if __name__ == '__main__':
    print("🎤 Starting RVC Voice Cloning Service...")
    print(f"   RVC Available: {RVC_AVAILABLE}")
    print(f"   Models Directory: {WEIGHTS_DIR}")
    print(f"   Loaded Models: {len(rvc_service.models)}")
    print("   Server running on http://localhost:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
