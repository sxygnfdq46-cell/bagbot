"""BagBot Brain foundation modules (normalizer, fusion reactor, decision envelope)."""

from .utils.normalizer import normalize_signal  # noqa: F401
from .utils.fusion import fuse_signals, FusionConfig  # noqa: F401
from .utils.decision import build_decision_envelope  # noqa: F401
from .models.schemas import NormalizedSignal, FusionResult, DecisionEnvelope  # noqa: F401
