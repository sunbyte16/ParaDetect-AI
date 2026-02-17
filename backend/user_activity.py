"""
User Activity Tracking with SQLite3
Logs user login, signup, and activity events
"""
import sqlite3
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from logger import logger

DATABASE_PATH = "paradetect.db"


@contextmanager
def get_connection():
    """Context manager for SQLite connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        conn.close()


def init_activity_tables():
    """Create activity tracking tables if they don't exist"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # User login history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_login_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email VARCHAR NOT NULL,
                login_time DATETIME NOT NULL,
                ip_address VARCHAR,
                user_agent VARCHAR,
                device_type VARCHAR,
                browser VARCHAR,
                os VARCHAR,
                location VARCHAR,
                success BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # User signup history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_signup_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email VARCHAR NOT NULL,
                full_name VARCHAR,
                signup_time DATETIME NOT NULL,
                ip_address VARCHAR,
                user_agent VARCHAR,
                device_type VARCHAR,
                browser VARCHAR,
                os VARCHAR,
                location VARCHAR,
                referral_source VARCHAR,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # User activity log table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email VARCHAR NOT NULL,
                activity_type VARCHAR NOT NULL,
                activity_description TEXT,
                timestamp DATETIME NOT NULL,
                ip_address VARCHAR,
                metadata TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Failed login attempts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS failed_login_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR NOT NULL,
                attempt_time DATETIME NOT NULL,
                ip_address VARCHAR,
                user_agent VARCHAR,
                reason VARCHAR
            )
        """)
        
        # User session table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                email VARCHAR NOT NULL,
                session_token VARCHAR UNIQUE NOT NULL,
                login_time DATETIME NOT NULL,
                last_activity DATETIME NOT NULL,
                logout_time DATETIME,
                ip_address VARCHAR,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        # Create indexes for better performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_login_user_id ON user_login_history(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_login_time ON user_login_history(login_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_log(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_time ON user_activity_log(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_user_id ON user_sessions(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions(session_token)")
        
        logger.info("✅ Activity tracking tables initialized")


# ============= LOGIN TRACKING =============

def log_user_login(
    user_id: int,
    email: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    device_info: Optional[Dict[str, str]] = None
) -> int:
    """Log successful user login"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        device_type = device_info.get('device_type') if device_info else None
        browser = device_info.get('browser') if device_info else None
        os = device_info.get('os') if device_info else None
        location = device_info.get('location') if device_info else None
        
        cursor.execute("""
            INSERT INTO user_login_history 
            (user_id, email, login_time, ip_address, user_agent, device_type, browser, os, location, success)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (user_id, email, datetime.utcnow().isoformat(), ip_address, user_agent, 
              device_type, browser, os, location))
        
        login_id = cursor.lastrowid
        logger.info(f"✅ Login logged: {email} (ID: {login_id})")
        return login_id


def log_failed_login(
    email: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    reason: str = "Invalid credentials"
) -> int:
    """Log failed login attempt"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO failed_login_attempts 
            (email, attempt_time, ip_address, user_agent, reason)
            VALUES (?, ?, ?, ?, ?)
        """, (email, datetime.utcnow().isoformat(), ip_address, user_agent, reason))
        
        attempt_id = cursor.lastrowid
        logger.warning(f"⚠️ Failed login: {email} - {reason}")
        return attempt_id


def get_user_login_history(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Get user's login history"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM user_login_history 
            WHERE user_id = ? 
            ORDER BY login_time DESC 
            LIMIT ?
        """, (user_id, limit))
        
        columns = [description[0] for description in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_failed_login_attempts(email: str, hours: int = 24) -> List[Dict[str, Any]]:
    """Get failed login attempts for an email in the last N hours"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM failed_login_attempts 
            WHERE email = ? 
            AND attempt_time >= datetime('now', ? || ' hours')
            ORDER BY attempt_time DESC
        """, (email, -hours))
        
        columns = [description[0] for description in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


# ============= SIGNUP TRACKING =============

def log_user_signup(
    user_id: int,
    email: str,
    full_name: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    device_info: Optional[Dict[str, str]] = None,
    referral_source: Optional[str] = None
) -> int:
    """Log new user signup"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        device_type = device_info.get('device_type') if device_info else None
        browser = device_info.get('browser') if device_info else None
        os = device_info.get('os') if device_info else None
        location = device_info.get('location') if device_info else None
        
        cursor.execute("""
            INSERT INTO user_signup_history 
            (user_id, email, full_name, signup_time, ip_address, user_agent, 
             device_type, browser, os, location, referral_source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, email, full_name, datetime.utcnow().isoformat(), ip_address, 
              user_agent, device_type, browser, os, location, referral_source))
        
        signup_id = cursor.lastrowid
        logger.info(f"✅ Signup logged: {email} (ID: {signup_id})")
        return signup_id


def get_recent_signups(days: int = 7, limit: int = 100) -> List[Dict[str, Any]]:
    """Get recent signups"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM user_signup_history 
            WHERE signup_time >= datetime('now', ? || ' days')
            ORDER BY signup_time DESC 
            LIMIT ?
        """, (-days, limit))
        
        columns = [description[0] for description in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


# ============= ACTIVITY TRACKING =============

def log_user_activity(
    user_id: int,
    email: str,
    activity_type: str,
    activity_description: Optional[str] = None,
    ip_address: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> int:
    """Log user activity"""
    import json
    
    with get_connection() as conn:
        cursor = conn.cursor()
        
        metadata_json = json.dumps(metadata) if metadata else None
        
        cursor.execute("""
            INSERT INTO user_activity_log 
            (user_id, email, activity_type, activity_description, timestamp, ip_address, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, email, activity_type, activity_description, 
              datetime.utcnow().isoformat(), ip_address, metadata_json))
        
        activity_id = cursor.lastrowid
        return activity_id


def get_user_activity(user_id: int, limit: int = 100) -> List[Dict[str, Any]]:
    """Get user's activity log"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM user_activity_log 
            WHERE user_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        """, (user_id, limit))
        
        columns = [description[0] for description in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


# ============= SESSION MANAGEMENT =============

def create_user_session(
    user_id: int,
    email: str,
    session_token: str,
    ip_address: Optional[str] = None
) -> int:
    """Create new user session"""
    with get_connection() as conn:
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        
        cursor.execute("""
            INSERT INTO user_sessions 
            (user_id, email, session_token, login_time, last_activity, ip_address, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        """, (user_id, email, session_token, now, now, ip_address))
        
        session_id = cursor.lastrowid
        logger.info(f"✅ Session created: {email} (Session ID: {session_id})")
        return session_id


def update_session_activity(session_token: str):
    """Update session last activity time"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_sessions 
            SET last_activity = ? 
            WHERE session_token = ? AND is_active = 1
        """, (datetime.utcnow().isoformat(), session_token))


def end_user_session(session_token: str):
    """End user session (logout)"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE user_sessions 
            SET logout_time = ?, is_active = 0 
            WHERE session_token = ? AND is_active = 1
        """, (datetime.utcnow().isoformat(), session_token))
        
        logger.info(f"✅ Session ended: {session_token[:20]}...")


def get_active_sessions(user_id: int) -> List[Dict[str, Any]]:
    """Get user's active sessions"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM user_sessions 
            WHERE user_id = ? AND is_active = 1 
            ORDER BY last_activity DESC
        """, (user_id,))
        
        columns = [description[0] for description in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


# ============= STATISTICS =============

def get_login_stats(days: int = 30) -> Dict[str, Any]:
    """Get login statistics"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Total logins
        cursor.execute("""
            SELECT COUNT(*) FROM user_login_history 
            WHERE login_time >= datetime('now', ? || ' days')
        """, (-days,))
        total_logins = cursor.fetchone()[0]
        
        # Unique users
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) FROM user_login_history 
            WHERE login_time >= datetime('now', ? || ' days')
        """, (-days,))
        unique_users = cursor.fetchone()[0]
        
        # Failed attempts
        cursor.execute("""
            SELECT COUNT(*) FROM failed_login_attempts 
            WHERE attempt_time >= datetime('now', ? || ' days')
        """, (-days,))
        failed_attempts = cursor.fetchone()[0]
        
        # Daily login counts
        cursor.execute("""
            SELECT DATE(login_time) as date, COUNT(*) as count
            FROM user_login_history 
            WHERE login_time >= datetime('now', ? || ' days')
            GROUP BY DATE(login_time)
            ORDER BY date DESC
        """, (-days,))
        daily_logins = [dict(zip(['date', 'count'], row)) for row in cursor.fetchall()]
        
        return {
            'total_logins': total_logins,
            'unique_users': unique_users,
            'failed_attempts': failed_attempts,
            'daily_logins': daily_logins,
            'period_days': days
        }


def get_signup_stats(days: int = 30) -> Dict[str, Any]:
    """Get signup statistics"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Total signups
        cursor.execute("""
            SELECT COUNT(*) FROM user_signup_history 
            WHERE signup_time >= datetime('now', ? || ' days')
        """, (-days,))
        total_signups = cursor.fetchone()[0]
        
        # Daily signup counts
        cursor.execute("""
            SELECT DATE(signup_time) as date, COUNT(*) as count
            FROM user_signup_history 
            WHERE signup_time >= datetime('now', ? || ' days')
            GROUP BY DATE(signup_time)
            ORDER BY date DESC
        """, (-days,))
        daily_signups = [dict(zip(['date', 'count'], row)) for row in cursor.fetchall()]
        
        return {
            'total_signups': total_signups,
            'daily_signups': daily_signups,
            'period_days': days
        }


def get_user_activity_summary(user_id: int) -> Dict[str, Any]:
    """Get user activity summary"""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Total logins
        cursor.execute("SELECT COUNT(*) FROM user_login_history WHERE user_id = ?", (user_id,))
        total_logins = cursor.fetchone()[0]
        
        # Last login
        cursor.execute("""
            SELECT login_time FROM user_login_history 
            WHERE user_id = ? 
            ORDER BY login_time DESC LIMIT 1
        """, (user_id,))
        last_login_row = cursor.fetchone()
        last_login = last_login_row[0] if last_login_row else None
        
        # Total activities
        cursor.execute("SELECT COUNT(*) FROM user_activity_log WHERE user_id = ?", (user_id,))
        total_activities = cursor.fetchone()[0]
        
        # Active sessions
        cursor.execute("SELECT COUNT(*) FROM user_sessions WHERE user_id = ? AND is_active = 1", (user_id,))
        active_sessions = cursor.fetchone()[0]
        
        return {
            'total_logins': total_logins,
            'last_login': last_login,
            'total_activities': total_activities,
            'active_sessions': active_sessions
        }


# ============= UTILITY FUNCTIONS =============

def parse_user_agent(user_agent: str) -> Dict[str, str]:
    """Parse user agent string to extract device info"""
    if not user_agent:
        return {}
    
    device_info = {
        'device_type': 'Unknown',
        'browser': 'Unknown',
        'os': 'Unknown'
    }
    
    # Detect device type
    if 'Mobile' in user_agent or 'Android' in user_agent:
        device_info['device_type'] = 'Mobile'
    elif 'Tablet' in user_agent or 'iPad' in user_agent:
        device_info['device_type'] = 'Tablet'
    else:
        device_info['device_type'] = 'Desktop'
    
    # Detect browser
    if 'Chrome' in user_agent:
        device_info['browser'] = 'Chrome'
    elif 'Firefox' in user_agent:
        device_info['browser'] = 'Firefox'
    elif 'Safari' in user_agent:
        device_info['browser'] = 'Safari'
    elif 'Edge' in user_agent:
        device_info['browser'] = 'Edge'
    
    # Detect OS
    if 'Windows' in user_agent:
        device_info['os'] = 'Windows'
    elif 'Mac' in user_agent:
        device_info['os'] = 'macOS'
    elif 'Linux' in user_agent:
        device_info['os'] = 'Linux'
    elif 'Android' in user_agent:
        device_info['os'] = 'Android'
    elif 'iOS' in user_agent or 'iPhone' in user_agent:
        device_info['os'] = 'iOS'
    
    return device_info


# Initialize tables on module import
try:
    init_activity_tables()
except Exception as e:
    logger.error(f"Failed to initialize activity tables: {e}")
