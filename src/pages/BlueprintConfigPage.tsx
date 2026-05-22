import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Copy,
  Edit3,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  agentApi,
  type AgentSettingsDto,
  type AgentSkillDto,
} from '../services/api';

const DEFAULT_SETTINGS: AgentSettingsDto = {
  enabled: false,
  personaOverride: '',
  rules: '',
  tone: '',
  responseFormat: '',
  forbidden: '',
  preferredModel: '',
};

interface SkillFormState {
  id: string | null;
  slug: string;
  title: string;
  description: string;
  content: string;
  tagsRaw: string;
  enabled: boolean;
}

const EMPTY_SKILL_FORM: SkillFormState = {
  id: null,
  slug: '',
  title: '',
  description: '',
  content: '',
  tagsRaw: '',
  enabled: true,
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function BlueprintConfigPage() {
  const [settings, setSettings] = useState<AgentSettingsDto>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsToast, setSettingsToast] = useState<string | null>(null);

  const [skills, setSkills] = useState<AgentSkillDto[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skillForm, setSkillForm] = useState<SkillFormState>(EMPTY_SKILL_FORM);
  const [savingSkill, setSavingSkill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await agentApi.getSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch {
      setError('Não foi possível carregar as configurações do agente.');
    }
  }, []);

  const loadSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const list = await agentApi.listSkills();
      setSkills(list);
    } catch {
      setError('Não foi possível carregar as skills.');
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    void loadSkills();
  }, [loadSettings, loadSkills]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError(null);
    try {
      const saved = await agentApi.saveSettings(settings);
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setSettingsToast('Configurações salvas. O agente passará a respeitar essas regras nas próximas respostas.');
      window.setTimeout(() => setSettingsToast(null), 4500);
    } catch {
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSavingSettings(false);
    }
  };

  const startNewSkill = () => {
    setSkillForm(EMPTY_SKILL_FORM);
    requestAnimationFrame(() => {
      const el = document.getElementById('skill-form');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const startEditSkill = (skill: AgentSkillDto) => {
    setSkillForm({
      id: skill.id,
      slug: skill.slug,
      title: skill.title,
      description: skill.description ?? '',
      content: skill.content,
      tagsRaw: (skill.tags ?? []).join(', '),
      enabled: skill.enabled,
    });
    requestAnimationFrame(() => {
      const el = document.getElementById('skill-form');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleSlugAutoFromTitle = () => {
    if (!skillForm.slug && skillForm.title) {
      setSkillForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.title.trim() || !skillForm.content.trim()) {
      setError('Título e conteúdo da skill são obrigatórios.');
      return;
    }

    setSavingSkill(true);
    setError(null);

    const payload: Partial<AgentSkillDto> = {
      slug: slugify(skillForm.slug || skillForm.title),
      title: skillForm.title.trim(),
      description: skillForm.description.trim(),
      content: skillForm.content.trim(),
      enabled: skillForm.enabled,
      tags: skillForm.tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (skillForm.id) {
        const updated = await agentApi.updateSkill(skillForm.id, payload);
        setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await agentApi.createSkill(payload);
        setSkills((prev) => [created, ...prev]);
      }
      setSkillForm(EMPTY_SKILL_FORM);
    } catch {
      setError('Erro ao salvar skill. Verifique os dados e tente novamente.');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleToggleSkill = async (skill: AgentSkillDto) => {
    try {
      const updated = await agentApi.updateSkill(skill.id, { enabled: !skill.enabled });
      setSkills((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      setError('Não foi possível alternar a skill.');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!window.confirm('Remover esta skill permanentemente?')) return;
    try {
      await agentApi.removeSkill(id);
      setSkills((prev) => prev.filter((s) => s.id !== id));
      if (skillForm.id === id) setSkillForm(EMPTY_SKILL_FORM);
    } catch {
      setError('Não foi possível remover a skill.');
    }
  };

  const handleCopySlug = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`/${slug}`);
      setCopied(slug);
      window.setTimeout(() => setCopied((c) => (c === slug ? null : c)), 1500);
    } catch {
      /* clipboard indisponível: silenciar */
    }
  };

  const enabledCount = useMemo(() => skills.filter((s) => s.enabled).length, [skills]);

  return (
    <div className="blueprint-config-page">
      <header className="blueprint-config-header">
        <Link to="/dashboard/consultoria-ia" className="blueprint-config-back">
          <ChevronLeft size={16} />
          Voltar ao Blueprint
        </Link>
        <div className="blueprint-config-title-group">
          <div className="blueprint-config-eyebrow">
            <Settings2 size={14} aria-hidden />
            <span>Onda 2 · Design · Configuração do Agente</span>
          </div>
          <h1 className="blueprint-config-title">Regras e Skills do Magnus Mind</h1>
          <p className="blueprint-config-subtitle">
            Defina a persona, regras obrigatórias, tom e formato de resposta do agente. Crie
            <strong> skills</strong> invocáveis por <code>/nomedaskill</code> no chat para que ele
            assuma comportamentos específicos sob demanda.
          </p>
        </div>
        <div className="blueprint-config-meta">
          <div className="meta-stat">
            <span className="meta-stat-value">{settings.enabled ? 'ATIVO' : 'INATIVO'}</span>
            <span className="meta-stat-label">Regras gerais</span>
          </div>
          <div className="meta-stat">
            <span className="meta-stat-value">{enabledCount}</span>
            <span className="meta-stat-label">Skills habilitadas</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="blueprint-config-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>Fechar</button>
        </div>
      )}

      {settingsToast && (
        <div className="blueprint-config-toast" role="status">
          <Check size={16} />
          <span>{settingsToast}</span>
        </div>
      )}

      <section className="blueprint-config-section" aria-labelledby="blueprint-settings-title">
        <header className="blueprint-section-header">
          <div>
            <h2 id="blueprint-settings-title" className="blueprint-section-title">
              <Sparkles size={18} aria-hidden /> Configurações gerais do agente
            </h2>
            <p className="blueprint-section-subtitle">
              Estas regras se somam ao SYSTEM_PROMPT base e valem para <strong>todas as
              conversas</strong> deste usuário.
            </p>
          </div>
          <label className="blueprint-toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <span className="blueprint-toggle-track" aria-hidden />
            <span className="blueprint-toggle-text">
              {settings.enabled ? 'Aplicar regras' : 'Não aplicar'}
            </span>
          </label>
        </header>

        <div className="blueprint-form-grid">
          <label className="blueprint-field blueprint-field-full">
            <span className="blueprint-field-label">Persona customizada</span>
            <span className="blueprint-field-hint">
              Substitui ou complementa o "Você é o consultor estratégico Magnus Mind…" padrão.
            </span>
            <textarea
              className="blueprint-textarea"
              rows={4}
              value={settings.personaOverride ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, personaOverride: e.target.value }))}
              placeholder="Ex.: Você é o copiloto estratégico de um CEO em fase de Reinvenção. Foque em decisões irreversíveis…"
            />
          </label>

          <label className="blueprint-field blueprint-field-full">
            <span className="blueprint-field-label">Regras obrigatórias</span>
            <span className="blueprint-field-hint">
              Lista de comportamentos que o agente DEVE seguir. Uma por linha.
            </span>
            <textarea
              className="blueprint-textarea"
              rows={5}
              value={settings.rules ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, rules: e.target.value }))}
              placeholder="1. Sempre cite o framework de referência ao final.&#10;2. Não invente dados sobre minha empresa.&#10;3. Prefira perguntas socráticas a respostas prontas."
            />
          </label>

          <label className="blueprint-field">
            <span className="blueprint-field-label">Tom e voz</span>
            <textarea
              className="blueprint-textarea"
              rows={3}
              value={settings.tone ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, tone: e.target.value }))}
              placeholder="Direto, executivo, com analogias do mercado financeiro."
            />
          </label>

          <label className="blueprint-field">
            <span className="blueprint-field-label">Formato de resposta</span>
            <textarea
              className="blueprint-textarea"
              rows={3}
              value={settings.responseFormat ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, responseFormat: e.target.value }))}
              placeholder="1) Diagnóstico (3 bullets) → 2) Recomendação → 3) Próximo passo."
            />
          </label>

          <label className="blueprint-field blueprint-field-full">
            <span className="blueprint-field-label">Comportamentos proibidos</span>
            <textarea
              className="blueprint-textarea"
              rows={3}
              value={settings.forbidden ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, forbidden: e.target.value }))}
              placeholder="Não usar emojis. Não citar concorrentes pelo nome. Não dar respostas com mais de 400 palavras."
            />
          </label>
        </div>

        <div className="blueprint-section-footer">
          <button
            type="button"
            className="blueprint-primary-button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            <Save size={16} />
            {savingSettings ? 'Salvando…' : 'Salvar configurações'}
          </button>
        </div>
      </section>

      <section className="blueprint-config-section" aria-labelledby="blueprint-skills-title">
        <header className="blueprint-section-header">
          <div>
            <h2 id="blueprint-skills-title" className="blueprint-section-title">
              <Zap size={18} aria-hidden /> Skills · Habilidades invocáveis
            </h2>
            <p className="blueprint-section-subtitle">
              Crie comportamentos específicos. Para ativar uma skill em uma mensagem, digite{' '}
              <code>/slug</code> no chat. Múltiplas skills podem ser combinadas na mesma mensagem.
            </p>
          </div>
          <button type="button" className="blueprint-secondary-button" onClick={startNewSkill}>
            <Plus size={16} />
            Nova skill
          </button>
        </header>

        <div className="blueprint-skills-list">
          {loadingSkills ? (
            <p className="blueprint-skills-empty">Carregando skills…</p>
          ) : skills.length === 0 ? (
            <div className="blueprint-skills-empty">
              <Zap size={32} aria-hidden />
              <p>
                Nenhuma skill criada ainda. Crie a primeira para que o agente assuma comportamentos
                sob demanda.
              </p>
              <button type="button" className="blueprint-primary-button" onClick={startNewSkill}>
                <Plus size={16} /> Criar primeira skill
              </button>
            </div>
          ) : (
            skills.map((skill) => (
              <article
                key={skill.id}
                className={`blueprint-skill-card${skill.enabled ? '' : ' is-disabled'}`}
              >
                <div className="blueprint-skill-head">
                  <button
                    type="button"
                    className="blueprint-skill-slug"
                    onClick={() => handleCopySlug(skill.slug)}
                    title="Copiar comando"
                  >
                    {copied === skill.slug ? <Check size={14} /> : <Copy size={14} />}
                    <span>/{skill.slug}</span>
                  </button>
                  <div className="blueprint-skill-actions">
                    <button
                      type="button"
                      className="blueprint-icon-button"
                      onClick={() => handleToggleSkill(skill)}
                      aria-label={skill.enabled ? 'Desativar skill' : 'Ativar skill'}
                      title={skill.enabled ? 'Desativar' : 'Ativar'}
                    >
                      <span
                        className={`blueprint-skill-status ${skill.enabled ? 'on' : 'off'}`}
                        aria-hidden
                      />
                    </button>
                    <button
                      type="button"
                      className="blueprint-icon-button"
                      onClick={() => startEditSkill(skill)}
                      aria-label="Editar skill"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      className="blueprint-icon-button danger"
                      onClick={() => handleDeleteSkill(skill.id)}
                      aria-label="Remover skill"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="blueprint-skill-title">{skill.title}</h3>
                {skill.description && (
                  <p className="blueprint-skill-description">{skill.description}</p>
                )}
                <p className="blueprint-skill-content">
                  {skill.content.length > 220
                    ? `${skill.content.slice(0, 220)}…`
                    : skill.content}
                </p>
                {skill.tags && skill.tags.length > 0 && (
                  <div className="blueprint-skill-tags">
                    {skill.tags.map((tag) => (
                      <span key={tag} className="blueprint-skill-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        <form
          id="skill-form"
          className="blueprint-skill-form"
          onSubmit={handleSaveSkill}
          aria-label={skillForm.id ? 'Editar skill' : 'Criar skill'}
        >
          <header className="blueprint-skill-form-header">
            <h3>{skillForm.id ? 'Editar skill' : 'Nova skill'}</h3>
            {skillForm.id && (
              <button
                type="button"
                className="blueprint-link-button"
                onClick={() => setSkillForm(EMPTY_SKILL_FORM)}
              >
                Cancelar edição
              </button>
            )}
          </header>

          <div className="blueprint-form-grid">
            <label className="blueprint-field">
              <span className="blueprint-field-label">Título</span>
              <input
                className="blueprint-input"
                type="text"
                value={skillForm.title}
                onChange={(e) => setSkillForm((s) => ({ ...s, title: e.target.value }))}
                onBlur={handleSlugAutoFromTitle}
                placeholder="Ex.: Outcome Forge"
                maxLength={80}
                required
              />
            </label>

            <label className="blueprint-field">
              <span className="blueprint-field-label">Comando (slug)</span>
              <span className="blueprint-field-hint">
                Será invocado com <code>/{skillForm.slug || 'slug'}</code> no chat.
              </span>
              <input
                className="blueprint-input"
                type="text"
                value={skillForm.slug}
                onChange={(e) =>
                  setSkillForm((s) => ({ ...s, slug: slugify(e.target.value) }))
                }
                placeholder="outcome-forge"
                maxLength={48}
              />
            </label>

            <label className="blueprint-field blueprint-field-full">
              <span className="blueprint-field-label">Descrição curta</span>
              <input
                className="blueprint-input"
                type="text"
                value={skillForm.description}
                onChange={(e) => setSkillForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Em uma linha, qual o objetivo desta skill."
                maxLength={140}
              />
            </label>

            <label className="blueprint-field blueprint-field-full">
              <span className="blueprint-field-label">Instruções da skill</span>
              <span className="blueprint-field-hint">
                Prompt completo que será injetado no contexto quando a skill for invocada.
              </span>
              <textarea
                className="blueprint-textarea"
                rows={8}
                value={skillForm.content}
                onChange={(e) => setSkillForm((s) => ({ ...s, content: e.target.value }))}
                placeholder="Aja como o módulo Outcome Forge do MM Blueprint. Conduza o usuário em 3 perguntas para forjar o outcome principal antes de qualquer build…"
                required
              />
            </label>

            <label className="blueprint-field">
              <span className="blueprint-field-label">Tags (separadas por vírgula)</span>
              <input
                className="blueprint-input"
                type="text"
                value={skillForm.tagsRaw}
                onChange={(e) => setSkillForm((s) => ({ ...s, tagsRaw: e.target.value }))}
                placeholder="blueprint, outcome, design"
              />
            </label>

            <label className="blueprint-field blueprint-checkbox-field">
              <input
                type="checkbox"
                checked={skillForm.enabled}
                onChange={(e) => setSkillForm((s) => ({ ...s, enabled: e.target.checked }))}
              />
              <span>Skill ativa</span>
            </label>
          </div>

          <div className="blueprint-section-footer">
            <button
              type="submit"
              className="blueprint-primary-button"
              disabled={savingSkill}
            >
              <Save size={16} />
              {savingSkill
                ? 'Salvando…'
                : skillForm.id
                ? 'Atualizar skill'
                : 'Criar skill'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
