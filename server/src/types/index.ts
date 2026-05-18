export type ObjectiveStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
export type ObjectiveOrigin = 'manual' | 'ia';

export interface Objective {
  id: string;
  userId: string;
  titulo: string;
  descricao: string;
  categoria: string;
  status: ObjectiveStatus;
  origem: ObjectiveOrigin;
  prioridade?: number;
  prazo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  nome: string;
  cargo: string;
  email?: string;
  telefone?: string;
  departamento?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  tipo: string;
  descricao: string;
  entidade?: string;
  entidadeId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  titulo: string;
  conteudo: string;
  resumo: string;
  stats: ReportStats;
  createdAt: string;
}

export interface ReportStats {
  totalObjectives: number;
  objectivesCompleted: number;
  objectivesInProgress: number;
  completionRate: number;
  teamSize: number;
  aiObjectives: number;
}

export interface ConsultantFramework {
  id: string;
  userId?: string;
  titulo: string;
  conteudo: string;
  tags?: string[];
  createdAt: string;
}

export interface AiModel {
  id: string;
  name: string;
}

export interface SuggestedObjective {
  titulo: string;
  descricao: string;
  categoria: string;
  prioridade?: number;
}
