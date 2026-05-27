/** Persiste se o utilizador vê o Gate Zero ou o chat (após primeira decisão). */
const PREFIX = 'mm_consultoria_gate_ui:v1:';

export function consultoriaGateUiKey(uid: string): string {
  return `${PREFIX}${uid}`;
}

export function readConsultoriaGateUiPhase(uid: string): 'gate' | 'chat' {
  try {
    return localStorage.getItem(consultoriaGateUiKey(uid)) === 'gate' ? 'gate' : 'chat';
  } catch {
    return 'chat';
  }
}

export function writeConsultoriaGateUiPhase(uid: string, phase: 'gate' | 'chat'): void {
  try {
    localStorage.setItem(consultoriaGateUiKey(uid), phase);
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveConsultoriaUiPhase(
  uid: string | undefined,
  gateDoc: { selectedPath?: 'A' | 'B'; skipped?: boolean } | null
): 'gate' | 'chat' {
  const hasDecision = Boolean(gateDoc?.selectedPath || gateDoc?.skipped);
  if (!hasDecision || !uid) return 'gate';
  return readConsultoriaGateUiPhase(uid);
}
