declare module "@shared/schema" {
  export interface Section {
    id: number;
    title: string;
    slug: string;
    content: string;
    icon: string;
    updatedAt: Date;
  }
}

declare module "@tanstack/react-query" {
  export interface UseQueryOptions {
    onError?: (err: any) => void;
    onSuccess?: (data: any) => void;
    onSettled?: (data: any, error: any) => void;
  }
} 