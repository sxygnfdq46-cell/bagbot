from worker.ai.predictor import AIPredictor

class AIDecisionEngine:
    def __init__(self, predictor=None):
        self.predictor = predictor or AIPredictor()
    
    def evaluate(self, market_state):
        return self.predictor.predict(market_state)
