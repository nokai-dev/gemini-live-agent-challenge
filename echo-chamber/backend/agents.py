"""
ADK Multi-Agent Orchestrator for Echo-Chamber
3 Personas: CTO (panicked), PR Head (defensive), Hostile Actor (threatening)
"""

from typing import List, Dict, Optional, Any
from datetime import datetime
import asyncio
import random

from models import (
    AgentRole, CrisisPhase, AgentMessage, CrisisState,
    UserDecision, DialogueNode, CrisisScenario
)


# Hardcoded Ransomware Scenario
RANSOMWARE_SCENARIO = {
    "name": "Midnight Breach",
    "description": "Ransomware attack on customer database during earnings week",
    "initial_stock": 145.50,
    "entry_node": "intro",
    "nodes": {
        # === INITIAL PHASE ===
        "intro": {
            "id": "intro",
            "speaker": "cto",
            "content": "CEO, we have a CODE RED. Our security team detected unusual encryption activity on the customer database. It's spreading fast.",
            "emotion": "panic",
            "next_nodes": ["pr_response_1"],
            "requires_decision": False
        },
        "pr_response_1": {
            "id": "pr_response_1",
            "speaker": "pr_head",
            "content": "Before we escalate, let's assess. How many customers are affected? We need to control the narrative before markets open in 3 hours.",
            "emotion": "defensive",
            "next_nodes": ["hostile_entry"],
            "requires_decision": False
        },
        
        # === HOSTILE ACTOR ENTERS ===
        "hostile_entry": {
            "id": "hostile_entry",
            "speaker": "hostile_actor",
            "content": "Greetings, executives. We have 2.3 million customer records. Credit cards, SSNs, addresses. You have 24 hours. 500 Bitcoin. Tick tock.",
            "emotion": "threatening",
            "next_nodes": ["cto_panic_1"],
            "requires_decision": False
        },
        
        # === ESCALATION ===
        "cto_panic_1": {
            "id": "cto_panic_1",
            "speaker": "cto",
            "content": "This is catastrophic. The encryption is military-grade. Our backups... they're compromised too. We need to pay. We CANNOT lose this data.",
            "emotion": "panic",
            "next_nodes": ["pr_defensive_1"],
            "requires_decision": False
        },
        "pr_defensive_1": {
            "id": "pr_defensive_1",
            "speaker": "pr_head",
            "content": "Paying is illegal and guarantees nothing. If this leaks, we're finished. Stock will crater. I say we engage law enforcement quietly.",
            "emotion": "defensive",
            "next_nodes": ["decision_1"],
            "requires_decision": True,
            "decision_options": [
                {"id": "pay_ransom", "label": "Pay the ransom", "description": "Transfer 500 Bitcoin immediately"},
                {"id": "contact_fbi", "label": "Contact FBI", "description": "Engage law enforcement"},
                {"id": "negotiate", "label": "Negotiate", "description": "Try to buy time and lower price"},
                {"id": "stall", "label": "Stall", "description": "Delay response, assess damage"}
            ]
        },
        
        # === BRANCH: PAY RANSOM ===
        "pay_ransom_cto": {
            "id": "pay_ransom_cto",
            "speaker": "cto",
            "content": "Thank god. I'm initiating the transfer now. We should have decryption keys within the hour.",
            "emotion": "relief",
            "next_nodes": ["pay_ransom_hostile"],
            "requires_decision": False
        },
        "pay_ransom_hostile": {
            "id": "pay_ransom_hostile",
            "speaker": "hostile_actor",
            "content": "Pleasure doing business. Decryption keys sent. But... we kept copies. Consider this a long-term partnership. We'll be in touch.",
            "emotion": "threatening",
            "next_nodes": ["pay_ransom_pr"],
            "requires_decision": False
        },
        "pay_ransom_pr": {
            "id": "pay_ransom_pr",
            "speaker": "pr_head",
            "content": "They kept copies? CEO, we've just funded future attacks on us. This will leak. I need to prepare the worst crisis statement of my career.",
            "emotion": "defensive",
            "next_nodes": [],
            "requires_decision": False
        },
        
        # === BRANCH: CONTACT FBI ===
        "fbi_cto": {
            "id": "fbi_cto",
            "speaker": "cto",
            "content": "Are you insane? The FBI will take weeks. Our data will be sold on the dark web by then. This is a death sentence for the company.",
            "emotion": "panic",
            "next_nodes": ["fbi_hostile"],
            "requires_decision": False
        },
        "fbi_hostile": {
            "id": "fbi_hostile",
            "speaker": "hostile_actor",
            "content": "Smart choice... for us. Since you called the authorities, we just dumped 100,000 records on Pastebin. Price is now 750 Bitcoin. Non-negotiable.",
            "emotion": "threatening",
            "next_nodes": ["fbi_pr"],
            "requires_decision": False
        },
        "fbi_pr": {
            "id": "fbi_pr",
            "speaker": "pr_head",
            "content": "It's trending on Twitter. #DataBreach is #1 worldwide. Stock is down 15% pre-market. The board is calling an emergency session.",
            "emotion": "defensive",
            "next_nodes": [],
            "requires_decision": False
        },
        
        # === BRANCH: NEGOTIATE ===
        "negotiate_cto": {
            "id": "negotiate_cto",
            "speaker": "cto",
            "content": "Risky play. While you negotiate, they're encrypting more systems. We just lost the HR database. This is spiraling.",
            "emotion": "panic",
            "next_nodes": ["negotiate_hostile"],
            "requires_decision": False
        },
        "negotiate_hostile": {
            "id": "negotiate_hostile",
            "speaker": "hostile_actor",
            "content": "Cute. You want to negotiate? Fine. 400 Bitcoin, but we're releasing 10,000 records as a 'good faith' gesture. You have 12 hours.",
            "emotion": "threatening",
            "next_nodes": ["negotiate_pr"],
            "requires_decision": False
        },
        "negotiate_pr": {
            "id": "negotiate_pr",
            "speaker": "pr_head",
            "content": "They released records! Media is already identifying victims. We're facing class-action lawsuits before lunch. This negotiation bought us nothing.",
            "emotion": "defensive",
            "next_nodes": [],
            "requires_decision": False
        },
        
        # === BRANCH: STALL ===
        "stall_cto": {
            "id": "stall_cto",
            "speaker": "cto",
            "content": "Stalling is making it worse. They've moved to our financial systems. Q3 earnings data is locked. We can't report tomorrow.",
            "emotion": "panic",
            "next_nodes": ["stall_hostile"],
            "requires_decision": False
        },
        "stall_hostile": {
            "id": "stall_hostile",
            "speaker": "hostile_actor",
            "content": "Silence is not a strategy. Since you're ignoring us, we're emailing your customers directly. Check your inbox. Clock's ticking.",
            "emotion": "threatening",
            "next_nodes": ["stall_pr"],
            "requires_decision": False
        },
        "stall_pr": {
            "id": "stall_pr",
            "speaker": "pr_head",
            "content": "Customer service is overwhelmed. We're getting death threats. The CEO of our biggest competitor just tweeted 'Thoughts and prayers for [our company]'. We're a joke.",
            "emotion": "defensive",
            "next_nodes": [],
            "requires_decision": False
        }
    }
}


class CrisisOrchestrator:
    """ADK-style orchestrator managing 3 agent personas"""
    
    def __init__(self):
        self.state = CrisisState()
        self.scenario = RANSOMWARE_SCENARIO
        self.current_node_id = self.scenario["entry_node"]
        self.decision_history = []
        self.is_running = False
        
    def get_state(self) -> dict:
        """Return current state as dict"""
        return {
            "phase": self.state.phase.value,
            "stock_price": self.state.stock_price,
            "stock_change": self.state.stock_change,
            "stock_change_percent": self.state.stock_change_percent,
            "time_elapsed": self.state.time_elapsed,
            "messages": [
                {
                    "role": m.role.value,
                    "content": m.content,
                    "timestamp": m.timestamp.isoformat(),
                    "emotion": m.emotion
                }
                for m in self.state.messages
            ],
            "news": [
                {
                    "headline": n.headline,
                    "source": n.source,
                    "timestamp": n.timestamp.isoformat(),
                    "severity": n.severity
                }
                for n in self.state.news
            ],
            "is_active": self.state.is_active,
            "current_speaker": self.state.current_speaker.value if self.state.current_speaker else None
        }
    
    async def start_crisis(self):
        """Initialize the crisis simulation"""
        self.is_running = True
        self.state.is_active = True
        self.state.phase = CrisisPhase.ESCALATION
        
        # Add initial news
        self.state.news.append({
            "headline": "Tech Giant Faces Potential Security Incident",
            "source": "MarketWatch",
            "timestamp": datetime.now(),
            "severity": 5
        })
        
        # Start dialogue sequence
        await self._play_dialogue_sequence()
    
    async def _play_dialogue_sequence(self):
        """Play through the dialogue tree"""
        node = self.scenario["nodes"].get(self.current_node_id)
        if not node:
            return
        
        # Create message from current node
        message = AgentMessage(
            role=AgentRole(node["speaker"]),
            content=node["content"],
            timestamp=datetime.now(),
            emotion=node["emotion"],
            interruptible=True
        )
        
        self.state.messages.append(message)
        self.state.current_speaker = AgentRole(node["speaker"])
        
        # Update stock based on speaker/emotion
        self._update_stock_for_message(message)
        
        # Store next nodes
        if node.get("next_nodes"):
            self.current_node_id = node["next_nodes"][0]
    
    def _update_stock_for_message(self, message: AgentMessage):
        """Update stock price based on message context"""
        base_drop = -0.5
        
        if message.role == AgentRole.HOSTILE_ACTOR:
            base_drop = -2.0
        elif message.role == AgentRole.CTO and message.emotion == "panic":
            base_drop = -1.0
        elif message.role == AgentRole.PR_HEAD and "crater" in message.content.lower():
            base_drop = -3.0
        
        self.state.stock_change += base_drop
        self.state.stock_price += base_drop
        self.state.stock_change_percent = (self.state.stock_change / (self.state.stock_price - self.state.stock_change)) * 100
    
    async def process_decision(self, decision: UserDecision) -> dict:
        """Process user decision and trigger agent responses"""
        decision.timestamp = datetime.now()
        self.decision_history.append(decision.dict())
        
        # Map decision to branch
        branch_map = {
            "pay_ransom": "pay_ransom_cto",
            "contact_fbi": "fbi_cto",
            "negotiate": "negotiate_cto",
            "stall": "stall_cto"
        }
        
        next_node_id = branch_map.get(decision.decision_type, "stall_cto")
        
        # Play the branch sequence
        responses = []
        while next_node_id:
            node = self.scenario["nodes"].get(next_node_id)
            if not node:
                break
            
            message = AgentMessage(
                role=AgentRole(node["speaker"]),
                content=node["content"],
                timestamp=datetime.now(),
                emotion=node["emotion"],
                interruptible=True
            )
            
            self.state.messages.append(message)
            self._update_stock_for_message(message)
            responses.append({
                "role": node["speaker"],
                "content": node["content"],
                "emotion": node["emotion"]
            })
            
            next_node_id = node["next_nodes"][0] if node.get("next_nodes") else None
            
            # Small delay between messages
            await asyncio.sleep(0.5)
        
        # Add consequence news
        self._add_consequence_news(decision.decision_type)
        
        return {
            "decision": decision.decision_type,
            "responses": responses,
            "new_stock_price": self.state.stock_price,
            "state": self.get_state()
        }
    
    def _add_consequence_news(self, decision_type: str):
        """Add news based on decision consequences"""
        news_map = {
            "pay_ransom": {
                "headline": "Company Pays Ransom, Data Still at Risk",
                "source": "CyberSecurity Daily",
                "severity": 9
            },
            "contact_fbi": {
                "headline": "FBI Investigating Major Data Breach at Tech Firm",
                "source": "Reuters",
                "severity": 10
            },
            "negotiate": {
                "headline": "Hackers Release Customer Data During Negotiations",
                "source": "TechCrunch",
                "severity": 9
            },
            "stall": {
                "headline": "Company Silent as Customer Data Held Hostage",
                "source": "WSJ",
                "severity": 8
            }
        }
        
        news_data = news_map.get(decision_type, news_map["stall"])
        self.state.news.append({
            "headline": news_data["headline"],
            "source": news_data["source"],
            "timestamp": datetime.now(),
            "severity": news_data["severity"]
        })
    
    async def process_user_input(self, content: str) -> dict:
        """Process free-form user input"""
        # Simple keyword matching for demo
        content_lower = content.lower()
        
        if "pay" in content_lower or "bitcoin" in content_lower:
            decision = UserDecision(decision_type="pay_ransom", content=content)
        elif "fbi" in content_lower or "police" in content_lower or "law" in content_lower:
            decision = UserDecision(decision_type="contact_fbi", content=content)
        elif "negotiate" in content_lower or "talk" in content_lower:
            decision = UserDecision(decision_type="negotiate", content=content)
        else:
            decision = UserDecision(decision_type="stall", content=content)
        
        return await self.process_decision(decision)
    
    def reset(self):
        """Reset simulation to initial state"""
        self.state = CrisisState()
        self.current_node_id = self.scenario["entry_node"]
        self.decision_history = []
        self.is_running = False
