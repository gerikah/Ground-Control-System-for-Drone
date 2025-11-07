from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Mission(db.Model):
    __tablename__ = 'missions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    sector = db.Column(db.String(50))
    status = db.Column(db.String(20), default='pending')  # pending, armed, in-progress, completed, aborted
    duration = db.Column(db.String(20), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    total_distance = db.Column(db.Float, default=0.0)
    max_altitude = db.Column(db.Float, default=0.0)
    avg_speed = db.Column(db.Float, default=0.0)
    breeding_sites_detected = db.Column(db.Integer, default=0)
    prearm_checks_passed = db.Column(db.Boolean, default=False)
    armed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sector': self.sector,
            'status': self.status,
            'duration': self.duration,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'total_distance': self.total_distance,
            'max_altitude': self.max_altitude,
            'avg_speed': self.avg_speed,
            'breeding_sites_detected': self.breeding_sites_detected,
            'prearm_checks_passed': self.prearm_checks_passed,
            'armed_at': self.armed_at.isoformat() if self.armed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PreArmCheck(db.Model):
    __tablename__ = 'prearm_checks'
    
    id = db.Column(db.Integer, primary_key=True)
    mission_id = db.Column(db.Integer, db.ForeignKey('missions.id'), nullable=False)
    check_id = db.Column(db.String(50), nullable=False)
    check_name = db.Column(db.String(100), nullable=False)
    passed = db.Column(db.Boolean, default=False)
    message = db.Column(db.Text)
    sensor_data = db.Column(db.Text)  # JSON string
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'mission_id': self.mission_id,
            'check_id': self.check_id,
            'check_name': self.check_name,
            'passed': self.passed,
            'message': self.message,
            'sensor_data': self.sensor_data,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
