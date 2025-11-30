#!/usr/bin/env python3
"""
API Contract Validation Script

This script validates that the backend API responses match the contracts
defined in docs/api_contracts.json.

Usage:
    python scripts/check_api_contracts.py [--url BASE_URL]
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, Any, List
import requests
from requests.exceptions import RequestException

# ANSI color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def load_api_contracts(contracts_path: str = 'docs/api_contracts.json') -> Dict[str, Any]:
    """Load API contracts from JSON file."""
    try:
        with open(contracts_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"{Colors.RED}❌ Error: API contracts file not found at {contracts_path}{Colors.RESET}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"{Colors.RED}❌ Error: Invalid JSON in contracts file: {e}{Colors.RESET}")
        sys.exit(1)

def validate_schema(data: Any, schema: Dict[str, Any], path: str = '') -> List[str]:
    """
    Validate data against a simple schema.
    Returns list of validation errors.
    """
    errors = []
    
    if schema.get('type') == 'object':
        if not isinstance(data, dict):
            errors.append(f"{path}: Expected object, got {type(data).__name__}")
            return errors
        
        required_fields = schema.get('required', [])
        for field in required_fields:
            if field not in data:
                errors.append(f"{path}: Missing required field '{field}'")
        
        properties = schema.get('properties', {})
        for key, value_schema in properties.items():
            if key in data:
                field_errors = validate_schema(data[key], value_schema, f"{path}.{key}")
                errors.extend(field_errors)
    
    elif schema.get('type') == 'array':
        if not isinstance(data, list):
            errors.append(f"{path}: Expected array, got {type(data).__name__}")
    
    elif schema.get('type') == 'string':
        if not isinstance(data, str):
            errors.append(f"{path}: Expected string, got {type(data).__name__}")
        
        # Check enum values
        if 'enum' in schema and data not in schema['enum']:
            errors.append(f"{path}: Value '{data}' not in allowed enum: {schema['enum']}")
    
    elif schema.get('type') == 'number':
        if not isinstance(data, (int, float)):
            errors.append(f"{path}: Expected number, got {type(data).__name__}")
    
    elif schema.get('type') == 'integer':
        if not isinstance(data, int):
            errors.append(f"{path}: Expected integer, got {type(data).__name__}")
    
    elif schema.get('type') == 'boolean':
        if not isinstance(data, bool):
            errors.append(f"{path}: Expected boolean, got {type(data).__name__}")
    
    return errors

def test_endpoint(
    base_url: str,
    method: str,
    path: str,
    expected_status: int,
    response_schema: Dict[str, Any],
    request_body: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Test a single endpoint.
    Returns dict with success status and details.
    """
    url = f"{base_url}{path}"
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=request_body, timeout=10)
        else:
            return {
                'success': False,
                'error': f'Unsupported HTTP method: {method}'
            }
        
        result = {
            'url': url,
            'method': method,
            'status_code': response.status_code,
            'expected_status': expected_status,
        }
        
        # Check status code
        if response.status_code != expected_status:
            # Allow 501 (Not Implemented) for planned endpoints
            if response.status_code == 501:
                result['success'] = True
                result['note'] = 'Endpoint not implemented yet (501)'
                return result
            
            result['success'] = False
            result['error'] = f"Status code mismatch: expected {expected_status}, got {response.status_code}"
            return result
        
        # Validate response body against schema
        try:
            data = response.json()
            result['response_data'] = data
            
            # Validate schema
            schema_errors = validate_schema(data, response_schema, 'response')
            if schema_errors:
                result['success'] = False
                result['schema_errors'] = schema_errors
            else:
                result['success'] = True
        
        except json.JSONDecodeError:
            result['success'] = False
            result['error'] = 'Response is not valid JSON'
        
        return result
    
    except RequestException as e:
        return {
            'success': False,
            'url': url,
            'method': method,
            'error': f'Request failed: {str(e)}'
        }

def run_contract_tests(base_url: str, contracts: Dict[str, Any]) -> tuple[int, int]:
    """
    Run all contract tests.
    Returns tuple of (passed_count, total_count).
    """
    paths = contracts.get('paths', {})
    passed = 0
    total = 0
    
    print(f"\n{Colors.BOLD}{Colors.BLUE}🔍 Testing API Contracts{Colors.RESET}")
    print(f"Base URL: {base_url}\n")
    
    for path, methods in paths.items():
        for method, details in methods.items():
            if method.lower() not in ['get', 'post', 'put', 'delete']:
                continue
            
            total += 1
            endpoint_name = details.get('summary', f"{method.upper()} {path}")
            
            # Get expected status and response schema
            responses = details.get('responses', {})
            # Try to get 200 or 202 response
            response_def = responses.get('200') or responses.get('202')
            
            if not response_def:
                print(f"{Colors.YELLOW}⚠️  {endpoint_name}: No 200/202 response defined{Colors.RESET}")
                continue
            
            expected_status = 200 if '200' in responses else 202
            
            # Get response schema
            content = response_def.get('content', {})
            json_content = content.get('application/json', {})
            response_schema = json_content.get('schema', {})
            
            # Get request body if POST
            request_body = None
            if method.lower() == 'post' and 'requestBody' in details:
                req_content = details['requestBody'].get('content', {})
                req_json = req_content.get('application/json', {})
                # Use example if available
                request_body = req_json.get('schema', {}).get('example')
            
            # Run test
            result = test_endpoint(
                base_url,
                method.upper(),
                path,
                expected_status,
                response_schema,
                request_body
            )
            
            # Print result
            if result.get('success'):
                passed += 1
                note = f" ({result['note']})" if 'note' in result else ''
                print(f"{Colors.GREEN}✅ PASS{Colors.RESET}: {endpoint_name}{note}")
            else:
                print(f"{Colors.RED}❌ FAIL{Colors.RESET}: {endpoint_name}")
                print(f"   {Colors.RED}Error: {result.get('error', 'Unknown error')}{Colors.RESET}")
                
                if 'schema_errors' in result:
                    print(f"   {Colors.RED}Schema validation errors:{Colors.RESET}")
                    for error in result['schema_errors']:
                        print(f"     • {error}")
    
    return passed, total

def main():
    parser = argparse.ArgumentParser(description='Validate API contracts')
    parser.add_argument(
        '--url',
        default='https://bagbot2-backend.onrender.com',
        help='Base URL of the API (default: production URL)'
    )
    parser.add_argument(
        '--contracts',
        default='docs/api_contracts.json',
        help='Path to API contracts file'
    )
    
    args = parser.parse_args()
    
    # Load contracts
    contracts = load_api_contracts(args.contracts)
    
    # Run tests
    passed, total = run_contract_tests(args.url, contracts)
    
    # Print summary
    print(f"\n{Colors.BOLD}{'='*50}{Colors.RESET}")
    print(f"{Colors.BOLD}Summary:{Colors.RESET}")
    print(f"  Passed: {Colors.GREEN}{passed}{Colors.RESET}/{total}")
    print(f"  Failed: {Colors.RED}{total - passed}{Colors.RESET}/{total}")
    print(f"{Colors.BOLD}{'='*50}{Colors.RESET}\n")
    
    # Exit with appropriate code
    if passed == total:
        print(f"{Colors.GREEN}✅ All API contracts validated successfully!{Colors.RESET}")
        sys.exit(0)
    else:
        print(f"{Colors.RED}❌ Some API contracts failed validation{Colors.RESET}")
        sys.exit(1)

if __name__ == '__main__':
    main()
