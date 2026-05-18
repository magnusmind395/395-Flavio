import { FormEvent, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getInitialForm, saveInitialForm } from '../services/initialForm';
import { BUSINESS_STAGES, type InitialFormData } from '../types';

const empty: InitialFormData = {
  organizacao: '',
  produtoServico: '',
  estagioNegocio: '',
  fatoresExternos: '',
  mudancasRecentes: '',
};

export function InitialFormPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<InitialFormData>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof InitialFormData, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u?.uid ?? null));
    return unsub;
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getInitialForm(userId)
      .then(({ data: d, completedAt: at }) => {
        setData(d);
        setCompletedAt(at);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const validate = () => {
    const e: Partial<Record<keyof InitialFormData, string>> = {};
    if (!data.organizacao.trim()) e.organizacao = 'Este campo é obrigatório';
    if (!data.produtoServico.trim()) e.produtoServico = 'Este campo é obrigatório';
    if (!data.estagioNegocio) e.estagioNegocio = 'Selecione uma opção';
    if (!data.fatoresExternos.trim()) e.fatoresExternos = 'Este campo é obrigatório';
    if (!data.mudancasRecentes.trim()) e.mudancasRecentes = 'Este campo é obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!userId || !validate()) return;
    setSaving(true);
    setSuccess(false);
    try {
      const at = await saveInitialForm(userId, data);
      setCompletedAt(at);
      setSuccess(true);
    } catch {
      setErrors({ organizacao: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="form-loading">Carregando formulário...</p>;
  }

  return (
    <div className="form-container-inline">
      <div className="form-card-inline">
        <div className="form-logo">
          <img src="/icone-magnusmind.svg" alt="" className="logo-icon" />
          <p className="logo-text">magnus mind</p>
        </div>
        <h1 className="form-title">Informações Iniciais</h1>
        {completedAt && (
          <p className="form-timestamp">
            Última atualização: <strong>{completedAt.toLocaleString('pt-BR')}</strong>
          </p>
        )}
        {success && <p className="form-success-msg">Respostas salvas com sucesso.</p>}

        <form className="initial-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">1. Descreva sua organização e o contexto do negócio</label>
            <textarea
              className={`form-textarea ${errors.organizacao ? 'input-error' : ''}`}
              rows={4}
              value={data.organizacao}
              onChange={(e) => setData({ ...data, organizacao: e.target.value })}
              placeholder="Conte sobre sua empresa, mercado e posicionamento..."
            />
            {errors.organizacao && <span className="error-message">{errors.organizacao}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">2. Qual é o principal produto ou serviço que gera valor para o cliente?</label>
            <textarea
              className={`form-textarea ${errors.produtoServico ? 'input-error' : ''}`}
              rows={3}
              value={data.produtoServico}
              onChange={(e) => setData({ ...data, produtoServico: e.target.value })}
            />
            {errors.produtoServico && <span className="error-message">{errors.produtoServico}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">3. Em qual estágio o negócio se encontra atualmente?</label>
            <div className="radio-group">
              {BUSINESS_STAGES.map((stage) => (
                <label
                  key={stage}
                  className={`radio-option ${data.estagioNegocio === stage ? 'checked' : ''}`}
                >
                  <input
                    type="radio"
                    name="estagio"
                    className="radio-input"
                    checked={data.estagioNegocio === stage}
                    onChange={() => setData({ ...data, estagioNegocio: stage })}
                  />
                  <span className="radio-label">{stage}</span>
                </label>
              ))}
            </div>
            {errors.estagioNegocio && <span className="error-message">{errors.estagioNegocio}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">4. Quais fatores externos mais impactam seu negócio hoje?</label>
            <textarea
              className={`form-textarea ${errors.fatoresExternos ? 'input-error' : ''}`}
              rows={3}
              value={data.fatoresExternos}
              onChange={(e) => setData({ ...data, fatoresExternos: e.target.value })}
            />
            {errors.fatoresExternos && <span className="error-message">{errors.fatoresExternos}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">5. O que mudou recentemente que exige repensar sua forma de operar ou liderar?</label>
            <textarea
              className={`form-textarea ${errors.mudancasRecentes ? 'input-error' : ''}`}
              rows={3}
              value={data.mudancasRecentes}
              onChange={(e) => setData({ ...data, mudancasRecentes: e.target.value })}
            />
            {errors.mudancasRecentes && <span className="error-message">{errors.mudancasRecentes}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Formulário'}
            <span className="btn-arrow">→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
