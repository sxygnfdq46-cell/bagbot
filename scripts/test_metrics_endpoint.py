#!/usr/bin/env python3
"""
Metrics Endpoint Smoke Test

Validates that the /api/metrics endpoint emits Prometheus format metrics
including Redis-backed job metrics.

Usage:
    python3 scripts/test_metrics_endpoint.py [base_url]
    
Examples:
    python3 scripts/test_metrics_endpoint.py http://localhost:8000
    python3 scripts/test_metrics_endpoint.py https://bagbot-backend.onrender.com
"""
import sys
import requests


def test_metrics_endpoint(base_url: str = "http://localhost:8000") -> bool:
    """
    Test that /api/metrics endpoint returns Prometheus metrics.
    
    Expected metrics:
    - bagbot_job_enqueue_total
    - bagbot_job_run_total
    - bagbot_job_run_duration_seconds
    - bagbot_retry_scheduled_total
    - bagbot_heartbeat_age_seconds
    """
    url = f"{base_url.rstrip('/')}/api/metrics"
    
    print(f"Testing metrics endpoint: {url}")
    print("-" * 60)
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch metrics: {e}")
        return False
    
    content = response.text
    
    # Check content type
    if response.headers.get("Content-Type") != "text/plain; version=0.0.4; charset=utf-8":
        print(f"⚠️  Unexpected content type: {response.headers.get('Content-Type')}")
    
    # Expected metrics
    expected_metrics = [
        "bagbot_job_enqueue_total",
        "bagbot_job_run_total", 
        "bagbot_job_run_duration_seconds",
        "bagbot_retry_scheduled_total",
        "bagbot_heartbeat_age_seconds",
    ]
    
    found_metrics = []
    missing_metrics = []
    
    for metric in expected_metrics:
        if metric in content:
            found_metrics.append(metric)
            print(f"✓ Found metric: {metric}")
        else:
            missing_metrics.append(metric)
            print(f"✗ Missing metric: {metric}")
    
    print("-" * 60)
    
    if missing_metrics:
        print(f"⚠️  Warning: {len(missing_metrics)} expected metrics not found")
        print(f"   Missing: {', '.join(missing_metrics)}")
        print(f"   Note: Metrics may not appear until jobs are processed")
    
    if found_metrics:
        print(f"✓ Found {len(found_metrics)}/{len(expected_metrics)} expected metrics")
        print("\nSample metrics output:")
        print("-" * 60)
        # Print first 20 lines of metrics
        lines = content.split('\n')[:20]
        for line in lines:
            if line.strip():
                print(line)
        print("...")
        return True
    else:
        print("❌ No expected metrics found in response")
        return False


if __name__ == "__main__":
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    success = test_metrics_endpoint(base_url)
    
    if success:
        print("\n✅ Metrics endpoint test passed")
        sys.exit(0)
    else:
        print("\n❌ Metrics endpoint test failed")
        sys.exit(1)
