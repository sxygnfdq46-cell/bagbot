"""RitterTradingEnv: Gym-style trading environment and OU price simulator.

Implements:
- `RitterTradingEnv` (gym.Env-compatible)
- OU log-price simulator and helpers
- fit_ou_helper to estimate lambda & sigma from price series
- smoke_test function to run a random policy for quick validation

Notes:
- Observation is a dict as requested. Action is a discrete integer mapped to delta_n in [-K..K].
"""
from typing import Optional, Dict, Any, Tuple
import math
import json
import os
import numpy as np
import pandas as pd

try:
    import gym
    from gym import spaces
except Exception:
    # Lightweight stand-in for gym spaces if gym not available
    class spaces:
        class Box:
            def __init__(self, low, high, shape=None, dtype=np.float32):
                pass
        class Discrete:
            def __init__(self, n):
                pass
        class Dict:
            def __init__(self, d):
                pass


class OUProcess:
    """Ornstein-Uhlenbeck on log-price: x_{t+1} = (1-lambda)*x_t + sigma*eps."""

    def __init__(self, p_eq: float = 50000.0, half_life: float = 86400.0, sigma: float = 0.001):
        self.p_eq = float(p_eq)
        self.half_life = float(half_life)
        self.lmbda = math.log(2) / float(max(1e-9, half_life))
        self.sigma = float(sigma)

    def step(self, x_t: float) -> float:
        eps = np.random.randn()
        x_next = (1 - self.lmbda) * x_t + self.sigma * eps
        return x_next

    def simulate(self, n_steps: int, x0: float = 0.0) -> np.ndarray:
        xs = np.empty(n_steps, dtype=float)
        x = x0
        for i in range(n_steps):
            x = self.step(x)
            xs[i] = x
        ps = self.p_eq * np.exp(xs)
        return ps

    @staticmethod
    def fit_from_prices(prices: np.ndarray, p_eq: Optional[float] = None) -> Tuple[float, float]:
        """Estimate discrete lambda and sigma from log-price series (method of moments).
        Returns (lambda_est, sigma_est) where lambda = ln2 / half_life.
        """
        logp = np.log(prices / (p_eq or np.median(prices)))
        x = logp[:-1]
        y = logp[1:]
        a = np.dot(x, y) / max(1e-8, np.dot(x, x))
        resid = y - a * x
        sigma = np.std(resid)
        lambda_est = max(0.0, 1.0 - a)
        return lambda_est, sigma


class RitterTradingEnv(gym.Env if 'gym' in globals() else object):
    """Gym-style trading environment implementing the spec in the prompt.

    Key config params (defaults chosen sensibly):
    - K: max trade size per action (in lots)
    - max_position: M (max holdings in lots)
    - tick_size, lot_size, kappa
    - simulator params via OUProcess
    """

    metadata = {'render.modes': ['human']}

    def __init__(self,
                 K: int = 5,
                 max_position: int = 50,
                 tick_size: float = 1.0,
                 lot_size: int = 1,
                 kappa: float = 1e-4,
                 p_eq: float = 50000.0,
                 half_life: float = 86400.0,
                 sigma: float = 0.001,
                 seed: Optional[int] = None,
                 spread_init: float = 0.5,
                 liquidity_init: float = 1000.0,
                 max_steps: int = 1000):

        self.K = int(K)
        self.action_space = spaces.Discrete(2 * self.K + 1)  # maps 0..2K -> delta_n = i-K

        # observation: we'll present vectorized observation but also allow dict returns
        # state components sizes
        self.obs_dim = 8  # price, position, spread, liquidity, *signals (1), cash, tod, dow
        self.observation_space = spaces.Box(low=-1e12, high=1e12, shape=(self.obs_dim,), dtype=np.float32)

        self.max_position = int(max_position)
        self.tick_size = float(tick_size)
        self.lot_size = float(lot_size)
        self.kappa = float(kappa)

        # simulator
        self.sim = OUProcess(p_eq=p_eq, half_life=half_life, sigma=sigma)

        self.seed(seed)

        # environment state
        self.position = 0
        self.cash = 10000.0
        self.time = 0
        self.max_steps = int(max_steps)
        self.spread = float(spread_init)
        self.liquidity = float(liquidity_init)

        # mu_hat running mean for delta_v
        self.mu_hat = 0.0
        self.mu_count = 0

        # price x_t maintained in log-space
        self.x_t = 0.0
        self.p_t = float(self.sim.p_eq * math.exp(self.x_t))

        # diagnostic/history
        self.episode_history = []

    def seed(self, seed: Optional[int] = None):
        self._rng = np.random.RandomState(seed)
        return [seed]

    def reset(self) -> Dict[str, Any]:
        self.position = 0
        self.cash = 10000.0
        self.time = 0
        self.mu_hat = 0.0
        self.mu_count = 0
        self.x_t = 0.0
        self.p_t = float(self.sim.p_eq * math.exp(self.x_t))
        self.spread = float(self.spread)
        self.liquidity = float(self.liquidity)
        self.episode_history = []
        return self._get_obs_dict()

    def _get_obs_dict(self) -> Dict[str, Any]:
        tod = (self.time % 1440) / 1440.0  # fraction of day if time counts minutes
        dow = (self.time // 1440) % 7
        signals = np.array([0.0])  # placeholder for momentum/zscore
        obs = dict(
            price=float(self.p_t),
            position=int(self.position),
            spread=float(self.spread),
            liquidity=float(self.liquidity),
            signals=signals,
            cash=float(self.cash),
            time_features=np.array([tod, dow])
        )
        return obs

    def step(self, action: int) -> Tuple[Dict[str, Any], float, bool, Dict]:
        """Execute action and advance simulator one step.

        Action integer maps to delta_n = action - K.
        """
        delta_n = int(action - self.K)
        # clip action to not exceed per-step K
        delta_n = int(np.clip(delta_n, -self.K, self.K))

        # enforce position limits by clipping delta
        new_pos = int(self.position + delta_n)
        if abs(new_pos) > self.max_position:
            # clip to limit
            allowed = int(np.sign(delta_n) * (self.max_position - abs(self.position)))
            delta_n = allowed
            new_pos = int(self.position + delta_n)

        # price evolution to next time (simulate x_{t+1} then p_{t+1})
        x_next = self.sim.step(self.x_t)
        p_next = float(self.sim.p_eq * math.exp(x_next))

        # cost model
        spread_cost = self.tick_size * abs(delta_n)
        impact_cost = (delta_n ** 2) * (self.tick_size / max(1.0, self.lot_size))
        total_cost = spread_cost + impact_cost

        # execution price assumed immediate mid-price (self.p_t)
        exec_price = float(self.p_t)

        # PnL change: position_{t} * (p_{t+1} - p_t) + delta_n * (p_{t+1} - exec_price) - cost
        delta_v = float(self.position * (p_next - self.p_t) + delta_n * (p_next - exec_price) - total_cost)

        # update mu_hat running mean
        self.mu_count += 1
        # incremental mean
        self.mu_hat += (delta_v - self.mu_hat) / max(1, self.mu_count)

        # reward with quadratic penalty
        reward = float(delta_v - 0.5 * self.kappa * ((delta_v - self.mu_hat) ** 2))

        # apply position and cash update
        self.position = new_pos
        self.cash -= delta_n * exec_price + total_cost

        # advance time and state
        self.x_t = x_next
        self.p_t = p_next
        self.time += 1

        done = self.time >= self.max_steps

        info = dict(delta_v=delta_v, total_cost=total_cost, exec_price=exec_price)
        obs = self._get_obs_dict()
        # record history
        self.episode_history.append({'time': self.time, 'price': self.p_t, 'position': self.position, 'cash': self.cash, 'reward': reward})

        return obs, float(reward), bool(done), info

    def render(self, mode='human'):
        print(f"t={self.time}, price={self.p_t:.4f}, pos={self.position}, cash={self.cash:.2f}")

    def close(self):
        pass


def smoke_test_env(seed: int = 0, steps: int = 1000):
    env = RitterTradingEnv(seed=seed, max_steps=steps)
    obs = env.reset()
    action_n = getattr(env.action_space, 'n', 2 * env.K + 1)
    for i in range(steps):
        a = env._rng.randint(0, action_n)
        obs, r, done, info = env.step(a)
        assert not np.isnan(r)
        assert abs(env.position) <= env.max_position
        if done:
            break
    print('Smoke test passed: steps=', i + 1)


if __name__ == '__main__':
    smoke_test_env()
