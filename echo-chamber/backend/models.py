"""
Data models for Echo-Chamber
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class AgentRole(str, Enum):
    CTO = "cto"
    PR_HEAD = "pr_head"
    HOSTILE_ACTOR = "hostile_actor"


class CrisisPhase(str, Enum):
    INITIAL = "initial"
    ESCALATION = "escalation"
    BREACH_CONFIRMED = "breach_confirmed"
    RANSOM_DEMAND = "ransom_demand"
    DECISION_POINT = "decision_point"
    RESOLUTION = "resolution"


class AgentMessage(BaseModel):
    role: AgentRole
    content: str
    timestamp: datetime
    emotion: str  # panic, defensive, threatening, neutral
    audio_url: Optional[str] = None
    interruptible: bool = True


class StockTick(BaseModel):
    price: float
    change: float
    change_percent: float
    timestamp: datetime


class NewsItem(BaseModel):
    headline: str
    source: str
    timestamp: datetime
    severity: int  # 1-10


class CrisisState(BaseModel):
    phase: CrisisPhase = CrisisPhase.INITIAL
    stock_price: float = 145.50
    stock_change: float = -2.30
    stock_change_percent: float = -1.55
    time_elapsed: int = 0  # seconds since start
    messages: List[AgentMessage] = []
    news: List[NewsItem] = []
    user_decisions: List[Dict[str, Any]] = []
    is_active: bool = False
    current_speaker: Optional[AgentRole] = None


class UserDecision(BaseModel):
    decision_type: str  # "pay_ransom", "contact_fbi", "negotiate", "ignore", etc.
    content: str
    timestamp: Optional[datetime] = None


class DialogueNode(BaseModel):
    id: str
    speaker: AgentRole
    content: str
    emotion: str
    next_nodes: List[str]
    trigger_condition: Optional[str] = None
    requires_decision: bool = False
    decision_options: List[Dict[str, str]] = []


class CrisisScenario(BaseModel):
    name: str
    description: str
    initial_stock: float
    nodes: Dict[str, DialogueNode]
    entry_node: str
