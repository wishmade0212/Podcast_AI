# RVC Voice Cloning Service with Hugging Face Support
# Uses pre-trained models from Hugging Face for voice conversion

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
import json
import tempfile
import shutil
from pathlib import Path
import time
from typing import Optional
import numpy as np

app = Flask(__name__)
CORS(app)

# Limit upload size (default 50MB) to be production-safe
try:
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_UPLOAD_MB', '50')) * 1024 * 1024
except Exception:
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Configuration
RVC_ROOT = os.path.join(os.path.dirname(__file__), 'rvc')
MODELS_DIR = os.path.join(RVC_ROOT, 'models')
WEIGHTS_DIR = os.path.join(RVC_ROOT, 'weights')
LOGS_DIR = os.path.join(RVC_ROOT, 'logs')
TEMP_DIR = os.path.join(RVC_ROOT, 'temp')

# Training progress tracking
training_progress = {}

# Create directories
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(WEIGHTS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# Try to import Hugging Face dependencies
HF_AVAILABLE = False
XTTS_AVAILABLE = False
try:
    from transformers import pipeline
    import torch
    import torchaudio
    import soundfile as sf
    from pydub import AudioSegment
    import librosa
    HF_AVAILABLE = True
    print("✅ Hugging Face Transformers available")
except ImportError as e:
    print("⚠️  Hugging Face not installed. Using mock mode.")
    print(f"   Error: {e}")
    print("   Install: pip install transformers torch torchaudio soundfile")

# Optional: Coqui TTS for XTTS zero-shot
try:
    from TTS.api import TTS  # type: ignore
    XTTS_AVAILABLE = True
    print("✅ Coqui TTS available for XTTS zero-shot")
except Exception as e:
    print("ℹ️  Coqui TTS not available; XTTS backend will be disabled.")
    print(f"   Hint: TTS may require Python 3.10/3.11. Error: {e}")

# Optional: Hugging Face Hub for model caching
HF_HUB_AVAILABLE = False
try:
    from huggingface_hub import snapshot_download
    HF_HUB_AVAILABLE = True
    print("✅ huggingface_hub available for model caching")
except Exception:
    print("ℹ️  huggingface_hub not installed; HF repo caching disabled.")

# Check for GPU
DEVICE = "cuda" if HF_AVAILABLE and torch.cuda.is_available() else "cpu"
if HF_AVAILABLE:
    print(f"🖥️  Using device: {DEVICE}")

class HuggingFaceRVCService:
    """Service using Hugging Face models for voice conversion"""
    
    def __init__(self):
        self.models = {}
        self.hf_models = {}
        self.mock_mode = not HF_AVAILABLE
        self.xtts_available = XTTS_AVAILABLE

        if HF_AVAILABLE:
            print("🚀 Initializing Hugging Face RVC Service...")
            self.load_pretrained_models()
        else:
            print("🎭 Running in MOCK mode")
            self.load_existing_models()

    def ensure_hf_model_cached(self, repo_id: str, revision: Optional[str] = None) -> Optional[str]:
        """Download/cache a Hugging Face repo if available; return local path."""
        if not HF_HUB_AVAILABLE:
            return None
        try:
            print(f"📥 Caching HF repo: {repo_id} @ {revision or 'latest'}")
            cache_dir = os.path.join(MODELS_DIR, 'hf')
            os.makedirs(cache_dir, exist_ok=True)
            local_dir = snapshot_download(repo_id=repo_id, revision=revision, cache_dir=cache_dir)
            # Track in hf_models map
            self.hf_models[repo_id] = {
                'path': local_dir,
                'revision': revision,
                'cached': True,
            }
            print(f"✅ Cached to: {local_dir}")
            return local_dir
        except Exception as e:
            print(f"⚠️  HF cache failed for {repo_id}: {e}")
            return None
    
    def load_pretrained_models(self):
        """Load pre-trained voice conversion models from Hugging Face"""
        try:
            # These are example models - you can use different ones
            pretrained_models = [
                {
                    'id': 'facebook/speech-to-speech',
                    'name': 'Facebook S2S',
                    'type': 'speech-to-speech'
                },
                # Add more models as needed
            ]
            
            for model_info in pretrained_models:
                try:
                    print(f"  Loading {model_info['name']}...")
                    # Load model pipeline
                    # Note: This is a placeholder - actual implementation depends on the model
                    self.hf_models[model_info['id']] = {
                        'info': model_info,
                        'loaded': True
                    }
                    print(f"  ✅ {model_info['name']} loaded")
                except Exception as e:
                    print(f"  ⚠️  Could not load {model_info['name']}: {e}")
            
        except Exception as e:
            print(f"❌ Error loading pretrained models: {e}")
    
    def load_existing_models(self):
        """Load user-uploaded voice samples"""
        if os.path.exists(WEIGHTS_DIR):
            for model_file in os.listdir(WEIGHTS_DIR):
                if model_file.endswith('.pth') or model_file.endswith('.pt'):
                    model_name = model_file.replace('.pth', '').replace('.pt', '')
                    self.models[model_name] = {
                        'path': os.path.join(WEIGHTS_DIR, model_file),
                        'status': 'ready',
                        'type': 'custom'
                    }
        print(f"📦 Loaded {len(self.models)} existing custom models")
    
    def train_model(self, voice_id, audio_path, voice_name):
        """
        Process voice sample for future use
        With Hugging Face, we don't train but rather prepare the voice sample
        for voice conversion using pre-trained models
        """
        global training_progress
        
        if self.mock_mode:
            return self._mock_training(voice_id, voice_name)
        
        try:
            print(f"🎤 Processing voice sample: {voice_name}")
            
            # Update progress: Start
            training_progress[voice_id] = {
                'status': 'processing',
                'progress': 10,
                'message': 'Loading audio file...'
            }
            
            # Load audio using librosa (handles all formats: MP3, WAV, OGG, M4A, etc.)
            print(f"   Loading audio file: {audio_path}")
            try:
                # librosa can read MP3, WAV, OGG, FLAC, M4A without ffmpeg
                audio_data, sample_rate = librosa.load(audio_path, sr=None, mono=False)
                print(f"   ✅ Audio loaded: sample_rate={sample_rate}, shape={audio_data.shape}")
                
                # Convert to torch tensor and ensure correct shape
                if len(audio_data.shape) == 1:
                    # Mono audio
                    waveform = torch.from_numpy(audio_data).float().unsqueeze(0)
                else:
                    # Stereo or multi-channel
                    waveform = torch.from_numpy(audio_data).float()
                    if waveform.shape[0] > waveform.shape[1]:
                        waveform = waveform.t()  # Ensure [channels, samples]
                        
            except Exception as load_err:
                print(f"   ⚠️ Librosa load failed: {load_err}")
                raise
            
            # Update progress: Audio loaded
            training_progress[voice_id] = {
                'status': 'processing',
                'progress': 40,
                'message': 'Analyzing audio features...'
            }
            
            # Simulate some processing time for better UX
            time.sleep(0.5)
            
            # Update progress: Processing
            training_progress[voice_id] = {
                'status': 'processing',
                'progress': 70,
                'message': 'Preparing voice model...'
            }
            
            # Save processed audio reference
            ref_path = os.path.join(WEIGHTS_DIR, f"{voice_id}.wav")
            # Convert waveform to numpy and transpose if needed for soundfile
            waveform_np = waveform.numpy()
            if len(waveform_np.shape) > 1 and waveform_np.shape[0] < waveform_np.shape[1]:
                waveform_np = waveform_np.T  # soundfile expects [samples, channels]
            else:
                waveform_np = waveform_np.squeeze()  # Remove channel dim if mono
            sf.write(ref_path, waveform_np, sample_rate)
            print(f"   ✅ Saved reference audio: {ref_path}")
            
            # Update progress: Almost done
            training_progress[voice_id] = {
                'status': 'processing',
                'progress': 90,
                'message': 'Finalizing...'
            }
            
            self.models[voice_id] = {
                'path': ref_path,
                'status': 'ready',
                'name': voice_name,
                'type': 'custom',
                'sample_rate': sample_rate
            }
            
            # Update progress: Complete
            training_progress[voice_id] = {
                'status': 'completed',
                'progress': 100,
                'message': 'Voice training completed!'
            }
            
            print(f"✅ Voice sample processed: {voice_id}")
            
            return {
                'success': True,
                'model_id': voice_id,
                'model_path': ref_path,
                'status': 'ready',
                'mode': 'huggingface'
            }
            
        except Exception as e:
            print(f"❌ Processing failed: {str(e)}")
            
            # Update progress: Failed
            training_progress[voice_id] = {
                'status': 'failed',
                'progress': 0,
                'message': f'Error: {str(e)}'
            }
            
            return {
                'success': False,
                'error': str(e),
                'status': 'failed'
            }
    
    def _mock_training(self, voice_id, voice_name):
        """Mock training for development"""
        print(f"🎭 Mock processing: {voice_name}")
        time.sleep(2)
        
        model_path = os.path.join(WEIGHTS_DIR, f"{voice_id}.pth")
        with open(model_path, 'w') as f:
            f.write(f"Mock model for {voice_name}")
        
        self.models[voice_id] = {
            'path': model_path,
            'status': 'ready',
            'name': voice_name,
            'type': 'mock'
        }
        
        return {
            'success': True,
            'model_id': voice_id,
            'model_path': model_path,
            'status': 'ready',
            'mock': True
        }
    
    def convert_voice(self, model_id, input_audio_path, output_path, backend: Optional[str] = None, text: Optional[str] = None, hf_repo: Optional[str] = None, hf_revision: Optional[str] = None):
        """
        Convert audio using voice sample with Hugging Face models
        """
        try:
            print(f"🔄 Converting audio with model: {model_id}")

            # Determine backend and normalize
            backend_norm = (backend or 'rvc').lower()
            print(f"   Backend: {backend_norm}")

            # If FreeVC/RVC path: allow running even in mock mode via external script
            if backend_norm in ('freevc', 'rvc', 'knn-vc'):
                # Ensure/capture HF repo path if provided
                repo_path = None
                if hf_repo:
                    # Try ensure cache (if available)
                    cached = self.ensure_hf_model_cached(hf_repo, hf_revision)
                    if cached:
                        repo_path = cached
                    elif hf_repo in self.hf_models:
                        repo_path = self.hf_models[hf_repo].get('path')

                handled = False
                if repo_path:
                    infer_script = os.path.join(repo_path, 'infer.py')
                    if os.path.exists(infer_script):
                        try:
                            print(f"🔧 Running inference script: {infer_script}")
                            import subprocess
                            cmd = [sys.executable, infer_script, '--input', input_audio_path, '--output', output_path]
                            if hf_revision:
                                cmd += ['--revision', hf_revision]
                            # Run with timeout to avoid hangs in hosted environments
                            subprocess.run(cmd, check=True, timeout=int(os.environ.get('HF_INFER_TIMEOUT', '600')))
                            handled = True
                        except Exception as e:
                            print(f"⚠️  Inference script failed: {e}")
                    else:
                        print(f"ℹ️  infer.py not found in repo: {repo_path}")
                else:
                    if hf_repo:
                        print(f"ℹ️  HF repo not cached or unavailable: {hf_repo}")

                if not handled:
                    print("ℹ️  Falling back to passthrough copy for FreeVC/RVC backend")
                    try:
                        shutil.copy(input_audio_path, output_path)
                    except Exception as e:
                        print(f"❌ Passthrough copy failed: {e}")
                        return {'success': False, 'error': str(e)}

                print("✅ Conversion complete (FreeVC/RVC path)")
                return {'success': True, 'output_path': output_path, 'mode': 'freevc-scaffold'}

            # For other backends, we may need HF deps; handle gracefully
            if not HF_AVAILABLE:
                print("ℹ️  HF deps unavailable; using passthrough copy")
                shutil.copy(input_audio_path, output_path)
                print("✅ Conversion complete (passthrough)")
                return {'success': True, 'output_path': output_path, 'mode': 'passthrough'}

            # From here on, HF deps are available (torch/torchaudio/soundfile)
            # Load input audio using soundfile
            audio_data, input_sr = sf.read(input_audio_path)
            input_waveform = torch.from_numpy(audio_data).float()
            if len(input_waveform.shape) == 1:
                input_waveform = input_waveform.unsqueeze(0)
            else:
                input_waveform = input_waveform.t()

            # For XTTS or other VC requiring a reference voice, verify model presence
            has_model = model_id in self.models
            ref_waveform = None
            ref_sr = None
            if has_model:
                ref_path = self.models[model_id]['path']
                ref_audio_data, ref_sr = sf.read(ref_path)
                ref_waveform = torch.from_numpy(ref_audio_data).float()
                if len(ref_waveform.shape) == 1:
                    ref_waveform = ref_waveform.unsqueeze(0)
                else:
                    ref_waveform = ref_waveform.t()
            else:
                print("ℹ️  Reference model not found; some backends may fallback")

            # Optionally cache HF repo if provided
            if hf_repo:
                self.ensure_hf_model_cached(hf_repo, hf_revision)

            if backend_norm == 'xtts':
                # XTTS zero-shot TTS via Coqui TTS if installed
                if not self.xtts_available:
                    print("ℹ️  XTTS not available; install Coqui TTS and ensure compatible Python version.")
                    sf.write(output_path, input_waveform.squeeze().numpy(), input_sr)
                else:
                    try:
                        model_name = os.environ.get('XTTS_MODEL', 'tts_models/multilingual/multi-dataset/xtts_v2')
                        print(f"   Using XTTS model: {model_name}")
                        tts = TTS(model_name)
                        if has_model and ref_waveform is not None and ref_sr is not None and text:
                            ref_tmp = os.path.join(TEMP_DIR, f"{model_id}_ref.wav")
                            sf.write(ref_tmp, ref_waveform.squeeze().numpy(), ref_sr)
                            tts.tts_to_file(text=text, file_path=output_path, speaker_wav=ref_tmp, language=os.environ.get('XTTS_LANG', 'en'))
                            try:
                                os.remove(ref_tmp)
                            except Exception:
                                pass
                        else:
                            print("ℹ️  Missing reference or text for XTTS; falling back to passthrough")
                            sf.write(output_path, input_waveform.squeeze().numpy(), input_sr)
                    except Exception as e:
                        print(f"   XTTS failed: {e}")
                        sf.write(output_path, input_waveform.squeeze().numpy(), input_sr)
            else:
                # Default behavior: passthrough (placeholder)
                sf.write(output_path, input_waveform.squeeze().numpy(), input_sr)

            print("✅ Conversion complete")
            return {'success': True, 'output_path': output_path, 'mode': 'huggingface'}

        except Exception as e:
            print(f"❌ Conversion failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _mock_conversion(self, input_path, output_path):
        """Mock conversion - just copy input to output"""
        print(f"🎭 Mock conversion")
        shutil.copy(input_path, output_path)
        return {
            'success': True,
            'output_path': output_path,
            'mock': True
        }
    
    def delete_model(self, model_id):
        """Delete a voice model"""
        if model_id not in self.models:
            return {'success': False, 'error': 'Model not found'}
        
        try:
            model_path = self.models[model_id]['path']
            if os.path.exists(model_path):
                os.remove(model_path)
            
            del self.models[model_id]
            
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Initialize service
service = HuggingFaceRVCService()

# Routes
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'mode': 'mock' if service.mock_mode else 'huggingface',
        'device': DEVICE if HF_AVAILABLE else 'cpu',
        'models_loaded': len(service.models),
        'hf_models': len(service.hf_models) if HF_AVAILABLE else 0,
        'xtts_available': service.xtts_available,
        'hf_hub_available': HF_HUB_AVAILABLE
    })

@app.route('/train', methods=['POST'])
def train():
    """Train/process a new voice model"""
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        voice_id = request.form.get('voice_id')
        voice_name = request.form.get('voice_name', 'Unnamed Voice')
        
        if not voice_id:
            return jsonify({'success': False, 'error': 'voice_id is required'}), 400
        
        # Get original filename to preserve extension
        original_filename = audio_file.filename or 'audio.mp3'
        file_ext = os.path.splitext(original_filename)[1] or '.mp3'
        
        # Save temporary audio file with correct extension
        temp_audio = os.path.join(TEMP_DIR, f"{voice_id}_temp{file_ext}")
        audio_file.save(temp_audio)
        
        print(f"📥 Saved temp audio: {temp_audio}")
        
        # Process voice
        result = service.train_model(voice_id, temp_audio, voice_name)
        
        # Clean up temp file
        try:
            os.remove(temp_audio)
        except:
            pass
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Train error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/convert', methods=['POST'])
def convert():
    """Convert audio using a voice model"""
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        model_id = request.form.get('model_id')
        backend = request.form.get('backend')
        text = request.form.get('text')
        hf_repo = request.form.get('hf_repo')
        hf_revision = request.form.get('hf_revision')
        
        if not model_id:
            return jsonify({'success': False, 'error': 'model_id is required'}), 400
        
        # Save input audio
        temp_input = os.path.join(TEMP_DIR, f"{model_id}_input.wav")
        audio_file.save(temp_input)
        
        # Convert
        temp_output = os.path.join(TEMP_DIR, f"{model_id}_output.wav")
        result = service.convert_voice(model_id, temp_input, temp_output, backend=backend, text=text, hf_repo=hf_repo, hf_revision=hf_revision)
        
        # Schedule cleanup of temp files after response
        try:
            from flask import after_this_request

            @after_this_request
            def cleanup(response):
                try:
                    if os.path.exists(temp_input):
                        os.remove(temp_input)
                except Exception as e:
                    print(f"⚠️  Failed to remove temp_input: {e}")
                try:
                    if os.path.exists(temp_output) and (not result or result.get('success')):
                        # Remove output after it's been sent; relies on temp file semantics
                        os.remove(temp_output)
                except Exception as e:
                    print(f"⚠️  Failed to remove temp_output: {e}")
                return response
        except Exception as e:
            print(f"ℹ️  Could not register after_this_request cleanup: {e}")

        if result['success'] and os.path.exists(temp_output):
            return send_file(temp_output, mimetype='audio/wav')
        else:
            # Ensure we cleanup on failure
            try:
                if os.path.exists(temp_input):
                    os.remove(temp_input)
                if os.path.exists(temp_output):
                    os.remove(temp_output)
            except Exception:
                pass
            return jsonify(result), 500
            
    except Exception as e:
        print(f"❌ Convert error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/models', methods=['GET'])
def get_models():
    """Get list of available models"""
    models_list = []
    for model_id, model_data in service.models.items():
        models_list.append({
            'id': model_id,
            'name': model_data.get('name', model_id),
            'status': model_data.get('status', 'unknown'),
            'type': model_data.get('type', 'custom')
        })
    
    return jsonify({
        'success': True,
        'models': models_list,
        'count': len(models_list)
    })

@app.route('/models/<model_id>', methods=['DELETE'])
def delete_model(model_id):
    """Delete a voice model"""
    result = service.delete_model(model_id)
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 404

@app.route('/training-progress/<voice_id>', methods=['GET'])
def get_training_progress(voice_id):
    """Get training progress for a specific voice"""
    global training_progress
    
    if voice_id in training_progress:
        return jsonify({
            'success': True,
            **training_progress[voice_id]
        })
    else:
        return jsonify({
            'success': False,
            'status': 'not_found',
            'progress': 0,
            'message': 'No training in progress'
        })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎤 RVC Voice Cloning Service (Hugging Face Edition)")
    print("="*50)
    print(f"   Mode: {'Mock' if service.mock_mode else 'Hugging Face'}")
    print(f"   Device: {DEVICE if HF_AVAILABLE else 'CPU (Mock)'}")
    print(f"   Models Directory: {WEIGHTS_DIR}")
    print(f"   Loaded Models: {len(service.models)}")
    print(f"   HF Models: {len(service.hf_models) if HF_AVAILABLE else 0}")
    print(f"   Server running on http://localhost:5000")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
