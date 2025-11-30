/**
 * LEVEL 11.1 — ASCENDANT IDENTITY OVERLAY
 * 
 * Visualization component for BagBot's identity system.
 * 
 * Features:
 * - Identity Dashboard: See BagBot's personality at a glance
 * - Personality Tuning: Adjust temperament in real-time
 * - Signature Matrix: View character feel dimensions
 * - Presence Monitor: Track consistency across contexts
 * - Adaptation Viewer: See how BagBot adapts to you
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  IdentitySkeletonEngine, 
  type IdentitySkeleton, 
  type CoreTemperament,
  type ReactionStyle 
} from './IdentitySkeletonEngine';
import { 
  MemorylessPersonalityEngine,
  type UserEnergyState,
  type PersonalityAdaptation 
} from './MemorylessPersonalityEngine';
import { 
  AscendantSignatureEngine,
  type SignatureProfile,
  type CharacterArchetype 
} from './AscendantSignatureEngine';
import { 
  PresenceStabilizerEngine,
  type PresenceContext,
  type PresenceConsistency 
} from './PresenceStabilizerEngine';

// ================================
// COMPONENT PROPS
// ================================

interface AscendantIdentityOverlayProps {
  className?: string;
  onPersonalityChange?: (skeleton: IdentitySkeleton) => void;
}

// ================================
// MAIN COMPONENT
// ================================

export function AscendantIdentityOverlay({ 
  className = '',
  onPersonalityChange 
}: AscendantIdentityOverlayProps) {
  // Engines
  const [skeletonEngine] = useState(() => new IdentitySkeletonEngine());
  const [personalityEngine, setPersonalityEngine] = useState<MemorylessPersonalityEngine | null>(null);
  const [signatureEngine] = useState(() => new AscendantSignatureEngine());
  const [presenceEngine, setPresenceEngine] = useState<PresenceStabilizerEngine | null>(null);

  // State
  const [activeTab, setActiveTab] = useState<'identity' | 'personality' | 'signature' | 'presence'>('identity');
  const [skeleton, setSkeleton] = useState<IdentitySkeleton | null>(null);
  const [signatureProfile, setSignatureProfile] = useState<SignatureProfile | null>(null);
  const [currentAdaptation, setCurrentAdaptation] = useState<PersonalityAdaptation | null>(null);
  const [presenceConsistency, setPresenceConsistency] = useState<PresenceConsistency | null>(null);
  const [selectedContext, setSelectedContext] = useState<PresenceContext>('dashboard');

  // Initialize engines
  useEffect(() => {
    const skel = skeletonEngine.getSkeleton();
    setSkeleton(skel);
    
    const sig = signatureEngine.generateSignature(skel);
    setSignatureProfile(sig);
    
    const personality = new MemorylessPersonalityEngine(skel);
    setPersonalityEngine(personality);
    
    const presence = new PresenceStabilizerEngine(skel, sig);
    setPresenceEngine(presence);
    
    const consistency = presence.calculatePresenceConsistency();
    setPresenceConsistency(consistency);
  }, [skeletonEngine, signatureEngine]);

  // Update personality when skeleton changes
  useEffect(() => {
    if (skeleton && onPersonalityChange) {
      onPersonalityChange(skeleton);
    }
  }, [skeleton, onPersonalityChange]);

  // Handle temperament slider change
  const handleTemperamentChange = (key: keyof CoreTemperament, value: number) => {
    skeletonEngine.updateTemperament({ [key]: value });
    const updated = skeletonEngine.getSkeleton();
    setSkeleton(updated);
    
    if (signatureEngine) {
      const newSig = signatureEngine.generateSignature(updated);
      setSignatureProfile(newSig);
    }
    
    if (presenceEngine) {
      const newConsistency = presenceEngine.calculatePresenceConsistency();
      setPresenceConsistency(newConsistency);
    }
  };

  // Test user input for adaptation
  const [testInput, setTestInput] = useState('');
  const handleTestAdaptation = () => {
    if (!personalityEngine || !testInput.trim()) return;
    
    const userEnergy = personalityEngine.analyzeUserEnergy(testInput);
    const toneAnalysis = personalityEngine.analyzeTone(userEnergy);
    const adaptation = personalityEngine.adaptToUserEnergy(userEnergy, toneAnalysis);
    
    setCurrentAdaptation(adaptation);
  };

  if (!skeleton || !signatureProfile) {
    return <div className="ascendant-loading">Initializing identity system...</div>;
  }

  return (
    <div className={`ascendant-identity-overlay ${className}`}>
      {/* Header */}
      <div className="ascendant-header">
        <div className="ascendant-title">
          <span className="ascendant-icon">🌟</span>
          <h2>Ascendant Identity Core</h2>
        </div>
        <div className="ascendant-subtitle">
          {signatureProfile.archetype.split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ')} • Identity Strength: {Math.round(signatureProfile.strength)}%
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="ascendant-tabs">
        <button 
          className={`ascendant-tab ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          <span className="tab-icon">🎭</span>
          <span className="tab-label">Identity</span>
        </button>
        <button 
          className={`ascendant-tab ${activeTab === 'personality' ? 'active' : ''}`}
          onClick={() => setActiveTab('personality')}
        >
          <span className="tab-icon">⚡</span>
          <span className="tab-label">Adaptation</span>
          {currentAdaptation && <span className="tab-badge">Active</span>}
        </button>
        <button 
          className={`ascendant-tab ${activeTab === 'signature' ? 'active' : ''}`}
          onClick={() => setActiveTab('signature')}
        >
          <span className="tab-icon">✨</span>
          <span className="tab-label">Signature</span>
        </button>
        <button 
          className={`ascendant-tab ${activeTab === 'presence' ? 'active' : ''}`}
          onClick={() => setActiveTab('presence')}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-label">Presence</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="ascendant-content">
        {/* IDENTITY TAB */}
        {activeTab === 'identity' && (
          <div className="identity-panel">
            <div className="identity-summary">
              <h3>Core Temperament</h3>
              <p className="personality-summary">{skeletonEngine.getPersonalitySummary()}</p>
            </div>

            <div className="temperament-controls">
              <TemperamentSlider
                label="Warmth"
                value={skeleton.temperament.warmth}
                onChange={(v) => handleTemperamentChange('warmth', v)}
                description="Cold/analytical → Warm/empathetic"
              />
              <TemperamentSlider
                label="Energy"
                value={skeleton.temperament.energy}
                onChange={(v) => handleTemperamentChange('energy', v)}
                description="Calm/grounded → Energetic/excitable"
              />
              <TemperamentSlider
                label="Precision"
                value={skeleton.temperament.precision}
                onChange={(v) => handleTemperamentChange('precision', v)}
                description="Loose/creative → Precise/systematic"
              />
              <TemperamentSlider
                label="Assertiveness"
                value={skeleton.temperament.assertiveness}
                onChange={(v) => handleTemperamentChange('assertiveness', v)}
                description="Passive/supportive → Assertive/directive"
              />
            </div>

            <div className="identity-metrics">
              <MetricCard 
                label="Coherence" 
                value={skeleton.coherenceScore} 
                description="How well components align"
              />
              <MetricCard 
                label="Stability" 
                value={skeleton.stabilityScore} 
                description="Personality consistency"
              />
              <MetricCard 
                label="Authenticity" 
                value={skeleton.authenticityScore} 
                description="True to design"
              />
            </div>
          </div>
        )}

        {/* PERSONALITY ADAPTATION TAB */}
        {activeTab === 'personality' && (
          <div className="personality-panel">
            <div className="adaptation-tester">
              <h3>Test Personality Adaptation</h3>
              <p className="adaptation-desc">
                See how BagBot adapts to different tones and energies
              </p>
              
              <textarea
                className="test-input"
                placeholder="Type a message to test adaptation... (e.g., 'Help! This is urgent!!!' or 'Hey, pretty cool stuff here')"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                rows={3}
              />
              
              <button 
                className="test-button"
                onClick={handleTestAdaptation}
                disabled={!testInput.trim()}
              >
                Analyze & Adapt
              </button>
            </div>

            {currentAdaptation && (
              <div className="adaptation-display">
                <h4>Active Adaptation</h4>
                <p className="adaptation-reason">{currentAdaptation.adaptationReason}</p>
                
                <div className="adaptation-adjustments">
                  <AdjustmentBar label="Warmth" value={currentAdaptation.warmthAdjustment} />
                  <AdjustmentBar label="Energy" value={currentAdaptation.energyAdjustment} />
                  <AdjustmentBar label="Formality" value={currentAdaptation.formalityAdjustment} />
                  <AdjustmentBar label="Verbosity" value={currentAdaptation.verbosityAdjustment} />
                  <AdjustmentBar label="Directness" value={currentAdaptation.directnessAdjustment} />
                </div>

                <div className="response-modifiers">
                  <h5>Response Modifiers</h5>
                  <div className="modifier-grid">
                    {Object.entries(currentAdaptation.responseModifiers).map(([key, value]) => (
                      <div key={key} className={`modifier ${value ? 'active' : 'inactive'}`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="adaptation-expiry">
                  Expires in: {Math.round((currentAdaptation.expiresAt - Date.now()) / 1000 / 60)} minutes
                </div>
              </div>
            )}

            {personalityEngine && (
              <div className="adaptation-stats">
                <h4>Adaptation Statistics</h4>
                {(() => {
                  const stats = personalityEngine.getAdaptationStats();
                  return (
                    <div className="stats-grid">
                      <StatCard label="Total Adaptations" value={stats.totalAdaptations.toString()} />
                      <StatCard label="Avg Excitement" value={`${Math.round(stats.averageExcitementDetected)}%`} />
                      <StatCard label="Avg Stress" value={`${Math.round(stats.averageStressDetected)}%`} />
                      <StatCard label="Common Strategy" value={stats.mostCommonStrategy} />
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* SIGNATURE TAB */}
        {activeTab === 'signature' && (
          <div className="signature-panel">
            <div className="signature-overview">
              <h3>{signatureProfile.archetype.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
              <p className="character-summary">{signatureProfile.characterSummary}</p>
            </div>

            <div className="signature-dimensions">
              <h4>Character Dimensions</h4>
              <div className="dimensions-grid">
                <DimensionCard label="Warmth" value={signatureProfile.dimensions.warmth} />
                <DimensionCard label="Sharpness" value={signatureProfile.dimensions.sharpness} />
                <DimensionCard label="Calmness" value={signatureProfile.dimensions.calmness} />
                <DimensionCard label="Responsiveness" value={signatureProfile.dimensions.responsiveness} />
                <DimensionCard label="Analytical" value={signatureProfile.dimensions.analytical} />
                <DimensionCard label="Expressive" value={signatureProfile.dimensions.expressive} />
                <DimensionCard label="Energy" value={signatureProfile.dimensions.energy} />
                <DimensionCard label="Groundedness" value={signatureProfile.dimensions.groundedness} />
              </div>
            </div>

            <div className="user-experience">
              <h4>How You'll Experience BagBot</h4>
              <div className="experience-grid">
                <ExperienceCard 
                  label="First Impression" 
                  value={signatureProfile.userExperience.firstImpression} 
                />
                <ExperienceCard 
                  label="Ongoing Feel" 
                  value={signatureProfile.userExperience.ongoingFeel} 
                />
                <ExperienceCard 
                  label="In Crisis" 
                  value={signatureProfile.userExperience.inCrisis} 
                />
                <ExperienceCard 
                  label="In Success" 
                  value={signatureProfile.userExperience.inSuccess} 
                />
              </div>
            </div>

            <div className="catchphrases">
              <h4>Signature Phrases</h4>
              <div className="phrase-list">
                {signatureProfile.catchphrases.map((phrase, i) => (
                  <div key={i} className="phrase-item">"{phrase}"</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRESENCE TAB */}
        {activeTab === 'presence' && presenceEngine && presenceConsistency && (
          <div className="presence-panel">
            <div className="consistency-overview">
              <h3>Presence Consistency</h3>
              <div className="consistency-grid">
                <MetricCard 
                  label="Cross-Context" 
                  value={presenceConsistency.crossContextCoherence} 
                  description="Consistency across pages"
                />
                <MetricCard 
                  label="Stability" 
                  value={presenceConsistency.temperamentStability} 
                  description="Personality stability"
                />
                <MetricCard 
                  label="Recognizability" 
                  value={presenceConsistency.signatureRecognizability} 
                  description="Feels like BagBot"
                />
                <MetricCard 
                  label="Presence Strength" 
                  value={presenceConsistency.presenceStrength} 
                  description="Identity distinctiveness"
                />
              </div>
            </div>

            <div className="context-selector">
              <h4>Context Stabilization</h4>
              <p className="context-desc">See how BagBot adapts across different contexts</p>
              
              <div className="context-buttons">
                {(['dashboard', 'terminal', 'chat', 'signals', 'strategies', 'settings'] as PresenceContext[]).map(ctx => (
                  <button
                    key={ctx}
                    className={`context-btn ${selectedContext === ctx ? 'active' : ''}`}
                    onClick={() => setSelectedContext(ctx)}
                  >
                    {ctx.charAt(0).toUpperCase() + ctx.slice(1)}
                  </button>
                ))}
              </div>

              {(() => {
                const contextPresence = presenceEngine.getContextualPresence(selectedContext);
                const stabilized = presenceEngine.stabilizeForContext(selectedContext, currentAdaptation);
                
                return (
                  <div className="context-details">
                    <h5>{selectedContext.charAt(0).toUpperCase() + selectedContext.slice(1)} Context</h5>
                    
                    <div className="context-requirements">
                      <div className="requirement">
                        <span className="req-label">Formality Required:</span>
                        <span className="req-value">{contextPresence.formalityRequired}%</span>
                      </div>
                      <div className="requirement">
                        <span className="req-label">Precision Required:</span>
                        <span className="req-value">{contextPresence.precisionRequired}%</span>
                      </div>
                      <div className="requirement">
                        <span className="req-label">Brevity Required:</span>
                        <span className="req-value">{contextPresence.brevityRequired}%</span>
                      </div>
                    </div>

                    <div className="stabilized-temperament">
                      <h6>Stabilized Temperament</h6>
                      <div className="temperament-bars">
                        <MiniBar label="Warmth" value={stabilized.warmth} />
                        <MiniBar label="Energy" value={stabilized.energy} />
                        <MiniBar label="Precision" value={stabilized.precision} />
                        <MiniBar label="Formality" value={stabilized.formality} />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================
// SUB-COMPONENTS
// ================================

function TemperamentSlider({ 
  label, 
  value, 
  onChange, 
  description 
}: { 
  label: string; 
  value: number; 
  onChange: (value: number) => void; 
  description: string;
}) {
  return (
    <div className="temperament-slider">
      <div className="slider-header">
        <label>{label}</label>
        <span className="slider-value">{Math.round(value)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input"
      />
      <div className="slider-description">{description}</div>
    </div>
  );
}

function MetricCard({ label, value, description }: { label: string; value: number; description: string }) {
  const health = value >= 80 ? 'excellent' : value >= 60 ? 'good' : value >= 40 ? 'fair' : 'poor';
  
  return (
    <div className={`metric-card metric-${health}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{Math.round(value)}%</div>
      <div className="metric-bar">
        <div className="metric-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="metric-description">{description}</div>
    </div>
  );
}

function AdjustmentBar({ label, value }: { label: string; value: number }) {
  const direction = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
  const displayValue = value > 0 ? `+${Math.round(value)}` : Math.round(value);
  
  return (
    <div className={`adjustment-bar adjustment-${direction}`}>
      <div className="adjustment-label">{label}</div>
      <div className="adjustment-visual">
        <div className="adjustment-center" />
        <div 
          className="adjustment-fill" 
          style={{ 
            width: `${Math.abs(value) * 1.5}%`,
            [value > 0 ? 'left' : 'right']: '50%'
          }} 
        />
      </div>
      <div className="adjustment-value">{displayValue}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function DimensionCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="dimension-card">
      <div className="dimension-label">{label}</div>
      <div className="dimension-value">{value}</div>
    </div>
  );
}

function ExperienceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="experience-card">
      <div className="experience-label">{label}</div>
      <div className="experience-value">{value}</div>
    </div>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mini-bar">
      <span className="mini-label">{label}</span>
      <div className="mini-track">
        <div className="mini-fill" style={{ width: `${value}%` }} />
      </div>
      <span className="mini-value">{Math.round(value)}</span>
    </div>
  );
}
