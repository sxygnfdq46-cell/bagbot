class AIPredictor:
    def __init__(self, model=None):
        self.model = model
    
    def predict(self, market_state):
        return {"decision": None}
