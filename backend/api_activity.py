"""
User Activity API Endpoints
View login history, signup data, and user activity
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import user_activity
from auth import get_current_user, get_current_admin
import models as db_models

router = APIRouter(prefix="/api/activity", tags=["User Activity"])


# ============= USER ENDPOINTS =============

@router.get("/my-logins")
async def get_my_login_history(
    limit: int = 50,
    current_user: db_models.User = Depends(get_current_user)
):
    """Get current user's login history"""
    history = user_activity.get_user_login_history(current_user.id, limit)
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "login_history": history,
        "total_logins": len(history)
    }


@router.get("/my-activity")
async def get_my_activity(
    limit: int = 100,
    current_user: db_models.User = Depends(get_current_user)
):
    """Get current user's activity log"""
    activity = user_activity.get_user_activity(current_user.id, limit)
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "activities": activity,
        "total_activities": len(activity)
    }


@router.get("/my-sessions")
async def get_my_sessions(
    current_user: db_models.User = Depends(get_current_user)
):
    """Get current user's active sessions"""
    sessions = user_activity.get_active_sessions(current_user.id)
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "active_sessions": sessions,
        "session_count": len(sessions)
    }


@router.get("/my-summary")
async def get_my_activity_summary(
    current_user: db_models.User = Depends(get_current_user)
):
    """Get current user's activity summary"""
    summary = user_activity.get_user_activity_summary(current_user.id)
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        **summary
    }


# ============= ADMIN ENDPOINTS =============

@router.get("/admin/login-stats")
async def get_login_statistics(
    days: int = 30,
    current_user: db_models.User = Depends(get_current_admin)
):
    """Get login statistics (admin only)"""
    stats = user_activity.get_login_stats(days)
    return stats


@router.get("/admin/signup-stats")
async def get_signup_statistics(
    days: int = 30,
    current_user: db_models.User = Depends(get_current_admin)
):
    """Get signup statistics (admin only)"""
    stats = user_activity.get_signup_stats(days)
    return stats


@router.get("/admin/recent-signups")
async def get_recent_signups(
    days: int = 7,
    limit: int = 100,
    current_user: db_models.User = Depends(get_current_admin)
):
    """Get recent signups (admin only)"""
    signups = user_activity.get_recent_signups(days, limit)
    return {
        "signups": signups,
        "count": len(signups),
        "period_days": days
    }


@router.get("/admin/user/{user_id}/logins")
async def get_user_logins(
    user_id: int,
    limit: int = 50,
    current_user: db_models.User = Depends(get_current_admin)
):
    """Get specific user's login history (admin only)"""
    history = user_activity.get_user_login_history(user_id, limit)
    return {
        "user_id": user_id,
        "login_history": history,
        "total_logins": len(history)
    }


@router.get("/admin/user/{user_id}/activity")
async def get_user_activity_admin(
    user_id: int,
    limit: int = 100,
    current_user: db_models.User = Depends(get_current_admin)
):
    """Get specific user's activity log (admin only)"""
    activity = user_activity.get_user_activity(user_id, limit)
    return {
        "user_id": user_id,
        "activities": activity,
        "total_activities": len(activity)
    }


@router.get("/admin/user/{user_id}/summary")
async def get_user_summary_admin(
    user_id: int,
    current_user: db_models.User = Depends(get_current_admin)
):
    """Get specific user's activity summary (admin only)"""
    summary = user_activity.get_user_activity_summary(user_id)
    return {
        "user_id": user_id,
        **summary
    }


@router.get("/admin/failed-logins/{email}")
async def get_failed_logins(
    email: str,
    hours: int = 24,
    current_user: db_models.User = Depends(get_current_admin)
):
    """Get failed login attempts for an email (admin only)"""
    attempts = user_activity.get_failed_login_attempts(email, hours)
    return {
        "email": email,
        "failed_attempts": attempts,
        "count": len(attempts),
        "period_hours": hours
    }
