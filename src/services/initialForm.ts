import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { InitialFormData } from '../types';

const COLLECTION = 'initialForms';

const emptyForm: InitialFormData = {
  organizacao: '',
  produtoServico: '',
  estagioNegocio: '',
  fatoresExternos: '',
  mudancasRecentes: '',
};

export async function getInitialForm(userId: string) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { data: { ...emptyForm }, completedAt: null as Date | null };
  }
  const raw = snap.data();
  const completedAt = raw.completedAt?.toDate?.() ?? null;
  return {
    data: {
      organizacao: raw.organizacao ?? '',
      produtoServico: raw.produtoServico ?? '',
      estagioNegocio: raw.estagioNegocio ?? '',
      fatoresExternos: raw.fatoresExternos ?? '',
      mudancasRecentes: raw.mudancasRecentes ?? '',
    },
    completedAt,
  };
}

export async function saveInitialForm(userId: string, data: InitialFormData) {
  const ref = doc(db, COLLECTION, userId);
  await setDoc(ref, { ...data, completedAt: serverTimestamp() });
  return new Date();
}
