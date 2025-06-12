// Fallback PDF analyzer que funciona sem API OpenAI
interface BasicEditalAnalysis {
  subjects: string[];
  topics: { [subject: string]: string[] };
  studyRecommendations: {
    prioritySubjects: string[];
    estimatedHoursPerSubject: { [subject: string]: number };
    weeklyDistribution: {
      [day: string]: {
        subject: string;
        topics: string[];
        hours: number;
      }[];
    };
  };
}

// Matérias comuns em concursos públicos
const commonSubjects = [
  'Português',
  'Matemática',
  'Raciocínio Lógico',
  'Informática',
  'Atualidades',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Civil',
  'Direito Penal',
  'Direito Processual Civil',
  'Direito Processual Penal',
  'Direito do Trabalho',
  'Direito Tributário',
  'Contabilidade',
  'Administração Pública',
  'Legislação Específica',
  'Conhecimentos Específicos'
];

// Tópicos por matéria
const subjectTopics: { [key: string]: string[] } = {
  'Português': [
    'Interpretação de textos',
    'Gramática',
    'Ortografia',
    'Sintaxe',
    'Semântica',
    'Redação oficial'
  ],
  'Matemática': [
    'Aritmética',
    'Álgebra',
    'Geometria',
    'Estatística',
    'Matemática financeira',
    'Razão e proporção'
  ],
  'Raciocínio Lógico': [
    'Lógica proposicional',
    'Sequências',
    'Análise combinatória',
    'Probabilidade',
    'Problemas aritméticos'
  ],
  'Informática': [
    'Windows',
    'Word',
    'Excel',
    'PowerPoint',
    'Internet',
    'Segurança da informação'
  ],
  'Direito Constitucional': [
    'Princípios fundamentais',
    'Direitos e garantias fundamentais',
    'Organização do Estado',
    'Administração Pública',
    'Controle de constitucionalidade'
  ],
  'Direito Administrativo': [
    'Princípios administrativos',
    'Atos administrativos',
    'Processo administrativo',
    'Licitações e contratos',
    'Servidores públicos'
  ]
};

export function extractBasicTextFromFilename(filename: string): string {
  // Simula extração básica baseada no nome do arquivo
  const lowercaseFilename = filename.toLowerCase();
  
  let detectedInfo = [];
  
  // Detecta órgão/instituição
  if (lowercaseFilename.includes('trt')) detectedInfo.push('Tribunal Regional do Trabalho');
  if (lowercaseFilename.includes('trf')) detectedInfo.push('Tribunal Regional Federal');
  if (lowercaseFilename.includes('tjsp')) detectedInfo.push('Tribunal de Justiça de São Paulo');
  if (lowercaseFilename.includes('prefeitura')) detectedInfo.push('Prefeitura Municipal');
  if (lowercaseFilename.includes('governo')) detectedInfo.push('Governo do Estado');
  if (lowercaseFilename.includes('federal')) detectedInfo.push('Órgão Federal');
  
  // Detecta tipo de cargo
  if (lowercaseFilename.includes('analista')) detectedInfo.push('Cargo: Analista');
  if (lowercaseFilename.includes('tecnico')) detectedInfo.push('Cargo: Técnico');
  if (lowercaseFilename.includes('auxiliar')) detectedInfo.push('Cargo: Auxiliar');
  if (lowercaseFilename.includes('escriturario')) detectedInfo.push('Cargo: Escriturário');
  
  return `Edital de concurso público. ${detectedInfo.join('. ')}.`;
}

export function generateBasicAnalysis(filename: string, examDate: string): BasicEditalAnalysis {
  const lowercaseFilename = filename.toLowerCase();
  
  // Determina matérias baseado no tipo de concurso
  let subjects: string[] = [];
  
  // Matérias básicas sempre presentes
  subjects.push('Português', 'Matemática', 'Atualidades');
  
  // Adiciona matérias específicas baseado no contexto
  if (lowercaseFilename.includes('trt') || lowercaseFilename.includes('trabalho')) {
    subjects.push('Direito do Trabalho', 'Direito Constitucional', 'Direito Administrativo');
  } else if (lowercaseFilename.includes('trf') || lowercaseFilename.includes('federal')) {
    subjects.push('Direito Constitucional', 'Direito Administrativo', 'Direito Civil');
  } else if (lowercaseFilename.includes('tecnico')) {
    subjects.push('Informática', 'Raciocínio Lógico');
  } else if (lowercaseFilename.includes('analista')) {
    subjects.push('Direito Constitucional', 'Direito Administrativo', 'Informática', 'Raciocínio Lógico');
  } else {
    // Concurso genérico
    subjects.push('Informática', 'Raciocínio Lógico', 'Direito Constitucional');
  }
  
  // Remove duplicatas
  subjects = Array.from(new Set(subjects));
  
  // Gera tópicos para cada matéria
  const topics: { [subject: string]: string[] } = {};
  subjects.forEach(subject => {
    topics[subject] = subjectTopics[subject] || ['Conteúdo programático', 'Exercícios práticos'];
  });
  
  // Calcula prioridades e horas
  const prioritySubjects = subjects.slice(0, 3); // As 3 primeiras são prioridade
  
  const estimatedHoursPerSubject: { [subject: string]: number } = {};
  subjects.forEach(subject => {
    if (subject === 'Português' || subject === 'Matemática') {
      estimatedHoursPerSubject[subject] = 25;
    } else if (prioritySubjects.includes(subject)) {
      estimatedHoursPerSubject[subject] = 20;
    } else {
      estimatedHoursPerSubject[subject] = 15;
    }
  });
  
  // Gera distribuição semanal
  const weeklyDistribution: { [day: string]: { subject: string; topics: string[]; hours: number; }[] } = {
    'Segunda': [],
    'Terça': [],
    'Quarta': [],
    'Quinta': [],
    'Sexta': [],
    'Sábado': [],
    'Domingo': []
  };
  
  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  let currentSubjectIndex = 0;
  
  // Distribui matérias pelos dias úteis
  weekDays.forEach((day, dayIndex) => {
    const subject = subjects[currentSubjectIndex % subjects.length];
    const subjectTopics = topics[subject] || [];
    const topicIndex = Math.floor(dayIndex / subjects.length);
    const selectedTopics = subjectTopics.slice(topicIndex, topicIndex + 2);
    
    weeklyDistribution[day].push({
      subject,
      topics: selectedTopics.length > 0 ? selectedTopics : ['Estudo geral'],
      hours: 3
    });
    
    currentSubjectIndex++;
  });
  
  // Fins de semana para revisão
  weeklyDistribution['Sábado'].push({
    subject: 'Revisão Geral',
    topics: ['Revisão das matérias da semana', 'Resolução de exercícios'],
    hours: 4
  });
  
  weeklyDistribution['Domingo'].push({
    subject: 'Simulados',
    topics: ['Simulados e provas anteriores', 'Análise de desempenho'],
    hours: 3
  });
  
  return {
    subjects,
    topics,
    studyRecommendations: {
      prioritySubjects,
      estimatedHoursPerSubject,
      weeklyDistribution
    }
  };
}