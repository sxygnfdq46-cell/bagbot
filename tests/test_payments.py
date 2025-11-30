"""
Tests for Stripe payment integration
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import json

from backend.main import app
from backend.models import Base, engine, SessionLocal, Subscription

client = TestClient(app)


@pytest.fixture
def db_session():
    """Create a clean database for each test"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def mock_stripe_key():
    """Mock Stripe API key"""
    with patch.dict('os.environ', {'STRIPE_SECRET_KEY': 'sk_test_mock'}):
        yield


class TestCheckoutSession:
    """Tests for checkout session creation"""
    
    @patch('stripe.checkout.Session.create')
    def test_create_checkout_session_success(self, mock_stripe_create, db_session, mock_stripe_key):
        """Test successful checkout session creation"""
        mock_stripe_create.return_value = MagicMock(
            url="https://checkout.stripe.com/pay/test_session",
            id="cs_test_123"
        )
        
        response = client.post(
            "/api/payments/create-checkout-session",
            json={
                "plan": "pro",
                "user_id": "user_123",
                "success_url": "https://bagbot.com/success",
                "cancel_url": "https://bagbot.com/cancel"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "checkout_url" in data
        assert data["session_id"] == "cs_test_123"
        assert mock_stripe_create.called
    
    def test_create_checkout_session_invalid_plan(self, db_session, mock_stripe_key):
        """Test checkout session with invalid plan"""
        response = client.post(
            "/api/payments/create-checkout-session",
            json={
                "plan": "invalid_plan",
                "user_id": "user_123",
                "success_url": "https://bagbot.com/success",
                "cancel_url": "https://bagbot.com/cancel"
            }
        )
        
        assert response.status_code == 400
        assert "Invalid plan" in response.json()["detail"]
    
    @patch('stripe.checkout.Session.create')
    def test_create_checkout_session_existing_active_sub(self, mock_stripe_create, db_session, mock_stripe_key):
        """Test checkout session when user already has active subscription"""
        # Create existing subscription
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="basic",
            status="active",
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db_session.add(subscription)
        db_session.commit()
        
        response = client.post(
            "/api/payments/create-checkout-session",
            json={
                "plan": "pro",
                "user_id": "user_123",
                "success_url": "https://bagbot.com/success",
                "cancel_url": "https://bagbot.com/cancel"
            }
        )
        
        assert response.status_code == 400
        assert "already has an active subscription" in response.json()["detail"]


class TestWebhook:
    """Tests for Stripe webhook handling"""
    
    def create_webhook_event(self, event_type: str, data: dict) -> dict:
        """Helper to create mock webhook event"""
        return {
            "type": event_type,
            "data": {
                "object": data
            }
        }
    
    @patch('stripe.Webhook.construct_event')
    @patch('stripe.Subscription.retrieve')
    def test_webhook_checkout_completed(self, mock_retrieve, mock_construct, db_session):
        """Test webhook handling for checkout.session.completed"""
        # Mock Stripe webhook verification
        mock_construct.return_value = self.create_webhook_event(
            "checkout.session.completed",
            {
                "id": "cs_test_123",
                "subscription": "sub_123",
                "customer": "cus_123",
                "metadata": {
                    "user_id": "user_123",
                    "plan": "pro"
                }
            }
        )
        
        # Mock subscription retrieval
        mock_retrieve.return_value = {
            "id": "sub_123",
            "status": "active",
            "current_period_end": int((datetime.utcnow() + timedelta(days=30)).timestamp())
        }
        
        response = client.post(
            "/api/payments/webhook",
            headers={"Stripe-Signature": "mock_signature"},
            content=b'{"type":"checkout.session.completed"}'
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        
        # Verify subscription created in database
        subscription = db_session.query(Subscription).filter(
            Subscription.user_id == "user_123"
        ).first()
        assert subscription is not None
        assert subscription.stripe_subscription_id == "sub_123"
        assert subscription.plan == "pro"
        assert subscription.status == "active"
    
    @patch('stripe.Webhook.construct_event')
    def test_webhook_subscription_updated(self, mock_construct, db_session):
        """Test webhook handling for customer.subscription.updated"""
        # Create existing subscription
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="basic",
            status="active",
            current_period_end=datetime.utcnow() + timedelta(days=15)
        )
        db_session.add(subscription)
        db_session.commit()
        
        # Mock webhook event
        new_period_end = datetime.utcnow() + timedelta(days=30)
        mock_construct.return_value = self.create_webhook_event(
            "customer.subscription.updated",
            {
                "id": "sub_123",
                "status": "active",
                "current_period_end": int(new_period_end.timestamp()),
                "metadata": {
                    "plan": "pro"
                }
            }
        )
        
        response = client.post(
            "/api/payments/webhook",
            headers={"Stripe-Signature": "mock_signature"},
            content=b'{"type":"customer.subscription.updated"}'
        )
        
        assert response.status_code == 200
        
        # Verify subscription updated
        db_session.refresh(subscription)
        assert subscription.plan == "pro"
        assert subscription.status == "active"
    
    @patch('stripe.Webhook.construct_event')
    def test_webhook_subscription_deleted(self, mock_construct, db_session):
        """Test webhook handling for customer.subscription.deleted"""
        # Create existing subscription
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="pro",
            status="active",
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db_session.add(subscription)
        db_session.commit()
        
        # Mock webhook event
        mock_construct.return_value = self.create_webhook_event(
            "customer.subscription.deleted",
            {
                "id": "sub_123",
                "status": "canceled"
            }
        )
        
        response = client.post(
            "/api/payments/webhook",
            headers={"Stripe-Signature": "mock_signature"},
            content=b'{"type":"customer.subscription.deleted"}'
        )
        
        assert response.status_code == 200
        
        # Verify subscription canceled
        db_session.refresh(subscription)
        assert subscription.status == "canceled"
    
    @patch('stripe.Webhook.construct_event')
    def test_webhook_payment_failed(self, mock_construct, db_session):
        """Test webhook handling for invoice.payment_failed"""
        # Create existing subscription
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="pro",
            status="active",
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db_session.add(subscription)
        db_session.commit()
        
        # Mock webhook event
        mock_construct.return_value = self.create_webhook_event(
            "invoice.payment_failed",
            {
                "subscription": "sub_123",
                "attempt_count": 1
            }
        )
        
        response = client.post(
            "/api/payments/webhook",
            headers={"Stripe-Signature": "mock_signature"},
            content=b'{"type":"invoice.payment_failed"}'
        )
        
        assert response.status_code == 200
        
        # Verify subscription marked as past_due
        db_session.refresh(subscription)
        assert subscription.status == "past_due"
    
    @patch('stripe.Webhook.construct_event')
    def test_webhook_invalid_signature(self, mock_construct):
        """Test webhook with invalid signature"""
        mock_construct.side_effect = Exception("Invalid signature")
        
        response = client.post(
            "/api/payments/webhook",
            headers={"Stripe-Signature": "invalid_signature"},
            content=b'{"type":"test"}'
        )
        
        assert response.status_code == 400


class TestSubscriptionModel:
    """Tests for Subscription model"""
    
    def test_is_active_true(self, db_session):
        """Test is_active returns True for active subscription"""
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="pro",
            status="active",
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        assert subscription.is_active() is True
    
    def test_is_active_false_expired(self, db_session):
        """Test is_active returns False for expired subscription"""
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="pro",
            status="active",
            current_period_end=datetime.utcnow() - timedelta(days=1)
        )
        assert subscription.is_active() is False
    
    def test_is_active_false_canceled(self, db_session):
        """Test is_active returns False for canceled subscription"""
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="pro",
            status="canceled",
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        assert subscription.is_active() is False
    
    def test_is_active_true_trialing(self, db_session):
        """Test is_active returns True for trialing subscription"""
        subscription = Subscription(
            user_id="user_123",
            stripe_subscription_id="sub_123",
            plan="pro",
            status="trialing",
            current_period_end=datetime.utcnow() + timedelta(days=7)
        )
        assert subscription.is_active() is True
