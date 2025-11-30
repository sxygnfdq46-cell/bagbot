"""Context Memory - Short-term conversation memory."""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from collections import deque

logger = logging.getLogger(__name__)


class ContextMemory:
    """
    Maintains short-term conversation context.
    
    Features:
    - Per-session memory
    - No long-term storage (compliant)
    - Context-aware responses
    """
    
    def __init__(self, max_history: int = 20):
        self.max_history = max_history
        self.sessions: Dict[str, deque] = {}
        logger.info(f"🧠 Context Memory initialized (max_history={max_history})")
    
    def add_interaction(self, session_id: str, role: str, content: str, metadata: Optional[Dict] = None) -> None:
        """
        Add interaction to session memory.
        
        Args:
            session_id: Unique session identifier
            role: 'user' or 'assistant'
            content: Message content
            metadata: Additional context
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = deque(maxlen=self.max_history)
        
        interaction = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        self.sessions[session_id].append(interaction)
    
    def get_session_history(self, session_id: str, limit: Optional[int] = None) -> List[Dict]:
        """Get conversation history for a session."""
        if session_id not in self.sessions:
            return []
        
        history = list(self.sessions[session_id])
        
        if limit:
            history = history[-limit:]
        
        return history
    
    def get_context_summary(self, session_id: str) -> str:
        """Get summary of recent conversation."""
        history = self.get_session_history(session_id, limit=5)
        
        if not history:
            return "No previous conversation."
        
        summary = "**Recent Context:**\n"
        for item in history[-3:]:
            role_emoji = "👤" if item["role"] == "user" else "🤖"
            preview = item["content"][:60] + "..." if len(item["content"]) > 60 else item["content"]
            summary += f"{role_emoji} {preview}\n"
        
        return summary
    
    def detect_followup_intent(self, session_id: str, current_query: str) -> Optional[str]:
        """Detect if current query is a follow-up."""
        history = self.get_session_history(session_id, limit=3)
        
        if not history:
            return None
        
        current_lower = current_query.lower()
        
        # Follow-up indicators
        followup_words = ["also", "and", "what about", "how about", "tell me more", 
                         "explain", "clarify", "yes", "no", "thanks"]
        
        if any(word in current_lower for word in followup_words):
            # Check last assistant message for topic
            for item in reversed(history):
                if item["role"] == "assistant":
                    metadata = item.get("metadata", {})
                    return metadata.get("topic", "previous_query")
        
        return None
    
    def clear_session(self, session_id: str) -> None:
        """Clear a session's memory."""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Cleared session: {session_id}")
    
    def get_active_sessions(self) -> List[str]:
        """Get list of active session IDs."""
        return list(self.sessions.keys())
    
    def cleanup_old_sessions(self, max_age_hours: int = 24) -> int:
        """
        Clean up old sessions.
        
        Args:
            max_age_hours: Maximum age of session to keep
            
        Returns:
            Number of sessions removed
        """
        current_time = datetime.now()
        removed = 0
        
        sessions_to_remove = []
        for session_id, history in self.sessions.items():
            if history:
                last_interaction = history[-1]
                last_time = datetime.fromisoformat(last_interaction["timestamp"])
                age_hours = (current_time - last_time).total_seconds() / 3600
                
                if age_hours > max_age_hours:
                    sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            del self.sessions[session_id]
            removed += 1
        
        if removed > 0:
            logger.info(f"Cleaned up {removed} old sessions")
        
        return removed
