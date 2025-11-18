"""Simple logging configuration for the trading bot."""
import logging
from logging import Logger


def setup_logging(name: str = "trading-bot", level: int = logging.INFO, logfile: str = "trading-bot.log") -> Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level)
    if not logger.handlers:
        fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
        ch = logging.StreamHandler()
        ch.setLevel(level)
        ch.setFormatter(fmt)
        logger.addHandler(ch)

        fh = logging.FileHandler(logfile)
        fh.setLevel(level)
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    return logger
