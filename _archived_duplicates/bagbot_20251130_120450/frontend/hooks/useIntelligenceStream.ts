// hooks/useIntelligenceStream.ts
// React hook for subscribing to ShieldIntelligenceAPI

import { useEffect, useState } from 'react';
import { IntelligenceAPI } from '@/src/engine/stability-shield/ShieldIntelligenceAPI';

export function useIntelligenceStream() {
  const [snapshot, setSnapshot] = useState(IntelligenceAPI.getSnapshot());
  const [risk, setRisk] = useState(IntelligenceAPI.getRiskScore());
  const [clusters, setClusters] = useState(IntelligenceAPI.getClusters());

  useEffect(() => {
    const unsub1 = IntelligenceAPI.onUpdate((p) => setSnapshot(p));
    const unsub2 = IntelligenceAPI.onRisk((r) => setRisk(r));
    const unsub3 = IntelligenceAPI.onCluster((c) => setClusters(c));

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  return { snapshot, risk, clusters };
}
