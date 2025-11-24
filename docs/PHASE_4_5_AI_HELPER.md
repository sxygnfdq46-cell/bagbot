# Phase 4.5: AI Service Chat Helper

## 📋 Overview

The AI Service Chat Helper is an intelligent assistant system that guides users across the entire BAGBOT2 platform. It provides natural language query handling, context-aware responses, and integration with all platform components.

## 🏗️ Architecture

### Core Components

#### 1. **Chat Engine** (`chat_engine.py`)
Main natural language interface for the platform.

**Features:**
- Natural language query processing
- Context-aware responses
- Conversation history tracking
- Multi-intent query handling

**Key Methods:**
```python
process_query(query: str) -> Dict[str, Any]
get_conversation_history() -> List[Dict]
```

**Example:**
```python
from bagbot.ai_service_helper.chat_engine import ChatEngine

engine = ChatEngine()
response = engine.process_query("What is an order block?")
print(response["answer"])
```

#### 2. **Router** (`router.py`)
Intelligent query routing to appropriate sub-modules.

**Intent Types:**
- `STRATEGY_EXPLANATION` - Strategy queries
- `MARKET_EXPLANATION` - Market condition queries
- `PLATFORM_FAQ` - Platform how-to questions
- `TROUBLESHOOTING` - Error diagnosis
- `PERSONALIZATION` - Recommendations
- `GENERAL` - Other queries

**Key Methods:**
```python
detect_intent(query: str) -> QueryIntent
route(query: str) -> Dict[str, Any]
```

**Example:**
```python
from bagbot.ai_service_helper.router import Router

router = Router()
intent = router.detect_intent("How does mean reversion work?")
routing = router.route("How does mean reversion work?")
print(f"Module: {routing['module']}, Priority: {routing['priority']}")
```

#### 3. **Knowledge Bridge** (`knowledge_bridge.py`)
Connects uploaded PDFs/books to AI answers.

**Features:**
- Searches uploaded documents
- Returns relevant concepts
- Confidence scoring

**Key Methods:**
```python
answer_from_knowledge(query: str) -> Dict[str, Any]
search_concepts(keywords: List[str]) -> List[Concept]
get_concepts_by_category(category: str) -> List[Concept]
```

**Example:**
```python
from bagbot.ai_service_helper.knowledge_bridge import KnowledgeBridge

bridge = KnowledgeBridge()
result = bridge.answer_from_knowledge("What is risk management?")
for concept in result["concepts"]:
    print(f"- {concept['name']}: {concept['description']}")
```

#### 4. **FAQ Engine** (`faq_engine.py`)
Handles platform FAQs with pre-loaded Q&A database.

**Categories:**
- Setup & Getting Started
- Trading Settings
- Strategies
- Subscription & Billing
- Error Resolution

**Key Methods:**
```python
search(query: str) -> Dict[str, Any]
get_category_faqs(category: str) -> List[Dict]
```

**Example:**
```python
from bagbot.ai_service_helper.faq_engine import FAQEngine

engine = FAQEngine()
result = engine.search("How do I connect to Binance?")
if result["found"]:
    print(result["answer"])
```

#### 5. **Troubleshooting Engine** (`troubleshooting_engine.py`)
Diagnoses errors and suggests fixes.

**Error Patterns:**
- API key invalid (401)
- Insufficient balance
- Rate limiting (429)
- Network timeouts
- Invalid symbols
- Strategy not running
- Position rejected

**Key Methods:**
```python
diagnose(error_message: str) -> Dict[str, Any]
suggest_fixes(problem: str) -> Dict[str, Any]
explain_error_code(code: int) -> str
```

**Example:**
```python
from bagbot.ai_service_helper.troubleshooting_engine import TroubleshootingEngine

engine = TroubleshootingEngine()
result = engine.diagnose("401 Unauthorized: Invalid API key")
print(f"Error: {result['error_type']}")
for solution in result["solutions"]:
    print(f"- {solution}")
```

#### 6. **Personalization Engine** (`personalization_engine.py`)
Profile-aware recommendations based on experience, risk tolerance, and capital.

**Key Methods:**
```python
get_strategy_recommendations(experience_level: str, risk_tolerance: str, capital: float) -> Dict[str, Any]
get_risk_settings_recommendation(risk_tolerance: str, capital: float) -> Dict[str, Any]
get_market_recommendations(capital: float, experience_level: str) -> Dict[str, Any]
```

**Example:**
```python
from bagbot.ai_service_helper.personalization_engine import PersonalizationEngine

engine = PersonalizationEngine()
result = engine.get_strategy_recommendations(
    experience_level="beginner",
    risk_tolerance="low",
    capital=1000.0
)
for rec in result["recommendations"]:
    print(f"- {rec['strategy']}: {rec['reason']}")
```

#### 7. **Strategy Explainer** (`strategy_explainer.py`)
Detailed strategy explanations with live condition assessment.

**Strategies Covered:**
1. Order Blocks
2. Fair Value Gaps (FVG)
3. Liquidity Sweeps
4. Breaker Blocks
5. Mean Reversion
6. Trend Continuation
7. Volatility Breakouts
8. Supply/Demand Zones
9. Micro Trend Follower

**Key Methods:**
```python
explain_strategy(strategy_name: str, include_live_conditions: bool = False) -> Dict[str, Any]
compare_strategies(strategy1: str, strategy2: str) -> Dict[str, Any]
```

**Example:**
```python
from bagbot.ai_service_helper.strategy_explainer import StrategyExplainer

explainer = StrategyExplainer()
result = explainer.explain_strategy("Order Blocks", include_live_conditions=True)
print(result["explanation"])
if "suitability" in result:
    print(f"Current Suitability: {result['suitability']['assessment']}")
```

#### 8. **Market Explainer** (`market_explainer.py`)
Explains current market conditions, bias, and recommendations.

**Features:**
- Market bias explanation (RISK_ON/RISK_OFF/NEUTRAL/UNCERTAIN)
- Daily market summary
- Volatility assessment
- Strategy recommendations for current conditions
- Spread & slippage education

**Key Methods:**
```python
async get_market_summary() -> Dict[str, Any]
explain_bias(bias: str) -> str
explain_volatility(symbol: str, volatility_level: str) -> str
get_strategy_recommendations_for_conditions(market_context: Dict) -> Dict[str, Any]
```

**Example:**
```python
from bagbot.ai_service_helper.market_explainer import MarketExplainer

explainer = MarketExplainer()
summary = await explainer.get_market_summary()
print(summary["summary"])
```

#### 9. **Context Memory** (`context_memory.py`)
Short-term conversation memory per session.

**Features:**
- Per-session conversation history
- No long-term storage (privacy compliant)
- Follow-up intent detection
- Automatic session cleanup

**Key Methods:**
```python
add_interaction(session_id: str, role: str, content: str, metadata: Optional[Dict] = None) -> None
get_session_history(session_id: str, limit: Optional[int] = None) -> List[Dict]
get_context_summary(session_id: str) -> str
clear_session(session_id: str) -> None
```

**Example:**
```python
from bagbot.ai_service_helper.context_memory import ContextMemory

memory = ContextMemory()
memory.add_interaction("user123", "user", "What is mean reversion?")
memory.add_interaction("user123", "assistant", "Mean reversion is...")

history = memory.get_session_history("user123")
for item in history:
    print(f"{item['role']}: {item['content']}")
```

## 🔗 Integration

### Phase 4 System Integration

The AI Service Helper integrates with all Phase 4 systems:

1. **Knowledge Ingestion Engine**
   - Knowledge Bridge queries uploaded PDFs/books
   - Returns relevant concepts with confidence scores

2. **News Anchor**
   - Market Explainer uses for bias/risk level
   - Strategy Explainer assesses live conditions
   - Chat Engine provides trading recommendations

3. **Strategy Arsenal**
   - Strategy Explainer accesses strategy definitions
   - Personalization Engine recommends strategies
   - Chat Engine provides strategy details

4. **HTM Adapter**
   - Market Explainer queries HTF directional bias
   - Used for trend/counter-trend assessment

## 🧪 Testing

### Running Tests

```bash
# Run all AI Helper tests
pytest bagbot/ai_service_helper/tests/test_ai_service_helper.py -v

# Run specific test class
pytest bagbot/ai_service_helper/tests/test_ai_service_helper.py::TestRouter -v

# Run with coverage
pytest bagbot/ai_service_helper/tests/ --cov=bagbot.ai_service_helper
```

### Test Coverage

- **Router Tests (6 tests)**: Intent detection, routing logic
- **FAQ Engine Tests (4 tests)**: Search, confidence, categories
- **Troubleshooting Engine Tests (5 tests)**: Error diagnosis, fixes, error codes
- **Personalization Engine Tests (5 tests)**: Strategy recommendations, risk settings, market recommendations
- **Context Memory Tests (6 tests)**: Session management, history, isolation

**Total: 26 unit tests**

## 📊 Usage Examples

### Complete Conversation Flow

```python
from bagbot.ai_service_helper.chat_engine import ChatEngine
from bagbot.ai_service_helper.context_memory import ContextMemory

# Initialize
chat = ChatEngine()
memory = ContextMemory()
session_id = "user123"

# User asks about strategy
query1 = "What is an order block?"
response1 = chat.process_query(query1)
memory.add_interaction(session_id, "user", query1)
memory.add_interaction(session_id, "assistant", response1["answer"])

# User asks follow-up
query2 = "Is it good for beginners?"
context = memory.get_context_summary(session_id)
response2 = chat.process_query(query2)
memory.add_interaction(session_id, "user", query2)
memory.add_interaction(session_id, "assistant", response2["answer"])

# Get conversation history
history = memory.get_session_history(session_id)
for item in history:
    print(f"{item['role']}: {item['content'][:50]}...")
```

### Error Troubleshooting Flow

```python
from bagbot.ai_service_helper.troubleshooting_engine import TroubleshootingEngine

engine = TroubleshootingEngine()

# Diagnose error
error_msg = "binance.exceptions.APIException: {'code': -2015, 'msg': 'Invalid API-key'}"
diagnosis = engine.diagnose(error_msg)

if diagnosis["diagnosed"]:
    print(f"Error Type: {diagnosis['error_type']}")
    print(f"Severity: {diagnosis['severity']}")
    print("\nSolutions:")
    for solution in diagnosis["solutions"]:
        print(f"  - {solution}")
```

### Personalized Recommendations

```python
from bagbot.ai_service_helper.personalization_engine import PersonalizationEngine

engine = PersonalizationEngine()

# Get recommendations for user profile
user_profile = {
    "experience_level": "intermediate",
    "risk_tolerance": "medium",
    "capital": 5000.0,
    "market_preference": "crypto"
}

# Strategy recommendations
strategies = engine.get_strategy_recommendations(**user_profile)
print("Recommended Strategies:")
for rec in strategies["recommendations"]:
    print(f"  - {rec['strategy']}: {rec['reason']}")

# Risk settings
risk_settings = engine.get_risk_settings_recommendation(
    user_profile["risk_tolerance"],
    user_profile["capital"]
)
print(f"\nRisk Settings:")
print(f"  Max Risk Per Trade: {risk_settings['max_risk_per_trade']*100}%")
print(f"  Max Position Size: {risk_settings['max_position_size']*100}%")
```

## ⚠️ Limitations

1. **No Long-term Memory**: Context Memory is session-based only
2. **Keyword-based Intent**: Router uses keyword matching, not ML
3. **Pre-loaded FAQs**: FAQ database is static (not learning)
4. **English Only**: No multi-language support
5. **No Voice Input**: Text-only interface
6. **Limited Context**: Max 20 interactions per session

## 🚀 Future Enhancements

1. **Machine Learning**: Replace keyword routing with ML-based intent classification
2. **Multi-language**: Add translation support
3. **Voice Interface**: Add speech-to-text capabilities
4. **Dynamic FAQ**: Learn from user queries to expand FAQ database
5. **Long-term Memory**: User preference storage (with consent)
6. **Advanced NLP**: Use embeddings for better semantic search

## 📝 API Integration

### REST Endpoints (Future)

```
POST /api/chat/query
Body: { "session_id": "string", "query": "string" }
Response: { "answer": "string", "intent": "string", "metadata": {} }

GET /api/chat/history/:session_id
Response: { "history": [...], "summary": "string" }

POST /api/troubleshoot
Body: { "error_message": "string" }
Response: { "error_type": "string", "solutions": [...] }

GET /api/strategies/:name
Response: { "explanation": "string", "mechanics": {...} }
```

## 📚 Development Notes

### Adding New FAQs

Edit `faq_engine.py` and add to the `_load_faqs()` method:

```python
"new_category": [
    {
        "question": "Your question?",
        "answer": "Your answer..."
    }
]
```

### Adding New Error Patterns

Edit `troubleshooting_engine.py` and add to `_load_error_patterns()`:

```python
{
    "error_type": "new_error",
    "pattern": r"your regex pattern",
    "severity": "high|medium|low",
    "solutions": [...]
}
```

### Adding New Strategies

Edit `strategy_explainer.py` and add to `_load_strategy_info()`:

```python
"Strategy Name": {
    "description": "...",
    "mechanics": "...",
    "strengths": [...],
    "weaknesses": [...],
    "best_conditions": "...",
    "risk_notes": "...",
    "htf_integration": "...",
    "news_integration": "..."
}
```

## ✅ Implementation Status

- ✅ Chat Engine (450 lines)
- ✅ Router (150 lines)
- ✅ Knowledge Bridge (130 lines)
- ✅ FAQ Engine (230 lines)
- ✅ Troubleshooting Engine (350 lines)
- ✅ Personalization Engine (150 lines)
- ✅ Strategy Explainer (500 lines)
- ✅ Market Explainer (200 lines)
- ✅ Context Memory (150 lines)
- ✅ Unit Tests (26 tests)
- ✅ Documentation

**Total: ~2,900 lines of production code + 400 lines tests + documentation**

---

**Phase 4.5 Complete** ✅
