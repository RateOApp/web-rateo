import { api } from '@/lib/api/client';
import type { Faq, FaqResponseItem } from '@/types/support';

/**
 * `GET /faqs` is public. The controller projects `{ id, question, answer,
 * category, order }`; older deployments returned the raw documents with `_id`.
 */
export function normaliseFaqs(data: unknown): Faq[] {
  const rows: FaqResponseItem[] = Array.isArray(data)
    ? (data as FaqResponseItem[])
    : Array.isArray((data as { faqs?: unknown } | null)?.faqs)
      ? ((data as { faqs: FaqResponseItem[] }).faqs)
      : [];

  return rows
    .map((row, index) => ({
      id: String(row.id ?? row._id ?? index),
      question: row.question?.trim() ?? '',
      answer: row.answer?.trim() ?? '',
      category: row.category?.trim() ?? '',
      order: typeof row.order === 'number' ? row.order : index,
    }))
    .filter((faq) => faq.question && faq.answer);
}

export const faqsService = {
  list(): Promise<Faq[]> {
    return api.get<unknown>('/faqs').then((r) => normaliseFaqs(r.data));
  },
};
