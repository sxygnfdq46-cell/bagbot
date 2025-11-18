"""multi_agg - utilities for loading and normalizing multi-ticker OHLCV data

Functions
---------
build_unified_df(path_to_parquet)
    Load combined parquet (date,ticker,open,high,low,close,volume), validate, sort,
    forward-fill missing trading days per ticker, save per-ticker daily and weekly
    parquet files under `data/processed/`, and return the cleaned DataFrame.

The weekly files are resampled using business-week end (Fri) and aggregated with:
  open: first, high: max, low: min, close: last, volume: sum

The daily files are the filled daily series after reindexing to business days.
"""
from __future__ import annotations

import os
from typing import Optional

import pandas as pd


EXPECTED_COLS = ['date', 'ticker', 'open', 'high', 'low', 'close', 'volume']


def _validate_df(df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in EXPECTED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f'Missing columns in input parquet: {missing}')

    # coerce dtypes
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['ticker'] = df['ticker'].astype(str)

    # numeric columns
    for c in ['open', 'high', 'low', 'close']:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    df['volume'] = pd.to_numeric(df['volume'], errors='coerce')

    return df


def _ensure_dirs(base: str):
    daily_dir = os.path.join(base, 'processed', 'daily')
    weekly_dir = os.path.join(base, 'processed', 'weekly')
    os.makedirs(daily_dir, exist_ok=True)
    os.makedirs(weekly_dir, exist_ok=True)
    return daily_dir, weekly_dir


def _resample_weekly(df: pd.DataFrame) -> pd.DataFrame:
    # df indexed by date, contains open/high/low/close/volume
    agg = {
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }
    # resample to business-week end (Fri)
    weekly = df.resample('W-FRI').agg(agg)
    return weekly


def build_unified_df(path_to_parquet: str, out_base: Optional[str] = 'data') -> pd.DataFrame:
    """Load combined parquet, validate, fill missing trading days per ticker, save per-ticker daily and weekly parquet files.

    Parameters
    ----------
    path_to_parquet : str
        Path to combined parquet produced by `scripts/fetch_data_yfinance.py` (columns: date,ticker,open,high,low,close,volume).
    out_base : str, optional
        Base output directory where `processed/daily` and `processed/weekly` folders will be created (default: `data`).

    Returns
    -------
    pd.DataFrame
        Cleaned and filled dataframe with columns: date,ticker,open,high,low,close,volume
    """
    if not os.path.exists(path_to_parquet):
        raise FileNotFoundError(f'Parquet file not found: {path_to_parquet}')

    df = pd.read_parquet(path_to_parquet)
    df = _validate_df(df)

    # sort
    df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

    daily_dir, weekly_dir = _ensure_dirs(out_base)

    processed_frames = []

    # process per ticker
    for ticker, group in df.groupby('ticker'):
        g = group.set_index('date').sort_index()

        # create business day index from min to max
        idx = pd.date_range(start=g.index.min(), end=g.index.max(), freq='B')

        # reindex to business days
        g_re = g.reindex(idx)

        # forward-fill price columns
        for c in ['open', 'high', 'low', 'close']:
            if c in g_re.columns:
                g_re[c] = g_re[c].ffill()

        # volume: set to 0 for filled days (no trades)
        if 'volume' in g_re.columns:
            g_re['volume'] = g_re['volume'].fillna(0)

        g_re = g_re.rename_axis('date').reset_index()
        g_re['ticker'] = ticker

        # save per-ticker daily parquet
        daily_path = os.path.join(daily_dir, f'{ticker}.parquet')
        g_re[['date', 'ticker', 'open', 'high', 'low', 'close', 'volume']].to_parquet(daily_path, index=False)

        # resample weekly
        g_re_idx = g_re.set_index('date')
        weekly = _resample_weekly(g_re_idx[['open', 'high', 'low', 'close', 'volume']])
        weekly = weekly.reset_index()
        weekly['ticker'] = ticker
        weekly_path = os.path.join(weekly_dir, f'{ticker}.parquet')
        weekly[['date', 'ticker', 'open', 'high', 'low', 'close', 'volume']].to_parquet(weekly_path, index=False)

        processed_frames.append(g_re[['date', 'ticker', 'open', 'high', 'low', 'close', 'volume']])

    if processed_frames:
        unified = pd.concat(processed_frames, ignore_index=True)
        unified = unified.sort_values(['ticker', 'date']).reset_index(drop=True)
    else:
        unified = df[['date', 'ticker', 'open', 'high', 'low', 'close', 'volume']].copy()

    return unified
