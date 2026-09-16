/**
 * Plain module (no 'use client') so the server page can parse `?tab=` and the
 * client hub component can share the same type. Calling a function exported
 * from a 'use client' file on the server is a runtime error in Next 16.
 */
export type EmployeesTab = 'employees' | 'pending' | 'terminated';

export function parseEmployeesTab(value: string | undefined): EmployeesTab {
  if (value === 'pending' || value === 'terminated') return value;
  return 'employees';
}
