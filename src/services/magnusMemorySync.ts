import { auth } from '../config/firebase';
import { buildDiagnosticContext } from '../constants/diagnosticFlow';
import { buildGateContextAppendix } from '../constants/blueprintFlow';
import { magnusMemoryApi } from './api';
import { getBlueprintGate } from './blueprintGate';
import { getInitialForm } from './initialForm';
import type { InitialFormData } from '../types';
import type { BlueprintPath } from '../constants/blueprintFlow';

let syncTimer: ReturnType<typeof setTimeout> | null = null;

/** Envia snapshot de diagnóstico/gate ao servidor para memória da IA */
export async function syncMagnusMemoryToServer(payload?: {
  diagnosticContext?: string;
  gateContext?: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const body: { diagnosticContext?: string; gateContext?: string } = {};
  if (payload?.diagnosticContext?.trim()) body.diagnosticContext = payload.diagnosticContext.trim();
  if (payload?.gateContext?.trim()) body.gateContext = payload.gateContext.trim();
  if (!body.diagnosticContext && !body.gateContext) return;

  try {
    await magnusMemoryApi.sync(body);
  } catch {
    /* offline / API indisponível — cliente ainda envia contexto no chat */
  }
}

export async function syncMagnusMemoryFromFirebase(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const [{ data, completedAt }, gate] = await Promise.all([
    getInitialForm(user.uid),
    getBlueprintGate(user.uid).catch(() => null),
  ]);

  const diagnosticContext = completedAt ? buildDiagnosticContext(data) : buildDiagnosticContext(data);
  const gateContext =
    gate?.selectedPath != null
      ? buildGateContextAppendix(gate.selectedPath, {
          aiRecommendedPath: gate.aiRecommendedPath,
          rationale: gate.rationale,
        })
      : '';

  await syncMagnusMemoryToServer({
    diagnosticContext: diagnosticContext || undefined,
    gateContext: gateContext || undefined,
  });
}

/** Debounce para rascunho do diagnóstico (não spammar API) */
export function scheduleMagnusMemorySyncFromForm(data: InitialFormData, delayMs = 2500): void {
  const user = auth.currentUser;
  if (!user) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const diagnosticContext = buildDiagnosticContext(data);
    void syncMagnusMemoryToServer({ diagnosticContext });
  }, delayMs);
}

export async function syncMagnusMemoryAfterGate(selectedPath: BlueprintPath, extras?: {
  aiRecommendedPath?: BlueprintPath;
  rationale?: string;
}): Promise<void> {
  const gateContext = buildGateContextAppendix(selectedPath, extras);
  const user = auth.currentUser;
  if (!user) return;

  const { data, completedAt } = await getInitialForm(user.uid);
  const diagnosticContext = completedAt ? buildDiagnosticContext(data) : buildDiagnosticContext(data);

  await syncMagnusMemoryToServer({
    diagnosticContext: diagnosticContext || undefined,
    gateContext,
  });
}

/** Após salvar/encerrar Action Canvas — servidor já tem canvases; reforça sync do diagnóstico */
export async function syncMagnusMemoryAfterCanvasChange(): Promise<void> {
  await syncMagnusMemoryFromFirebase();
}
