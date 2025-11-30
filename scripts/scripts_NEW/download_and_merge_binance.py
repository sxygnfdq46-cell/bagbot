#!/usr/bin/env python3
"""
Download, extract, and merge Binance BTCSTUSDT 1h kline data.

Downloads all 1h kline .zip files for BTCSTUSDT from Binance public data
for the date range 2022-11-01 to 2022-11-30, extracts them, and merges
all CSV files into a single file for backtesting.

Pure Python, no threading, no async. Uses urllib from standard library.
"""

import os
import zipfile
from datetime import datetime, timedelta
from urllib.request import urlretrieve
from urllib.error import URLError, HTTPError


# Configuration
BASE_URL = "https://data.binance.vision/data/spot/monthly/klines/BTCSTUSDT/1h/"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tests", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "BTCSTUSDT-1h-merged.csv")

# Date range: November 2022
START_DATE = datetime(2022, 11, 1)
END_DATE = datetime(2022, 11, 30)


def ensure_data_dir():
    """Create data directory if it doesn't exist."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Created directory: {DATA_DIR}")


def generate_monthly_filenames(start_date, end_date):
    """
    Generate list of monthly zip filenames to download.
    Format: BTCSTUSDT-1h-2022-11.zip
    """
    filenames = []
    current = start_date.replace(day=1)
    end = end_date.replace(day=1)
    
    while current <= end:
        filename = f"BTCSTUSDT-1h-{current.year}-{current.month:02d}.zip"
        filenames.append(filename)
        # Move to next month
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)
    
    return filenames


def download_file(url, local_path):
    """Download a file from URL to local path."""
    try:
        print(f"Downloading: {url}")
        urlretrieve(url, local_path)
        print(f"  → Saved to: {local_path}")
        return True
    except (URLError, HTTPError) as e:
        print(f"  ✗ Failed to download: {e}")
        return False


def extract_zip(zip_path, extract_to):
    """Extract a zip file to specified directory."""
    try:
        print(f"Extracting: {zip_path}")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
        print(f"  → Extracted to: {extract_to}")
        return True
    except Exception as e:
        print(f"  ✗ Failed to extract: {e}")
        return False


def find_csv_files(directory):
    """Find all .csv files in directory, sorted by name (which sorts by date)."""
    csv_files = []
    for filename in os.listdir(directory):
        if filename.endswith('.csv') and filename.startswith('BTCSTUSDT'):
            csv_files.append(os.path.join(directory, filename))
    return sorted(csv_files)


def merge_csv_files(csv_files, output_file):
    """
    Merge multiple CSV files into one.
    CSVs have no headers, so simply concatenate line by line.
    """
    print(f"\nMerging {len(csv_files)} CSV files...")
    total_lines = 0
    
    with open(output_file, 'w') as outfile:
        for csv_file in csv_files:
            print(f"  Adding: {os.path.basename(csv_file)}")
            with open(csv_file, 'r') as infile:
                lines = infile.readlines()
                outfile.writelines(lines)
                total_lines += len(lines)
    
    print(f"\n✓ Merged {total_lines} lines into: {output_file}")
    return total_lines


def cleanup_files(directory, pattern):
    """Remove files matching pattern from directory."""
    print("\nCleaning up temporary files...")
    removed = 0
    for filename in os.listdir(directory):
        if pattern in filename and (filename.endswith('.zip') or filename.endswith('.csv')):
            if filename != os.path.basename(OUTPUT_FILE):  # Don't delete merged file
                filepath = os.path.join(directory, filename)
                os.remove(filepath)
                removed += 1
    print(f"  Removed {removed} temporary files")


def main():
    """Main execution flow."""
    print("=" * 70)
    print("Binance BTCSTUSDT 1h Kline Data Download & Merge")
    print("=" * 70)
    print(f"Date Range: {START_DATE.date()} to {END_DATE.date()}")
    print(f"Output File: {OUTPUT_FILE}")
    print("=" * 70 + "\n")
    
    # Step 1: Ensure data directory exists
    ensure_data_dir()
    
    # Step 2: Generate list of files to download
    filenames = generate_monthly_filenames(START_DATE, END_DATE)
    print(f"\nFiles to download: {len(filenames)}")
    for fn in filenames:
        print(f"  - {fn}")
    
    # Step 3: Download each zip file
    print("\n" + "=" * 70)
    print("DOWNLOADING FILES")
    print("=" * 70 + "\n")
    
    downloaded_files = []
    for filename in filenames:
        url = BASE_URL + filename
        local_path = os.path.join(DATA_DIR, filename)
        
        # Skip if already downloaded
        if os.path.exists(local_path):
            print(f"Already exists: {filename}")
            downloaded_files.append(local_path)
            continue
        
        if download_file(url, local_path):
            downloaded_files.append(local_path)
    
    print(f"\n✓ Downloaded {len(downloaded_files)} files")
    
    # Step 4: Extract all zip files
    print("\n" + "=" * 70)
    print("EXTRACTING FILES")
    print("=" * 70 + "\n")
    
    for zip_path in downloaded_files:
        extract_zip(zip_path, DATA_DIR)
    
    # Step 5: Find all extracted CSV files
    csv_files = find_csv_files(DATA_DIR)
    print(f"\n✓ Found {len(csv_files)} CSV files to merge")
    
    # Step 6: Merge all CSVs into single file
    print("\n" + "=" * 70)
    print("MERGING CSV FILES")
    print("=" * 70 + "\n")
    
    total_lines = merge_csv_files(csv_files, OUTPUT_FILE)
    
    # Step 7: Cleanup temporary files
    cleanup_files(DATA_DIR, "BTCSTUSDT")
    
    # Final summary
    print("\n" + "=" * 70)
    print("COMPLETE")
    print("=" * 70)
    print(f"✓ Merged file: {OUTPUT_FILE}")
    print(f"✓ Total candles: {total_lines}")
    print(f"✓ Ready for backtesting!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
