export interface SearchDocumentationResponse {
  question: string;
  status: string;
  sources: DocumentationSource[];
}

interface DocumentationSource {
  title: string;
  subtitle: string;
  url: string;
  type: string;
  content: string;
}
