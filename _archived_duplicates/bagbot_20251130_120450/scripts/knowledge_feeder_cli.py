#!/usr/bin/env python3
"""Knowledge Feeder CLI - Upload knowledge to bot."""

import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from bagbot.trading.knowledge_ingestion_engine import KnowledgeIngestionEngine


def main():
    parser = argparse.ArgumentParser(description="Feed knowledge to BAGBOT2")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Upload PDF
    pdf_parser = subparsers.add_parser("pdf", help="Upload PDF document")
    pdf_parser.add_argument("path", help="Path to PDF file")
    
    # Upload text
    text_parser = subparsers.add_parser("text", help="Upload text content")
    text_parser.add_argument("content", help="Text content to ingest")
    text_parser.add_argument("--source", default="cli", help="Source identifier")
    
    # Show summary
    subparsers.add_parser("summary", help="Show knowledge summary")
    
    # Apply knowledge
    subparsers.add_parser("apply", help="Apply knowledge to systems")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize engine
    engine = KnowledgeIngestionEngine()
    
    if args.command == "pdf":
        print(f"📄 Uploading PDF: {args.path}")
        result = engine.ingest_pdf(args.path)
        print(f"✅ Extracted {result['concepts_extracted']} concepts")
    
    elif args.command == "text":
        print(f"📝 Processing text...")
        result = engine.ingest_text(args.content, args.source)
        print(f"✅ Extracted {result['concepts_extracted']} concepts")
    
    elif args.command == "summary":
        summary = engine.get_knowledge_summary()
        print("\n📚 Knowledge Summary:")
        print(f"Total concepts: {summary['total_concepts']}")
        print(f"\nBy category:")
        for cat, count in summary['by_category'].items():
            print(f"  - {cat}: {count}")
        print(f"\nLatest concepts:")
        for concept in summary['latest_concepts']:
            print(f"  - {concept}")
    
    elif args.command == "apply":
        print("🔧 Applying knowledge to systems...")
        result = engine.apply_knowledge_to_systems()
        print(f"✅ Strategy updates: {result['strategy_updates']}")
        print(f"✅ Risk updates: {result['risk_updates']}")
        print(f"✅ Psychology updates: {result['psychology_updates']}")


if __name__ == "__main__":
    main()
