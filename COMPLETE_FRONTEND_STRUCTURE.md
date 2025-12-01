# 📁 COMPLETE FRONTEND DIRECTORY STRUCTURE
**Generated:** December 1, 2025  
**Project:** BAGBOT Frontend  
**Total Files Listed:** 800+

---

## 📊 DIRECTORY TREE OVERVIEW

```
frontend/
├── .env files (4 files)
├── .github/ (CI/CD configs)
├── app/ (Next.js 13+ App Router - MAIN STRUCTURE)
├── components/ (Shared components - ROOT LEVEL)
├── styles/ (Global stylesheets)
├── public/ (Static assets)
├── lib/ (Utilities & API clients)
├── hooks/ (React hooks)
├── services/ (API service layer)
├── design-system/ (Component library)
├── src/ (⚠️ LEGACY - should be removed)
├── engines/ (⚠️ Should merge into app/engine/)
├── data/ (Static JSON data)
├── deploy/ (Deployment scripts)
├── scripts/ (Utility scripts)
├── docs/ (Documentation - 200+ MD files with duplicates)
├── artifacts/ (Build outputs)
└── Config files (package.json, next.config.js, etc.)
```

---

## 🗂️ DETAILED FILE LISTING BY DIRECTORY

### 📌 ROOT LEVEL FILES

#### Environment & Configuration
```
./.env.local
./.env.local.example
./.env.production.example
./.env.production 2.example         ← ❌ DUPLICATE

./.gitignore
./.gitignore 2                      ← ❌ DUPLICATE

./.python-version
./.python-version 2                 ← ❌ DUPLICATE

./.pre-commit-config.yaml
./.pre-commit-config 2.yaml         ← ❌ DUPLICATE
```

#### Next.js Configuration
```
./next.config.js                    ✅ ACTIVE
./next.config 2.js                  ← ❌ DUPLICATE

./next-env.d.ts                     ✅ ACTIVE
./next-env.d 2.ts                   ← ❌ DUPLICATE

./package.json                      ✅ ACTIVE
./package 2.json                    ← ❌ DUPLICATE

./package-lock.json                 ✅ ACTIVE
./package-lock 2.json               ← ❌ DUPLICATE

./tsconfig.json                     ✅ ACTIVE
./tsconfig 2.json                   ← ❌ DUPLICATE
./tsconfig.tsbuildinfo
./tsconfig 2.tsbuildinfo            ← ❌ DUPLICATE

./postcss.config.js                 ✅ ACTIVE
./postcss.config 2.js               ← ❌ DUPLICATE

./tailwind.config.js                ✅ ACTIVE
./tailwind.config 2.js              ← ❌ DUPLICATE
```

#### Utility Scripts
```
./fix-imports.js
./fix-imports 2.js                  ← ❌ DUPLICATE

./Makefile
./Makefile 2                        ← ❌ DUPLICATE
```

#### Database & Data Files
```
./bagbot.db
./best_genome_dual.json
./best_genome_dual 2.json           ← ❌ DUPLICATE
```

#### Web Server Config
```
./nginx.conf
./nginx 2.conf                      ← ❌ DUPLICATE

./docker-compose.yml
./docker-compose 2.yml              ← ❌ DUPLICATE

./docker-compose.prod.yml
./docker-compose.prod 2.yml         ← ❌ DUPLICATE
```

#### Python Example Scripts
```
./backtest_example.py
./backtest_example 2.py             ← ❌ DUPLICATE

./brain_demo.py
./brain_demo 2.py                   ← ❌ DUPLICATE

./mindset_example.py
./mindset_example 2.py              ← ❌ DUPLICATE

./run_daily_cycle.py
./run_daily_cycle 2.py              ← ❌ DUPLICATE

./test_safe_mode.py
./test_safe_mode 2.py               ← ❌ DUPLICATE
```

#### Deployment & Build Logs
```
./deployment_structure_check.sh
./deployment_structure_check 2.sh   ← ❌ DUPLICATE

./build_output.txt
./build_output 2.txt                ← ❌ DUPLICATE

./build-log.txt
./build-log 2.txt                   ← ❌ DUPLICATE

./runtime.txt
./runtime 2.txt                     ← ❌ DUPLICATE

./test_output_after_fix.txt
./test_output_final.txt
./tests_baseline.txt
./task_3_summary.txt
./task_3_summary 2.txt              ← ❌ DUPLICATE
./task_3.6_summary.txt
./task_3.6_summary 2.txt            ← ❌ DUPLICATE

./frontend_dir_structure.txt
./frontend_structure.txt
```

---

## 📱 APP/ DIRECTORY (Next.js 13+ App Router)

### Core App Files
```
./app/layout.tsx                    ← Root layout (imports CSS)
./app/page.tsx                      ← Home page
./app/page.tsx.backup               ← ⚠️ Backup file

./app/globals.css                   ← Global styles
./app/landing.css                   ← Landing page styles

./app/ClientLayoutWrapper.tsx      ← Client wrapper
./app/providers.tsx                ← State providers
./app/sci-fi-shell.tsx            ← Shell component
```

### App Route Pages (20 routes)
```
./app/admin/page.tsx
./app/backtest/page.tsx
./app/bot-dashboard/page.tsx
./app/charts/page.tsx
./app/chat/page.tsx
./app/dashboard/page.tsx
./app/login/page.tsx
./app/logs/page.tsx
./app/settings/page.tsx
./app/signals/page.tsx
./app/strategies/page.tsx
./app/systems/page.tsx
./app/terminal/page.tsx
./app/test-connection/page.tsx
./app/threat-center/page.tsx
```

### App Fusion Module (Special route with layout)
```
./app/fusion/layout.tsx
./app/fusion/page.tsx
./app/fusion/components.tsx
./app/fusion/fusion.css
./app/fusion/FusionTelemetryBars.tsx
./app/fusion/IntelligencePipelinePanel.tsx
./app/fusion/README.md

./app/fusion/intelligence-pipeline/page.tsx

./app/fusion/components/DivergenceHUD.tsx
./app/fusion/components/DivergencePanel.tsx
./app/fusion/components/DivergenceWaveChart.tsx
```

### App Components (Page-specific)
```
./app/components/diagnostics/DivergencePanel.tsx

./app/components/hedge/HedgeModeIndicator.tsx

./app/components/hypervision/HypervisionPanel.tsx

./app/components/intel/DailyTradingIndicator.tsx
./app/components/intel/StrategyWeightIndicator.tsx
./app/components/intel/ThreatInfluenceIndicator.tsx
./app/components/intel/ThreatMemoryIndicator.tsx
./app/components/intel/ThreatReactivePanel.tsx

./app/components/intro/GodModeIntro.tsx

./app/components/navigation/Navigation.tsx

./app/components/reaction/ReactionModeIndicator.tsx

./app/components/reactor/ReactorCore.tsx
./app/components/reactor/reactor.css

./app/components/risk/RiskCurveIndicator.tsx

./app/components/shield/ShieldFusionIndicator.tsx

./app/components/stabilizer/RDSIndicator.tsx

./app/components/strategy/ShieldStrategyIndicator.tsx

./app/components/threat/ThreatOverlay.tsx
./app/components/threat/ThreatReactivePanel.tsx
./app/components/threat/ThreatSyncDashboard.tsx
```

### App API Routes
```
./app/api/runtime/route.ts
./app/api/runtime-stream/route.ts
```

### App UI Components
```
./app/ui/runtime/CommandCenter.tsx
./app/ui/runtime/RuntimeControls.tsx
./app/ui/runtime/RuntimeStatus.tsx
```

### App Engine Modules (Business Logic - 7 major systems)

#### 1. BIC (Behavior Intelligence Core)
```
./app/engine/bic/BehaviorCore.ts
./app/engine/bic/behaviorMap.ts
./app/engine/bic/BehaviorProvider.tsx
./app/engine/bic/index.ts
```

#### 2. Cognitive Fusion
```
./app/engine/cognitive/CognitiveFusion.ts
./app/engine/cognitive/CognitiveFusionProvider.tsx
./app/engine/cognitive/index.ts
```

#### 3. Entity System (12 modules)
```
./app/engine/entity/AttentionStream.ts
./app/engine/entity/BehaviorGenome.ts
./app/engine/entity/CognitiveWeights.ts
./app/engine/entity/EntityCore.ts
./app/engine/entity/EntityMemory.ts
./app/engine/entity/EntityProvider.tsx
./app/engine/entity/EvolutionClock.ts
./app/engine/entity/ExpressionCore.ts
./app/engine/entity/HarmonicLimiter.ts
./app/engine/entity/IdentityAnchor.ts
./app/engine/entity/IdentityRing.ts
./app/engine/entity/index.ts
./app/engine/entity/MemoryImprintProvider.tsx
./app/engine/entity/ResonanceMatrix.ts
./app/engine/entity/RippleEngine.ts
./app/engine/entity/SelfHeal.ts
./app/engine/entity/SoulLinkCore.ts
./app/engine/entity/StabilityCore.ts
./app/engine/entity/entity-bio.css
```

#### 4. Environmental Intelligence (10 modules)
```
./app/engine/environmental/AmbientMarketPulse.ts
./app/engine/environmental/EnvironmentalConsciousnessCore.tsx
./app/engine/environmental/FlowFieldMapper.ts
./app/engine/environmental/index.ts
./app/engine/environmental/LiquidityThermostat.ts
./app/engine/environmental/MarketWeatherEngine.ts
./app/engine/environmental/MicroburstSensor.ts
./app/engine/environmental/MomentumStormAnalyzer.ts
./app/engine/environmental/TrendJetstreamDetector.ts
./app/engine/environmental/VolumeGravityDetector.ts
```

#### 5. Fusion System (7 modules)
```
./app/engine/fusion/AdaptiveMoodClimateEngine.ts
./app/engine/fusion/CrossSystemHarmonizer.ts
./app/engine/fusion/EnvironmentalEmotionMapper.ts
./app/engine/fusion/EnvironmentalFusionProvider.tsx
./app/engine/fusion/EnvironmentalMemoryLayer.ts
./app/engine/fusion/index.ts
./app/engine/fusion/MarketClimateVFXBlend.ts
```

#### 6. Holographic Mode (8 modules)
```
./app/engine/holographic/AdaptiveLightIntelligence.ts
./app/engine/holographic/EmotionalResonance.ts
./app/engine/holographic/HolographicForecast.ts
./app/engine/holographic/HolographicModeProvider.tsx
./app/engine/holographic/HoloSkin.ts
./app/engine/holographic/index.ts
./app/engine/holographic/PanelManager.ts
./app/engine/holographic/PresenceEffectV2.ts
```

#### 7. Reflex System (5 modules)
```
./app/engine/reflex/index.ts
./app/engine/reflex/ReflexEngine.ts
./app/engine/reflex/ReflexMapper.ts
./app/engine/reflex/StabilityFieldCore.ts
./app/engine/reflex/StabilityProvider.tsx
```

### App Engines (Separate from engine/)
```
./app/engines/RealityDivergenceScanner.ts    ← ⚠️ Should be in app/engine/
```

### App Lib (Business Logic Libraries - 25+ subsystems)

#### AEG (Autonomous Execution Governor)
```
./app/lib/aeg/AutonomousExecutionGovernor.ts
./app/lib/aeg/types.ts
```

#### Analytics (10 modules)
```
./app/lib/analytics/AnalyticsBridge.ts
./app/lib/analytics/DivergenceController.ts
./app/lib/analytics/DivergenceInsightBridge.ts
./app/lib/analytics/DivergenceInsightController.ts
./app/lib/analytics/DivergenceOrchestrator.ts
./app/lib/analytics/DivergenceRuntime.ts
./app/lib/analytics/DivergenceThreatClassifier.ts
./app/lib/analytics/DivergenceThreatModel.ts
./app/lib/analytics/DivergenceUIController.ts
./app/lib/analytics/DivergenceUIFormatter.ts
```

#### ARL (Autonomous Response Loop)
```
./app/lib/arl/AutonomousResponseLoop.ts
```

#### AVRS (Advanced Reactor Sync)
```
./app/lib/avrs/ReactorSyncEngine.ts
```

#### Conductor
```
./app/lib/conductor/AutoTradingConductor.ts
./app/lib/conductor/ConductorRules.ts
```

#### Consciousness
```
./app/lib/consciousness/ConsciousnessMetrics.ts
./app/lib/consciousness/TradingConsciousnessLoop.ts
```

#### Decision Systems (3 modules)
```
./app/lib/decision/DecisionEngine.ts
./app/lib/decision/GDSRouter.ts
./app/lib/decision/GDSTopology.ts
```

#### DPL (Decision Precision Layer)
```
./app/lib/dpl/DecisionPrecisionLayer.ts
./app/lib/dpl/types.ts
./app/lib/dpl/validators.ts
```

#### EAE (Execution Alignment Engine)
```
./app/lib/eae/ExecutionAlignmentEngine.ts
./app/lib/eae/liquidityPulse.ts
./app/lib/eae/rhythm.ts
./app/lib/eae/types.ts
```

#### Engine Integration (8 modules)
```
./app/lib/engine/AutonomousHedgePathwayEngine.ts
./app/lib/engine/DynamicReactionPathwayEngine.ts
./app/lib/engine/HedgeIntegration.ts
./app/lib/engine/ReactionIntegration.ts
./app/lib/engine/ShieldBrainSyncLayer.ts
./app/lib/engine/ShieldFusionIntegration.ts
./app/lib/engine/ShieldFusionSynchronizer.ts
./app/lib/engine/TradingPipelineCore.ts
```

#### ERF (Execution Reality Filter)
```
./app/lib/erf/ExecutionRealityFilter.ts
./app/lib/erf/types.ts
```

#### Execution Systems (4 modules)
```
./app/lib/execution/ExecutionOverride.ts
./app/lib/execution/ExecutionPrecisionCore.ts
./app/lib/execution/ExecutionSurvivalMatrix.ts
./app/lib/execution/overrideRules.ts
```

#### EXO (Execution Orchestrator)
```
./app/lib/exo/ExecutionOrchestrator.ts
./app/lib/exo/mergeSignals.ts
./app/lib/exo/rules.ts
./app/lib/exo/types.ts
```

#### Fusion (4 modules)
```
./app/lib/fusion/DeepExecutionFusion.ts
./app/lib/fusion/FullSpectrumSync.ts
./app/lib/fusion/fusionRules.ts
./app/lib/fusion/types.ts
```

#### Harmonizer (3 modules)
```
./app/lib/harmonizer/ShieldNetworkHarmonizer.ts
./app/lib/harmonizer/SystemHarmonizer.ts
./app/lib/harmonizer/types.ts
```

#### Hypervision
```
./app/lib/hypervision/HypervisionCore.ts
```

#### Intel (6 modules)
```
./app/lib/intel/DailyTradingHarmonizer.ts
./app/lib/intel/DailyTradingIntegration.ts
./app/lib/intel/FusionThreatBridge.ts
./app/lib/intel/TemporalThreatMemory.ts
./app/lib/intel/ThreatStrategyIntegration.ts
./app/lib/intel/ThreatWeightedStrategy.ts
```

#### Intelligence (11 modules)
```
./app/lib/intelligence/flowCalculators.ts
./app/lib/intelligence/flowTypes.ts
./app/lib/intelligence/FusionCore.ts
./app/lib/intelligence/fusionMatrix.ts
./app/lib/intelligence/fusionWeights.ts
./app/lib/intelligence/IntelligencePipelineCoordinator.ts
./app/lib/intelligence/MarketFlowAnticipation.ts
./app/lib/intelligence/VolatilityBehaviorEngine.ts
./app/lib/intelligence/volatilityModels.ts
./app/lib/intelligence/volatilityTypes.ts

./app/lib/intelligence/pulsar/PulsarRuntime.ts
./app/lib/intelligence/pulsar/PulsarScanner.ts
```

#### Learning (3 modules)
```
./app/lib/learning/learningRules.ts
./app/lib/learning/ReinforcementCore.ts
./app/lib/learning/stateMemory.ts
```

#### Monitoring
```
./app/lib/monitoring/RealTimeExecutionMonitor.ts
```

#### MSFE (Multi-Strategy Fusion Engine)
```
./app/lib/msfe/StrategyFusionEngine.ts
./app/lib/msfe/types.ts
./app/lib/msfe/weights.ts
```

#### NET (Neural Execution Translator)
```
./app/lib/net/NeuralExecutionTranslator.ts
./app/lib/net/types.ts
```

#### Patterns (3 modules)
```
./app/lib/patterns/patternMemory.ts
./app/lib/patterns/patternRules.ts
./app/lib/patterns/PatternSyncEngine.ts
```

#### Refinement
```
./app/lib/refinement/StrategicRefinementLattice.ts
```

#### Risk (2 modules)
```
./app/lib/risk/RiskIntegration.ts
./app/lib/risk/ShieldRiskCurveEngine.ts
```

#### Runtime (3 modules)
```
./app/lib/runtime/ContinuousRuntimeLoop.ts
./app/lib/runtime/eventBus.ts
./app/lib/runtime/SafetyManager.ts
```

#### Sentience (2 modules)
```
./app/lib/sentience/SentienceEngine.ts
./app/lib/sentience/sentienceMath.ts
```

#### Simulation
```
./app/lib/simulation/MarketSimulationEngine.ts
```

#### Stabilizers
```
./app/lib/stabilizers/RealityDistortionStabilizer.ts
```

#### Strategy (3 modules)
```
./app/lib/strategy/AdaptiveShieldStrategySelector.ts
./app/lib/strategy/ShieldStrategyLink.ts
./app/lib/strategy/StrategyIntegration.ts
```

#### Trading (2 modules)
```
./app/lib/trading/ShieldSyncIntegration.ts
./app/lib/trading/TradingBrainCore.ts
```

#### XReactor (4 modules)
```
./app/lib/xreactor/reactorRules.ts
./app/lib/xreactor/runtimeMonitors.ts
./app/lib/xreactor/types.ts
./app/lib/xreactor/XReactor.ts
```

### App Services (API Integration - 20+ services)

#### Conductor Service
```
./app/services/conductor/conductorService.ts
```

#### Consciousness Service
```
./app/services/consciousness/consciousnessService.ts
```

#### Decision Service
```
./app/services/decision/gdsService.ts
```

#### Execution Service
```
./app/services/execution/overrideService.ts
```

#### Intelligence Services (13 services)
```
./app/services/intelligence/aegService.ts
./app/services/intelligence/deFusionService.ts
./app/services/intelligence/dplService.ts
./app/services/intelligence/dvbeService.ts
./app/services/intelligence/eaeService.ts
./app/services/intelligence/erfService.ts
./app/services/intelligence/exoService.ts
./app/services/intelligence/fusionService.ts
./app/services/intelligence/mfaeService.ts
./app/services/intelligence/msfeService.ts
./app/services/intelligence/netService.ts
./app/services/intelligence/snhlService.ts
./app/services/intelligence/xReactorService.ts
```

#### Learning Service
```
./app/services/learning/learningService.ts
```

#### Patterns Service
```
./app/services/patterns/patternService.ts
```

#### Sentience Service
```
./app/services/sentience/sentienceService.ts
```

### App State Management (11 Zustand stores)
```
./app/state/conductorState.ts
./app/state/consciousnessState.ts
./app/state/dvbeState.ts
./app/state/executionFusionState.ts
./app/state/fusionState.ts
./app/state/gdsState.ts
./app/state/learningState.ts
./app/state/mfaeState.ts
./app/state/overrideState.ts
./app/state/patternState.ts
./app/state/sentienceState.ts
```

---

## 🧩 COMPONENTS/ DIRECTORY (Shared Components)

### Base UI Components
```
./components/AnimatedCard.tsx
./components/AnimatedCard 2.tsx          ← ❌ DUPLICATE

./components/AnimatedText.tsx
./components/AnimatedText 2.tsx          ← ❌ DUPLICATE

./components/DataSpark.tsx
./components/DataSpark 2.tsx             ← ❌ DUPLICATE

./components/GlowingPanel.tsx
./components/GlowingPanel 2.tsx          ← ❌ DUPLICATE

./components/HoverButton.tsx
./components/HoverButton 2.tsx           ← ❌ DUPLICATE

./components/IntroHoloSequence.tsx
./components/IntroHoloSequence 2.tsx     ← ❌ DUPLICATE

./components/LoadingSpinner.tsx
./components/LoadingSpinner 2.tsx        ← ❌ DUPLICATE

./components/PageTransition.tsx
./components/PageTransition 2.tsx        ← ❌ DUPLICATE

./components/ParallaxContainer.tsx
./components/ParallaxContainer 2.tsx     ← ❌ DUPLICATE

./components/SafeModeBanner.tsx
./components/SafeModeBanner 2.tsx        ← ❌ DUPLICATE

./components/TradeSignalSpark.tsx
./components/TradeSignalSpark 2.tsx      ← ❌ DUPLICATE
```

### Admin Components (14 files)
```
./components/admin/controlhub.css
./components/admin/diagnostics.css
./components/admin/purpleTechwave.css
./components/admin/EventLogStream.ts
./components/admin/ExecutionQueueView.tsx
./components/admin/IntegrityScanner.ts
./components/admin/OperationalControlHub.tsx
./components/admin/ResourceMatrix.tsx
./components/admin/SafetyGateMonitor.tsx
./components/admin/SystemDiagnosticsPanel.tsx
./components/admin/SystemOverviewDeck.tsx
./components/admin/ThreadInspector.tsx
./components/admin/UplinkDiagnostics.tsx
./components/admin/UserIntelligenceBoard.tsx
```

### Ascendant System (6 files)
```
./components/ascendant/AscendantIdentityOverlay.tsx
./components/ascendant/AscendantSignatureEngine.ts
./components/ascendant/IdentitySkeletonEngine.ts
./components/ascendant/index.ts
./components/ascendant/MemorylessPersonalityEngine.ts
./components/ascendant/PresenceStabilizerEngine.ts
```

### Ascension System
```
./components/ascension/AscensionEffects.tsx
```

### Auto-Balance System (7 files)
```
./components/autobalance/AutoBalanceCore.ts
./components/autobalance/CognitiveLoadRegulator.ts
./components/autobalance/EmotionStabilityPipeline.ts
./components/autobalance/IdentityAnchorEngine.ts
./components/autobalance/index.ts
./components/autobalance/ReflexRecoveryLoop.ts
./components/autobalance/Sovereign12Kernel.ts
```

### Awareness System (5 files)
```
./components/awareness/IntentAwarenessLayer.ts
./components/awareness/MLASSafetyGuardrail.ts
./components/awareness/MultiLayerAwarenessSystem.ts
./components/awareness/StateAwarenessLayer.ts
./components/awareness/TaskAwarenessLayer.ts
```

### Collective Intelligence (5 files)
```
./components/collective/CollectiveFieldEngine.ts
./components/collective/CollectiveIntelligenceHub.tsx
./components/collective/ConsensusMemoryEcho.ts
./components/collective/index.ts
./components/collective/IntentVectorSynthesizer.ts
```

### Emergence System (6 files)
```
./components/emergence/AdaptiveExpressionMatrix.ts
./components/emergence/AuraSyncEngine.ts
./components/emergence/EmergenceSignatureCore.ts
./components/emergence/EmotionalTrajectoryEngine.ts
./components/emergence/IdentityResonanceHub.tsx
./components/emergence/index.ts
```

### Emergent System (6 files)
```
./components/emergent/AdaptiveToneEngine.tsx
./components/emergent/ContextualMemoryLayer.ts
./components/emergent/IdentityDashboard.tsx
./components/emergent/IdentityStabilityAnchor.ts
./components/emergent/index.ts
./components/emergent/PersonalityVectorEngine.ts
```

### Execution System (14 files)
```
./components/execution/ChainCompatibilityMatrix.ts
./components/execution/ConditionalFlowResolver.ts
./components/execution/DimensionalExecutionPathing.ts
./components/execution/ExecutionApprovalGate.ts
./components/execution/ExecutionStateTelemetry.tsx
./components/execution/ImpactDimensionLayer.ts
./components/execution/index.ts
./components/execution/ModeDimensionLayer.ts
./components/execution/multiflow.css
./components/execution/MultiFlowHub.tsx
./components/execution/ScopeDimensionLayer.ts
./components/execution/SequentialFlowPlanner.ts
./components/execution/TaskGraphEngine.ts
./components/execution/TaskNode.ts
./components/execution/TimeDimensionLayer.ts
```

### Fusion System (9 files)
```
./components/fusion/EnvironmentPresenceMapper.ts
./components/fusion/EnvTriPhaseAwareness.ts
./components/fusion/FusionReflexBalancer.ts
./components/fusion/HoloWorldMeshLayer.ts
./components/fusion/index.ts
./components/fusion/ParallelIntelligenceCore.ts
./components/fusion/ReflexEngineV2.ts
./components/fusion/SymbioticEnvironmentLink.ts
./components/fusion/SymbioticFieldCore.ts
```

### Guardian System (7 files)
```
./components/guardian/GuardianOrchestrationHub.ts
./components/guardian/GuardianStateCore.ts
./components/guardian/HarmonicBalanceEngine.ts
./components/guardian/index.ts
./components/guardian/ProtectionReflexMatrix.ts
./components/guardian/StabilizationFlowEngine.ts
./components/guardian/SymbioticGuardianProvider.tsx
```

### Memory System (14 files)
```
./components/memory/ContinuitySyncLayer.ts
./components/memory/ImmediateContextLayer.ts
./components/memory/index.ts
./components/memory/IntentThreadTracker.ts
./components/memory/LongArcPatternLayer.ts
./components/memory/MemoryAuditGate.ts
./components/memory/memoryflow.css
./components/memory/MemoryReliabilityMatrix.ts
./components/memory/MemorySafetyBoundary.ts
./components/memory/MemoryVectorEngine.ts
./components/memory/MultiLayerContextGrid.ts
./components/memory/RollingMemoryCore.ts
./components/memory/RollingMemoryUI.tsx
./components/memory/SessionIntentLayer.ts
./components/memory/TechnicalContextWeaver.ts
```

### Meta System (5 files)
```
./components/meta/index.ts
./components/meta/LongHorizonThoughtEngine.ts
./components/meta/MetaAwarenessEngine.ts
./components/meta/MultiAgentDebateEngine.ts
./components/meta/UltraFusionOverlay.tsx
```

### Oversight System (9 files)
```
./components/oversight/index.ts
./components/oversight/IntentClarificationMatrix.ts
./components/oversight/MultiPathForecastEngine.ts
./components/oversight/OversightRecommendationEngine.ts
./components/oversight/PreExecutionAuditGate.ts
./components/oversight/RiskMapGenerator.ts
./components/oversight/strategic.css
./components/oversight/StrategicStateMonitor.ts
./components/oversight/StrategicUI.tsx
```

### Presence System (6 files)
```
./components/presence/ContinuityStabilityEngine.ts
./components/presence/IdentityPersistenceLayer.tsx
./components/presence/index.ts
./components/presence/MultiSurfaceAwarenessMatrix.ts
./components/presence/PresenceFieldCore.ts
./components/presence/UnifiedPulseEngine.ts
```

### Quantum System
```
./components/quantum/QuantumEffects.tsx
```

### Refinement System (5 files)
```
./components/refinement/DriftSuppressionMatrix.ts
./components/refinement/EmotionalGradientFilter.ts
./components/refinement/index.ts
./components/refinement/SovereignRefinementOrchestrator.ts
./components/refinement/StabilityRefinementCore.ts
```

### Shield System (9 files)
```
./components/shield/EmotionalShield.ts
./components/shield/ExecutionShield.ts
./components/shield/MemoryIntegrityShield.ts
./components/shield/ShieldCore.ts
./components/shield/ShieldSyncLayer.tsx

./components/shield/brain/CorrelationMatrix.ts
./components/shield/brain/RiskScoringEngine.ts
./components/shield/brain/RootCauseEngine.ts
./components/shield/brain/ShieldBrainCore.ts
```

### Sovereignty System (8 files)
```
./components/sovereignty/AdaptivePresenceMatrix.ts
./components/sovereignty/EmotionalFieldRegulator.ts
./components/sovereignty/EmotionalRhythmController.ts
./components/sovereignty/index.ts
./components/sovereignty/SovereignBalanceEngine.ts
./components/sovereignty/SovereignOrchestrationHub.ts
./components/sovereignty/SovereignProvider.tsx
./components/sovereignty/StateCoherenceDirector.ts
```

### Stability System (7 files)
```
./components/stability/EquilibriumPulseEngine.ts
./components/stability/index.ts
./components/stability/LongRangeIdentityAnchor.ts
./components/stability/SovereignStabilityGrid.ts
./components/stability/StatePrecisionRegulator.ts
./components/stability/ToneCoherenceDirector.ts
./components/stability/UnifiedStabilityOrchestrator.ts
```

### UI Components (10 files)
```
./components/ui/badge.tsx
./components/ui/card.tsx
./components/ui/DataPulseFeed.ts
./components/ui/index.ts
./components/ui/MultiLayerVisualComposer.tsx
./components/ui/nextui.css
./components/ui/ReactiveUIKernel.tsx
./components/ui/separator.tsx
./components/ui/SystemDashboardGrid.tsx
./components/ui/UIIntentRouter.ts
./components/ui/ViewportStreamEngine.ts
```

---

## 🎨 STYLES/ DIRECTORY (28 CSS files + 28 DUPLICATES)

```
./styles/animations.css
./styles/animations 2.css                    ← ❌ DUPLICATE

./styles/ascendant-identity.css
./styles/ascendant-identity 2.css            ← ❌ DUPLICATE

./styles/ascension.css
./styles/ascension 2.css                     ← ❌ DUPLICATE

./styles/cognitive-fusion.css
./styles/cognitive-fusion 2.css              ← ❌ DUPLICATE

./styles/CollectiveAuraOverlay.css
./styles/CollectiveAuraOverlay 2.css         ← ❌ DUPLICATE

./styles/entity-drift.css
./styles/entity-drift 2.css                  ← ❌ DUPLICATE

./styles/entity-expression.css
./styles/entity-expression 2.css             ← ❌ DUPLICATE

./styles/entity-mode.css
./styles/entity-mode 2.css                   ← ❌ DUPLICATE

./styles/globals.css                         ✅ IMPORTED in app/layout.tsx
./styles/globals 2.css                       ← ❌ DUPLICATE

./styles/glow-refinement.css
./styles/glow-refinement 2.css               ← ❌ DUPLICATE

./styles/guardian.css
./styles/guardian 2.css                      ← ❌ DUPLICATE

./styles/harmony-pulse.css
./styles/harmony-pulse 2.css                 ← ❌ DUPLICATE

./styles/meta-awareness.css
./styles/meta-awareness 2.css                ← ❌ DUPLICATE

./styles/parallel-intelligence.css
./styles/parallel-intelligence 2.css         ← ❌ DUPLICATE

./styles/persona-effects.css
./styles/persona-effects 2.css               ← ❌ DUPLICATE

./styles/PresenceLayer.css
./styles/PresenceLayer 2.css                 ← ❌ DUPLICATE

./styles/quantum-holo.css
./styles/quantum-holo 2.css                  ← ❌ DUPLICATE

./styles/reflex-visual.css
./styles/reflex-visual 2.css                 ← ❌ DUPLICATE

./styles/responsive.css
./styles/responsive 2.css                    ← ❌ DUPLICATE

./styles/shadow-refinement.css
./styles/shadow-refinement 2.css             ← ❌ DUPLICATE

./styles/StabilityWavefield.css
./styles/StabilityWavefield 2.css            ← ❌ DUPLICATE

./styles/symbiotic-environment.css
./styles/symbiotic-environment 2.css         ← ❌ DUPLICATE

./styles/theme.css                           ← ⚠️ Which one is correct?
./styles/theme-new.css                       ✅ IMPORTED in app/layout.tsx
./styles/theme 2.css                         ← ❌ DUPLICATE

./styles/ToneStabilityPulse.css
./styles/ToneStabilityPulse 2.css            ← ❌ DUPLICATE

./styles/ultra-fusion.css
./styles/ultra-fusion 2.css                  ← ❌ DUPLICATE

./styles/ultra-wide.css
./styles/ultra-wide 2.css                    ← ❌ DUPLICATE

./styles/UnifiedPresence.css
./styles/UnifiedPresence 2.css               ← ❌ DUPLICATE

./styles/world-mesh.css
./styles/world-mesh 2.css                    ← ❌ DUPLICATE
```

---

## 📚 LIB/ DIRECTORY (Shared Utilities)

### API Clients
```
./lib/api.ts                                 ✅ ACTIVE
./lib/api 2.ts                               ← ❌ DUPLICATE
./lib/api-client.ts
./lib/connection-test.ts
./lib/websocket-client.ts

./lib/socket.ts                              ✅ ACTIVE
./lib/socket 2.ts                            ← ❌ DUPLICATE
```

### Custom Hooks
```
./lib/hooks/useAPI.ts
./lib/hooks/useAPI 2.ts                      ← ❌ DUPLICATE

./lib/hooks/useWebSocket.ts
./lib/hooks/useWebSocket 2.ts                ← ❌ DUPLICATE
```

---

## 🪝 HOOKS/ DIRECTORY (Global Hooks)

```
./hooks/useIntelligenceStream.ts
./hooks/useIntelligenceStream 2.ts           ← ❌ DUPLICATE
```

---

## 🔌 SERVICES/ DIRECTORY (API Service Layer)

```
./services/ai.ts
./services/ai 2.ts                           ← ❌ DUPLICATE

./services/auth.ts

./services/backtest.ts
./services/backtest 2.ts                     ← ❌ DUPLICATE

./services/bot.ts

./services/dashboard.ts
./services/dashboard 2.ts                    ← ❌ DUPLICATE

./services/index.ts
./services/index 2.ts                        ← ❌ DUPLICATE

./services/logs.ts
./services/logs 2.ts                         ← ❌ DUPLICATE

./services/market.ts
./services/market 2.ts                       ← ❌ DUPLICATE

./services/settings.ts
./services/settings 2.ts                     ← ❌ DUPLICATE

./services/signals.ts
./services/signals 2.ts                      ← ❌ DUPLICATE

./services/strategies.ts
./services/strategies 2.ts                   ← ❌ DUPLICATE

./services/system.ts
./services/system 2.ts                       ← ❌ DUPLICATE

./services/terminal.ts
./services/terminal 2.ts                     ← ❌ DUPLICATE
```

---

## 🎨 DESIGN-SYSTEM/ DIRECTORY

### Components
```
./design-system/components/buttons/HoloButton.tsx
./design-system/components/cards/HoloCard.tsx
./design-system/components/hud/HUDWidget.tsx
./design-system/components/inputs/GlassInput.tsx
./design-system/components/inputs/NeonSwitch.tsx
./design-system/components/tabs/NeonTabs.tsx
```

### Primitives
```
./design-system/primitives/glow.ts
./design-system/primitives/grid.ts
./design-system/primitives/shadows.ts
./design-system/primitives/spacing.ts
./design-system/primitives/typography.tsx
```

### Themes
```
./design-system/themes/holo-light.ts
./design-system/themes/neon-dark.ts
```

### Index
```
./design-system/index.ts
./design-system/index 2.ts                   ← ❌ DUPLICATE
```

---

## 📂 SRC/ DIRECTORY (⚠️ LEGACY - Should be removed)

### Legacy Components
```
./src/components/intel/CognitivePulseEngine.tsx
./src/components/intel/DecisionMemoryCore.tsx
./src/components/intel/NeuralSyncGrid.tsx

./src/components/vision/FutureArcs.tsx
./src/components/vision/index.tsx
./src/components/vision/PredictionHalo.tsx
./src/components/vision/ProbabilityWave.tsx
```

### Legacy Engine
```
./src/engine/fusion/filters.ts
./src/engine/fusion/FusionEngine.ts
./src/engine/fusion/FusionStabilizer.ts
./src/engine/fusion/FusionTypes.ts
./src/engine/fusion/metrics.ts

./src/engine/stability-shield/RiskScoringEngine.ts
./src/engine/stability-shield/ShieldIntelligenceAPI.ts
./src/engine/stability-shield/ShieldIntelligenceAPI_OLD.ts.bak
./src/engine/stability-shield/ShieldOrchestrator.ts
./src/engine/stability-shield/ThreatClusterEngine.ts
./src/engine/stability-shield/types.ts
./src/engine/stability-shield/vectorMath.ts
```

---

## 🔧 ENGINES/ DIRECTORY (Root Level - Should merge into app/engine/)

```
./engines/threat/ThreatSyncOrchestrator.ts
```

---

## 📊 DATA/ DIRECTORY

```
./data/state/daily_metrics.json
./data/state/mindset_state.json
./data/state/strategy_confidence.json
```

---

## 🌐 PUBLIC/ DIRECTORY (Static Assets)

```
./public/sfx/intro-whisper.mp3
./public/sfx/intro-whisper 2.mp3             ← ❌ DUPLICATE
```

---

## 🚀 DEPLOY/ DIRECTORY (Deployment Scripts)

```
./deploy/backup.sh
./deploy/backup 2.sh                         ← ❌ DUPLICATE

./deploy/deploy.sh
./deploy/deploy 2.sh                         ← ❌ DUPLICATE

./deploy/deployment_diagnostic.sh
./deploy/deployment_diagnostic 2.sh          ← ❌ DUPLICATE

./deploy/full_deploy.sh
./deploy/full_deploy 2.sh                    ← ❌ DUPLICATE

./deploy/health_check.sh
./deploy/health_check 2.sh                   ← ❌ DUPLICATE

./deploy/nginx.conf
./deploy/nginx 2.conf                        ← ❌ DUPLICATE

./deploy/pre_deploy_checklist.sh
./deploy/pre_deploy_checklist 2.sh           ← ❌ DUPLICATE

./deploy/provision_vps.sh
./deploy/provision_vps 2.sh                  ← ❌ DUPLICATE

./deploy/rollback.sh
./deploy/rollback 2.sh                       ← ❌ DUPLICATE
```

---

## 🔧 SCRIPTS/ DIRECTORY

```
./scripts/check_api_contracts.py
./scripts/check_api_contracts 2.py           ← ❌ DUPLICATE

./scripts/keys/deploy_key
./scripts/keys/deploy_key.pub
```

---

## 🐙 .GITHUB/ DIRECTORY (CI/CD)

```
./.github/workflows/ci.yml
./.github/workflows/deploy-dryrun.yml
```

---

## 📖 DOCS/ DIRECTORY (200+ Documentation Files)

**Note:** Due to extensive duplication, only listing unique categories:

### Architecture Docs
- BRAIN_ARCHITECTURE.md (+ duplicate)
- TRADING_ARCHITECTURE.md (+ duplicate)
- SYSTEM_ARCHITECTURE_DIAGRAM.md (+ duplicate)

### Phase Documentation (50+ files)
- PHASE_2 series (COMPLETE, QUICK_REF, README, SUMMARY)
- PHASE_3 series
- PHASE_4 series
- PHASE_5 series
- PHASE_6 series
- All with "2" duplicates

### Level Documentation (40+ files)
- LEVEL_6.1 through LEVEL_22
- BIC, Cognitive Fusion, Symbiotic Entity
- All with "2" duplicates

### Integration Docs
- INTEGRATION_FIXES.md (+ duplicate)
- INTEGRATION_REPORT.md (+ duplicate)
- BIC_INTEGRATION_EXAMPLE.md (+ duplicate)

### Quick Reference Guides
- QUICK_REF files for various systems
- All with "2" duplicates

### Deployment Docs
- DEPLOYMENT_GUIDE.md (+ duplicate)
- DEPLOYMENT_QUICK_REF.md (+ duplicate)
- DEPLOYMENT_QUICK_START.md (+ duplicate)
- PRODUCTION_READY_CHECKLIST.md (+ duplicate)

### API Documentation
- API_ENDPOINT_MAP.md (+ duplicate)
- docs/api_contracts.json (+ duplicate)
- docs/ui_api_map.md (+ duplicate)

### Testing Docs
- TEST_EXECUTION_REPORT.md (+ duplicate)
- TEST_FIXES_SUMMARY.md (+ duplicate)
- TESTING.md (+ duplicate)

### Setup Guides
- INSTALLATION_GUIDE.md (+ duplicate)
- docs/dns_setup.md (+ duplicate)
- docs/deploy_key_instructions.md (+ duplicate)
- STRIPE_SETUP.md (+ duplicate)

### Feature Documentation
- AI_HELPER_UI_GUIDE.md (+ duplicate)
- AUTH_UI_GUIDE.md (+ duplicate)
- SETTINGS_UI_GUIDE.md (+ duplicate)
- FUSION_ENGINE_COMPLETE.md (+ duplicate)
- ENVIRONMENTAL_INTELLIGENCE_QUICK_REF.md (+ duplicate)
- MARKET_SIMULATION_QUICK_REF.md (+ duplicate)
- NEURAL_SYNC_GRID_QUICK_REF.md (+ duplicate)
- RISK_MANAGER_QUICK_REF.md (+ duplicate)
- SAFE_MODE_QUICK_REF.md (+ duplicate)

### Examples & Flows
- LEVEL_19_WIRING_EXAMPLES.tsx (+ duplicate)
- docs/ORDER_ROUTER_FLOW.md (+ duplicate)
- docs/TRADING_CONNECTOR_EXAMPLES.md (+ duplicate)

---

## 📦 ARTIFACTS/ DIRECTORY

```
./artifacts/README.md
./artifacts/README 2.md                      ← ❌ DUPLICATE
```

---

## 📈 SUMMARY STATISTICS

### Total Files by Type
- **TypeScript/TSX files:** ~450+
- **CSS files:** 56 (28 originals + 28 duplicates)
- **JSON files:** ~20
- **JavaScript files:** ~15
- **Markdown docs:** 200+ (100+ originals + 100+ duplicates)
- **Shell scripts:** 30+ (15 originals + 15 duplicates)
- **Python files:** 20+ (10 originals + 10 duplicates)

### Duplicates Summary
- **Files with "2" suffix:** 67+
- **Directories with "2"/"  2":** 30+
- **CSS duplicates:** 28
- **Service duplicates:** 13
- **Component duplicates:** 11
- **Config duplicates:** 7
- **Doc duplicates:** 100+

### Code Organization
- **App directory modules:** 300+ files
- **Component library files:** 200+ files
- **Engine modules:** 7 major systems, 60+ files
- **Library modules:** 25+ subsystems, 120+ files
- **Service layer:** 20+ services
- **State stores:** 11 Zustand stores

### Legacy Code to Remove
- `/src/` directory: 18 files
- `/engines/` root directory: 1 file (should move to app/engine/)
- Legacy components in `/src/components/`: 11 files
- Legacy engine in `/src/engine/`: 12 files

---

## 🎯 CLEANUP RECOMMENDATIONS

### Phase 1: Critical Config Files (Priority 1)
1. Compare and merge/remove duplicates:
   - package.json vs package 2.json
   - tsconfig.json vs tsconfig 2.json
   - next.config.js vs next.config 2.js
   - postcss.config.js vs postcss 2.js
   - tailwind.config.js vs tailwind 2.js

### Phase 2: CSS Files (Priority 2)
1. Determine correct theme file (theme.css vs theme-new.css)
2. Remove all 28 CSS "2" duplicates
3. Verify all CSS imports in app/layout.tsx

### Phase 3: Service Layer (Priority 3)
1. Remove all 13 service "2" duplicates
2. Verify imports throughout app/

### Phase 4: Component Library (Priority 4)
1. Remove 11 component "2" duplicates
2. Remove 30+ duplicate component directories
3. Verify all component imports

### Phase 5: Legacy Code Removal (Priority 5)
1. Move/merge /src/components/ → /app/components/ or /components/
2. Merge /src/engine/ → /app/engine/
3. Delete entire /src/ directory
4. Move /engines/threat/ → /app/engine/threat/
5. Delete /engines/ directory

### Phase 6: Documentation (Priority 6)
1. Remove 100+ doc "2" duplicates
2. Consolidate similar docs
3. Create single source of truth for each topic

### Phase 7: Verification (Priority 7)
1. Run build to verify no broken imports
2. Run tests
3. Verify all routes work
4. Check asset loading

---

## ✅ CHECKLIST FOR CLEANUP

- [ ] Backup entire frontend/ directory
- [ ] Create git branch for cleanup
- [ ] Compare all config files
- [ ] Remove config duplicates
- [ ] Remove CSS duplicates
- [ ] Update CSS imports in layout.tsx
- [ ] Remove service duplicates
- [ ] Remove component duplicates
- [ ] Remove component directory duplicates
- [ ] Merge /src/ into appropriate locations
- [ ] Remove /src/ directory
- [ ] Move /engines/ into /app/engine/
- [ ] Remove /engines/ directory
- [ ] Remove doc duplicates
- [ ] Remove deploy script duplicates
- [ ] Remove public asset duplicates
- [ ] Run: `npm run build`
- [ ] Fix any import errors
- [ ] Run: `npm run lint`
- [ ] Test all routes
- [ ] Commit changes
- [ ] Deploy to test environment

---

**END OF STRUCTURE ANALYSIS**
