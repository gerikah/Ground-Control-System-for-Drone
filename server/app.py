from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from models import db, Mission, PreArmCheck
from routes.prearm import prearm_bp
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///gcs_drone.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app)
db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Register blueprints
app.register_blueprint(prearm_bp, url_prefix='/api')

# Create database tables
with app.app_context():
    db.create_all()
    print("✓ Database tables created")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'Ground Control System Server is running'
    })

# Missions endpoints
@app.route('/api/missions', methods=['GET', 'POST'])
def missions():
    if request.method == 'GET':
        missions = Mission.query.order_by(Mission.created_at.desc()).all()
        return jsonify([m.to_dict() for m in missions])
    
    elif request.method == 'POST':
        from flask import request
        data = request.get_json()
        
        mission = Mission(
            name=data['name'],
            sector=data.get('sector'),
            status='pending',
            duration=data['duration']
        )
        
        db.session.add(mission)
        db.session.commit()
        
        return jsonify(mission.to_dict()), 201

@app.route('/api/missions/<int:mission_id>/arm', methods=['POST'])
def arm_mission(mission_id):
    """Arm the drone for mission - requires all pre-arm checks to pass"""
    from flask import request
    from datetime import datetime
    
    mission = Mission.query.get_or_404(mission_id)
    
    # Check if all pre-arm checks passed
    checks = PreArmCheck.query.filter_by(mission_id=mission_id).all()
    
    if not checks or len(checks) < 8:  # Must have all 8 checks
        return jsonify({
            'error': 'Pre-arming checks not completed',
            'message': 'All pre-arming checks must be completed before arming'
        }), 400
    
    failed_checks = [c for c in checks if not c.passed]
    
    if failed_checks:
        return jsonify({
            'error': 'Pre-arming checks failed',
            'message': 'All pre-arming checks must pass before arming',
            'failed_checks': [c.to_dict() for c in failed_checks]
        }), 400
    
    # All checks passed - arm the drone
    mission.status = 'armed'
    mission.prearm_checks_passed = True
    mission.armed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Drone armed successfully',
        'mission': mission.to_dict(),
        'can_start_mission': True
    })

@app.route('/api/missions/<int:mission_id>/start', methods=['POST'])
def start_mission(mission_id):
    """Start the mission - requires drone to be armed"""
    from datetime import datetime
    
    mission = Mission.query.get_or_404(mission_id)
    
    if mission.status != 'armed':
        return jsonify({
            'error': 'Drone not armed',
            'message': 'Drone must be armed before starting mission'
        }), 400
    
    mission.status = 'in-progress'
    mission.start_time = datetime.utcnow()
    
    db.session.commit()
    
    # Broadcast mission start via WebSocket
    socketio.emit('mission_started', {
        'mission_id': mission_id,
        'mission': mission.to_dict()
    }, broadcast=True)
    
    return jsonify({
        'message': 'Mission started',
        'mission': mission.to_dict()
    })

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    host = os.getenv('HOST', '0.0.0.0')
    
    print(f"""
╔════════════════════════════════════════════╗
║   Ground Control System - Python Server    ║
╠════════════════════════════════════════════╣
║  Server running on port {port}              ║
║  HTTP: http://{host}:{port}              ║
║  WebSocket: ws://{host}:{port}           ║
╚════════════════════════════════════════════╝
    """)
    
    socketio.run(app, host=host, port=port, debug=True)
