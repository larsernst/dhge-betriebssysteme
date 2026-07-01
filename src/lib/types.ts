export interface McqOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface McqOptionPublic {
  id: string;
  text: string;
}

export interface QuestionPublic {
  id: string;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  mcqOptions: McqOptionPublic[] | null;
}

export interface ReviewNextResponse {
  review: { question: QuestionPublic } | null;
  isNew: boolean;
}