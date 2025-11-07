from flask import Blueprint, request, jsonify
from models import db
from datetime import datetime
import json

prearm_bp = Blueprint('prearm', __name__)

# Pre-arming checks configuration
PREARM_CHECKS = {
    'uav_levelled': {
        'name': 'UAV is Levelled',
        'description': 'Drone is level within acceptable tolerance',
        'tolerance': 5.0  # degrees
    },
    'runtime_calibration': {
        'name': 'Run-time Calibration',
        'description': 'System calibration is complete and valid'
    },
    'cpu_load': {
        'name': 'CPU Load',
        'description': 'CPU usage is within acceptable limits',
        'max_load': 80  # percentage
    },
    'navigation_safe': {
        'name': 'Navigation is Safe',
        'description': 'GPS lock and navigation system operational'
    },
    'compass_calibrated': {
        'name': 'Compass Calibrated',
        'description': 'Compass calibration is valid and recent'
    },
    'accelerometer_calibrated': {
        'name': 'Accelerometer Calibrated',
        'description': 'Accelerometer calibration is valid'
    },
    'settings_validated': {
        'name': 'Settings Validated',
        'description': 'All system settings are within safe parameters'
    },
    'hardware_health': {
        'name': 'Hardware Health',
        'description': 'All hardware components are functioning properly'
    }
}

# Store pre-arm check results (in production, use database)
prearm_results = {}

@prearm_bp.route('/prearm/status', methods=['GET'])
def get_prearm_status():
    """Get current pre-arming check status"""
    mission_id = request.args.get('mission_id', 'current')
    
    if mission_id not in prearm_results:
        # Initialize with all checks failed
        prearm_results[mission_id] = {
            check_id: {
                'status': 'pending',
                'passed': False,
                'message': 'Not checked',
                'timestamp': None,
                **PREARM_CHECKS[check_id]
            }
            for check_id in PREARM_CHECKS.keys()
        }
    
    results = prearm_results[mission_id]
    all_passed = all(check['passed'] for check in results.values())
    
    return jsonify({
        'mission_id': mission_id,
        'all_passed': all_passed,
        'checks': results,
        'can_arm': all_passed,
        'timestamp': datetime.utcnow().isoformat()
    })

@prearm_bp.route('/prearm/check', methods=['POST'])
def perform_prearm_check():
    """Perform a specific pre-arming check"""
    data = request.get_json()
    
    mission_id = data.get('mission_id', 'current')
    check_id = data.get('check_id')
    sensor_data = data.get('sensor_data', {})
    
    if check_id not in PREARM_CHECKS:
        return jsonify({'error': 'Invalid check ID'}), 400
    
    if mission_id not in prearm_results:
        prearm_results[mission_id] = {
            check_id: {
                'status': 'pending',
                'passed': False,
                'message': 'Not checked',
                'timestamp': None,
                **PREARM_CHECKS[check_id]
            }
            for check_id in PREARM_CHECKS.keys()
        }
    
    # Perform the specific check
    result = validate_check(check_id, sensor_data)
    
    # Update results
    prearm_results[mission_id][check_id] = {
        **PREARM_CHECKS[check_id],
        'status': 'completed',
        'passed': result['passed'],
        'message': result['message'],
        'timestamp': datetime.utcnow().isoformat(),
        'sensor_data': sensor_data
    }
    
    return jsonify(prearm_results[mission_id][check_id])

@prearm_bp.route('/prearm/check-all', methods=['POST'])
def perform_all_checks():
    """Perform all pre-arming checks"""
    data = request.get_json()
    
    mission_id = data.get('mission_id', 'current')
    sensor_data = data.get('sensor_data', {})
    
    if mission_id not in prearm_results:
        prearm_results[mission_id] = {}
    
    # Perform all checks
    for check_id in PREARM_CHECKS.keys():
        result = validate_check(check_id, sensor_data)
        
        prearm_results[mission_id][check_id] = {
            **PREARM_CHECKS[check_id],
            'status': 'completed',
            'passed': result['passed'],
            'message': result['message'],
            'timestamp': datetime.utcnow().isoformat(),
            'sensor_data': sensor_data.get(check_id, {})
        }
    
    all_passed = all(check['passed'] for check in prearm_results[mission_id].values())
    
    return jsonify({
        'mission_id': mission_id,
        'all_passed': all_passed,
        'checks': prearm_results[mission_id],
        'can_arm': all_passed,
        'timestamp': datetime.utcnow().isoformat()
    })

@prearm_bp.route('/prearm/reset', methods=['POST'])
def reset_prearm_checks():
    """Reset pre-arming checks for a mission"""
    data = request.get_json()
    mission_id = data.get('mission_id', 'current')
    
    if mission_id in prearm_results:
        del prearm_results[mission_id]
    
    return jsonify({
        'message': 'Pre-arming checks reset',
        'mission_id': mission_id
    })

def validate_check(check_id, sensor_data):
    """Validate a specific pre-arming check"""
    
    if check_id == 'uav_levelled':
        roll = sensor_data.get('roll', 0)
        pitch = sensor_data.get('pitch', 0)
        tolerance = PREARM_CHECKS[check_id]['tolerance']
        
        if abs(roll) <= tolerance and abs(pitch) <= tolerance:
            return {
                'passed': True,
                'message': f'UAV is level (roll: {roll:.2f}°, pitch: {pitch:.2f}°)'
            }
        else:
            return {
                'passed': False,
                'message': f'UAV not level (roll: {roll:.2f}°, pitch: {pitch:.2f}°, max: ±{tolerance}°)'
            }
    
    elif check_id == 'runtime_calibration':
        calibration_valid = sensor_data.get('calibration_valid', False)
        
        if calibration_valid:
            return {
                'passed': True,
                'message': 'Run-time calibration complete'
            }
        else:
            return {
                'passed': False,
                'message': 'Run-time calibration required'
            }
    
    elif check_id == 'cpu_load':
        cpu_load = sensor_data.get('cpu_load', 100)
        max_load = PREARM_CHECKS[check_id]['max_load']
        
        if cpu_load <= max_load:
            return {
                'passed': True,
                'message': f'CPU load OK ({cpu_load}%)'
            }
        else:
            return {
                'passed': False,
                'message': f'CPU load too high ({cpu_load}%, max: {max_load}%)'
            }
    
    elif check_id == 'navigation_safe':
        gps_fix = sensor_data.get('gps_fix', False)
        satellites = sensor_data.get('satellites', 0)
        
        if gps_fix and satellites >= 6:
            return {
                'passed': True,
                'message': f'Navigation safe (GPS fix, {satellites} satellites)'
            }
        else:
            return {
                'passed': False,
                'message': f'Navigation unsafe (GPS: {gps_fix}, Sats: {satellites})'
            }
    
    elif check_id == 'compass_calibrated':
        compass_calibrated = sensor_data.get('compass_calibrated', False)
        calibration_age = sensor_data.get('calibration_age_days', 999)
        
        if compass_calibrated and calibration_age < 30:
            return {
                'passed': True,
                'message': f'Compass calibrated ({calibration_age} days ago)'
            }
        else:
            return {
                'passed': False,
                'message': 'Compass calibration required or outdated'
            }
    
    elif check_id == 'accelerometer_calibrated':
        accel_calibrated = sensor_data.get('accelerometer_calibrated', False)
        
        if accel_calibrated:
            return {
                'passed': True,
                'message': 'Accelerometer calibrated'
            }
        else:
            return {
                'passed': False,
                'message': 'Accelerometer calibration required'
            }
    
    elif check_id == 'settings_validated':
        settings_valid = sensor_data.get('settings_valid', False)
        
        if settings_valid:
            return {
                'passed': True,
                'message': 'All settings validated'
            }
        else:
            return {
                'passed': False,
                'message': 'Settings validation failed'
            }
    
    elif check_id == 'hardware_health':
        battery_ok = sensor_data.get('battery_ok', False)
        motors_ok = sensor_data.get('motors_ok', False)
        sensors_ok = sensor_data.get('sensors_ok', False)
        
        if battery_ok and motors_ok and sensors_ok:
            return {
                'passed': True,
                'message': 'All hardware healthy'
            }
        else:
            issues = []
            if not battery_ok:
                issues.append('battery')
            if not motors_ok:
                issues.append('motors')
            if not sensors_ok:
                issues.append('sensors')
            
            return {
                'passed': False,
                'message': f'Hardware issues: {", ".join(issues)}'
            }
    
    return {
        'passed': False,
        'message': 'Unknown check'
    }
