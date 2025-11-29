"use client";

import { ThemeProvider } from '@/app/providers';
import GodModeIntro from '@/app/components/intro/GodModeIntro';
import { BehaviorProvider } from '@/app/engine/bic/BehaviorProvider';
import { CognitiveFusionProvider } from '@/app/engine/cognitive/CognitiveFusionProvider';
import { EntityProvider } from '@/app/engine/entity/EntityProvider';
import { MemoryImprintProvider } from '@/app/engine/entity/MemoryImprintProvider';
import { EnvironmentalConsciousnessCore } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';
import { EnvironmentalFusionProvider } from '@/app/engine/fusion';
import { StabilityProvider } from '@/app/engine/reflex';
import { IdentityPersistenceLayer } from '@/components/presence/IdentityPersistenceLayer';
import { SymbioticGuardianProvider } from '@/components/guardian/SymbioticGuardianProvider';
import { SovereignProvider } from '@/components/sovereignty/SovereignProvider';
import Navigation from '@/app/components/navigation/Navigation';
import ThreatOverlay from '@/app/components/threat/ThreatOverlay';
import ThreatReactivePanel from '@/app/components/threat/ThreatReactivePanel';
import SafeModeBanner from '@/components/SafeModeBanner';

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
