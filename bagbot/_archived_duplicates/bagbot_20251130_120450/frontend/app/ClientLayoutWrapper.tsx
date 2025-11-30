"use client";

import { ThemeProvider } from './providers';
import GodModeIntro from './components/intro/GodModeIntro';
import { BehaviorProvider } from './engine/bic/BehaviorProvider';
import { CognitiveFusionProvider } from './engine/cognitive/CognitiveFusionProvider';
import { EntityProvider } from './engine/entity/EntityProvider';
import { MemoryImprintProvider } from './engine/entity/MemoryImprintProvider';
import { EnvironmentalConsciousnessCore } from './engine/environmental/EnvironmentalConsciousnessCore';
import { EnvironmentalFusionProvider } from './engine/fusion';
import { StabilityProvider } from './engine/reflex';
import { IdentityPersistenceLayer } from './components/presence/IdentityPersistenceLayer';
import { SymbioticGuardianProvider } from './components/guardian/SymbioticGuardianProvider';
import { SovereignProvider } from './components/sovereignty/SovereignProvider';
import Navigation from './components/navigation/Navigation';
import ThreatOverlay from './components/threat/ThreatOverlay';
import ThreatReactivePanel from './components/threat/ThreatReactivePanel';
import SafeModeBanner from '../components/SafeModeBanner';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GodModeIntro />
      <SafeModeBanner />
      <ThreatOverlay />
      <ThreatReactivePanel />
      <SymbioticGuardianProvider enableProtection={true} enableBalancing={true}>
        <SovereignProvider>
          <IdentityPersistenceLayer enableCrossTabSync={true} enableGPUEffects={true}>
            <BehaviorProvider>
              <CognitiveFusionProvider>
                <EnvironmentalConsciousnessCore updateInterval={1000} enabled={true}>
                  <EnvironmentalFusionProvider>
                    <StabilityProvider updateInterval={16} enabled={true}>
                      <EntityProvider>
                        <MemoryImprintProvider>
                          <ThemeProvider>
                            {/* Plasma Grid Background */}
                            <div className="plasma-grid" />
                            
                            {/* Global Navigation */}
                            <Navigation />
                            
                            {children}
                          </ThemeProvider>
                        </MemoryImprintProvider>
                      </EntityProvider>
                    </StabilityProvider>
                  </EnvironmentalFusionProvider>
                </EnvironmentalConsciousnessCore>
              </CognitiveFusionProvider>
            </BehaviorProvider>
          </IdentityPersistenceLayer>
        </SovereignProvider>
      </SymbioticGuardianProvider>
    </>
  );
}
