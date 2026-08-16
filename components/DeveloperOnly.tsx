import type { PropsWithChildren } from 'react';
import { shouldShowDeveloperTools } from '@/lib/developer';

export function DeveloperOnly({ children }: PropsWithChildren) {
  return shouldShowDeveloperTools() ? <>{children}</> : null;
}
