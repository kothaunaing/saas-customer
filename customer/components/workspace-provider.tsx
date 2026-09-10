'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getWorkspace,
  saveWorkspace,
  initialData,
  workspaceKey,
  type WorkspaceData,
} from '@/customer/lib/api';
import { CheckCircle2, X } from 'lucide-react';
type Context = {
  data: WorkspaceData;
  save: (data: WorkspaceData, message?: string) => Promise<void>;
  notify: (message: string) => void;
  pending: boolean;
};
const WorkspaceContext = createContext<Context | null>(null);
function DataProvider({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const [message, setMessage] = useState('');
  const { data } = useQuery({
    queryKey: workspaceKey,
    queryFn: getWorkspace,
    initialData,
    staleTime: Infinity,
  });
  const mutation = useMutation({
    mutationFn: saveWorkspace,
    onSuccess: (updated) => client.setQueryData(workspaceKey, updated),
  });
  const notify = useCallback((text: string) => setMessage(text), []);
  async function save(
    updated: WorkspaceData,
    text = 'Changes saved in this demo session.',
  ) {
    await mutation.mutateAsync(updated);
    notify(text);
  }
  return (
    <WorkspaceContext.Provider
      value={{ data, save, notify, pending: mutation.isPending }}
    >
      {children}
      {message && (
        <output className="feedback" aria-live="polite">
          <CheckCircle2 size={17} />
          <span>{message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage('')}
          >
            <X size={15} />
          </button>
        </output>
      )}
    </WorkspaceContext.Provider>
  );
}
export default function WorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <DataProvider>{children}</DataProvider>
    </QueryClientProvider>
  );
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('WorkspaceProvider is required');
  return context;
}
