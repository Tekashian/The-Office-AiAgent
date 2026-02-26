# 🎯 Przygotowanie do Rozmowy Rekrutacyjnej - Senior TypeScript/React Engineer

## 📋 Struktura Rozmowy
- **30 min**: Pytania techniczne (koncepty, best practices, architecture)
- **30 min**: Code Review (analiza kodu, refactoring, optimization)

---

# CZĘŚĆ 1: PYTANIA TECHNICZNE (30 MIN)

## 🔷 TypeScript Advanced Concepts

### 1. **Co to są Type Guards i kiedy ich używać?**

**Odpowiedź z przykładem z projektu:**
```typescript
// Type Guard do sprawdzania typu odpowiedzi API
function isErrorResponse(response: unknown): response is { error: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as any).error === 'string'
  );
}

// Użycie w try-catch
try {
  const response = await fetch('/api/agent/execute');
  const data = await response.json();
  
  if (isErrorResponse(data)) {
    // TypeScript wie, że data ma property 'error'
    throw new Error(data.error);
  }
  // data jest tu innego typu
} catch (error) {
  console.error(error);
}
```

**Inne typy guards:**
```typescript
// Discriminated Unions
type Task = 
  | { type: 'email'; recipient: string; subject: string }
  | { type: 'scrape'; url: string }
  | { type: 'pdf'; template: string };

function handleTask(task: Task) {
  switch (task.type) {
    case 'email':
      // TypeScript wie że task ma recipient i subject
      return sendEmail(task.recipient, task.subject);
    case 'scrape':
      return scrapeUrl(task.url);
    case 'pdf':
      return generatePdf(task.template);
  }
}

// Custom Type Guards dla obiektów Supabase
function isSupabaseError(
  error: unknown
): error is { message: string; code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}
```

### 2. **Wyjaśnij różnicę między `unknown` a `any`. Kiedy używasz którego?**

**Odpowiedź:**
```typescript
// ❌ ZŁE: any - wyłącza type checking
function badExample(input: any) {
  input.toUpperCase(); // Kompiluje się, ale może crashować w runtime
  input.nonExistentMethod(); // Również "ok" dla TypeScript
}

// ✅ DOBRE: unknown - wymusza type checking
function goodExample(input: unknown) {
  // input.toUpperCase(); // ❌ Błąd kompilacji
  
  // Musimy sprawdzić typ przed użyciem
  if (typeof input === 'string') {
    return input.toUpperCase(); // ✅ Bezpieczne
  }
  throw new Error('Expected string');
}

// Praktyczny przykład z error handling
async function safeApiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) { // unknown zamiast any
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      throw error;
    }
    if (isSupabaseError(error)) {
      console.error('Supabase error:', error.code);
      throw new Error(error.message);
    }
    // Fallback dla nieznanych błędów
    throw new Error('Unknown error occurred');
  }
}
```

**Kiedy używać:**
- **`unknown`**: zawsze gdy typ jest naprawdę nieznany (API responses, errors, user input)
- **`any`**: prawie nigdy, tylko w migrations lub przy integracji ze starym JS kodem

### 3. **Co to są Generics i jak poprawnie je stosować?**

**Odpowiedź z przykładami:**
```typescript
// 1. Generic Function - reusable API wrapper
async function fetchData<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as T;
}

// Użycie z typowaniem
interface User {
  id: string;
  email: string;
  name: string;
}

const user = await fetchData<User>('/api/users/123');
// user jest typu User, mamy autocomplete

// 2. Generic Component w React
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map((item) => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Użycie
<List
  items={tasks}
  renderItem={(task) => <TaskCard task={task} />}
  keyExtractor={(task) => task.id}
/>

// 3. Generic with Constraints
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// 4. Advanced - Conditional Types z Generics
type ApiResponse<T> = {
  data: T;
  error: null;
  status: 'success';
} | {
  data: null;
  error: string;
  status: 'error';
};

async function apiCall<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const data = await fetchData<T>(endpoint);
    return { data, error: null, status: 'success' };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    };
  }
}
```

### 4. **Utility Types - które znasz i jak je stosujesz?**

**Odpowiedź:**
```typescript
// 1. Partial<T> - wszystkie properties opcjonalne
interface TaskForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
}

// Podczas edycji możemy zaktualizować tylko niektóre pola
function updateTask(id: string, updates: Partial<TaskForm>) {
  // updates może mieć tylko title, albo tylko priority, etc.
}

// 2. Pick<T, K> - wybierz tylko określone properties
type TaskPreview = Pick<TaskForm, 'title' | 'priority'>;
// { title: string; priority: 'low' | 'medium' | 'high' }

// 3. Omit<T, K> - usuń określone properties
type TaskWithoutDates = Omit<TaskForm, 'dueDate'>;
// Wszystko oprócz dueDate

// 4. Required<T> - wszystkie properties wymagane
type CompleteTask = Required<Partial<TaskForm>>;

// 5. Record<K, V> - obiekt z określonymi kluczami i wartościami
type TaskStatus = 'pending' | 'in-progress' | 'completed';
type TaskCounts = Record<TaskStatus, number>;
// { pending: number; 'in-progress': number; completed: number }

// 6. Readonly<T> - immutable properties
interface Config {
  apiUrl: string;
  timeout: number;
}
type ImmutableConfig = Readonly<Config>;

// 7. ReturnType<T> - typ zwracany przez funkcję
async function getUser() {
  return {
    id: '1',
    name: 'John',
    email: 'john@example.com'
  };
}
type User = Awaited<ReturnType<typeof getUser>>;
// User = { id: string; name: string; email: string }

// 8. Parameters<T> - typy parametrów funkcji
function sendEmail(to: string, subject: string, body: string) {}
type EmailParams = Parameters<typeof sendEmail>;
// [string, string, string]

// 9. Praktyczny przykład - Form Values
interface EmailFormValues {
  recipient: string;
  subject: string;
  body: string;
  attachments?: File[];
}

// Tylko do odczytu w preview
type EmailPreview = Readonly<EmailFormValues>;

// Tylko wymagane pola do walidacji
type EmailValidation = Required<Pick<EmailFormValues, 'recipient' | 'subject'>>;

// Dane do wysłania (bez plików, tylko nazwy)
type EmailPayload = Omit<EmailFormValues, 'attachments'> & {
  attachmentUrls?: string[];
};
```

### 5. **Mapped Types i Template Literal Types**

**Odpowiedź:**
```typescript
// 1. Mapped Types - transformacja typów
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

interface User {
  name: string;
  age: number;
}

type NullableUser = Nullable<User>;
// { name: string | null; age: number | null }

// 2. Template Literal Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Endpoint = 'users' | 'tasks' | 'emails';
type ApiRoute = `/${Endpoint}`;
// "/users" | "/tasks" | "/emails"

type ApiEndpoint = `${HttpMethod} ${ApiRoute}`;
// "GET /users" | "POST /users" | ... itd.

// 3. Praktyczny przykład - Event Handlers
type EventName = 'click' | 'focus' | 'blur' | 'submit';
type EventHandler<T extends EventName> = `on${Capitalize<T>}`;
// "onClick" | "onFocus" | "onBlur" | "onSubmit"

// 4. Advanced - API Route typing z projektu
type AgentAction = 'execute' | 'status' | 'cancel';
type AgentRoute = `/api/agent/${AgentAction}`;

type EmailAction = 'send' | 'template' | 'history';
type EmailRoute = `/api/email/${EmailAction}`;

type ApiRoutes = AgentRoute | EmailRoute;
// "/api/agent/execute" | "/api/agent/status" | ...

// 5. Conditional Mapped Types
type SetOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

type TaskCreate = SetOptional<Task, 'id' | 'completed'>;
// id i completed są opcjonalne, reszta wymagana
```

---

## ⚛️ React Advanced Patterns

### 6. **Wytłumacz różnicę między useMemo, useCallback, i memo. Kiedy używasz którego?**

**Odpowiedź:**
```typescript
// 1. useMemo - memoizuje WARTOŚĆ (wynik obliczenia)
function TaskList({ tasks }: { tasks: Task[] }) {
  // Expensive calculation
  const statistics = useMemo(() => {
    console.log('Calculating statistics...');
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      avgCompletionTime: calculateAvgTime(tasks)
    };
  }, [tasks]); // Przelicz tylko gdy tasks się zmieni

  return <StatisticsPanel stats={statistics} />;
}

// 2. useCallback - memoizuje FUNKCJĘ
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  // ❌ Bez useCallback - nowa funkcja przy każdym render
  const badHandler = (id: string) => {
    console.log('Clicked', id);
  };

  // ✅ Z useCallback - ta sama funkcja póki dependencies się nie zmienią
  const goodHandler = useCallback((id: string) => {
    console.log('Clicked', id);
    // Jeśli potrzebujemy count, dodajemy go do deps
  }, []); // Pusta deps - funkcja nigdy się nie zmieni

  // Praktyczny przykład - delete handler
  const handleDelete = useCallback(async (taskId: string) => {
    setItems(prev => prev.filter(item => item.id !== taskId));
    await api.deleteTask(taskId);
  }, []); // Nie ma zewnętrznych deps

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      {items.map(item => (
        <MemoizedItem 
          key={item.id} 
          item={item} 
          onDelete={goodHandler} // Nie powoduje re-render
        />
      ))}
    </>
  );
}

// 3. React.memo - memoizuje KOMPONENT (shallow comparison props)
const MemoizedItem = memo(function Item({ 
  item, 
  onDelete 
}: { 
  item: Item; 
  onDelete: (id: string) => void;
}) {
  console.log('Rendering Item', item.id);
  return (
    <div>
      <h3>{item.title}</h3>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  );
});

// 4. Custom comparison dla memo
const ComplexItem = memo(
  ({ item, metadata }: { item: Item; metadata: Metadata }) => {
    return <div>{item.title} - {metadata.timestamp}</div>;
  },
  (prevProps, nextProps) => {
    // Return true jeśli props są RÓWNE (skip render)
    // Return false jeśli props się RÓŻNIĄ (do render)
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.title === nextProps.item.title &&
      prevProps.metadata.timestamp === nextProps.metadata.timestamp
    );
  }
);

// 5. Praktyczny przykład z projektu - EmailComposer
function EmailComposer() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // useMemo dla expensive validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!recipient.includes('@')) errors.push('Invalid email');
    if (subject.length < 3) errors.push('Subject too short');
    if (body.length < 10) errors.push('Body too short');
    return errors;
  }, [recipient, subject, body]);

  // useCallback dla handlers przekazywanych do child components
  const handleSend = useCallback(async () => {
    if (validationErrors.length > 0) return;
    await sendEmail({ recipient, subject, body });
  }, [recipient, subject, body, validationErrors]);

  return (
    <div>
      <input value={recipient} onChange={e => setRecipient(e.target.value)} />
      <input value={subject} onChange={e => setSubject(e.target.value)} />
      <textarea value={body} onChange={e => setBody(e.target.value)} />
      <ErrorList errors={validationErrors} /> {/* memo'd component */}
      <SendButton onClick={handleSend} /> {/* memo'd component */}
    </div>
  );
}
```

**Kiedy używać:**
- **useMemo**: expensive calculations, filtering/mapping dużych list, complex objects jako deps
- **useCallback**: funkcje przekazywane do memo'd components, dependency dla useEffect
- **memo**: komponenty które często re-renderują się bez zmian w props, listy itemów

### 7. **Custom Hooks - jak projektować reusable i testowalne hooks?**

**Odpowiedź z przykładami:**
```typescript
// 1. Basic Custom Hook - API Fetching
interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useApi<T>(
  endpoint: string, 
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | undefined>(options.initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  return { data, loading, error, execute };
}

// Użycie
function TasksList() {
  const { data: tasks, loading, error, execute } = useApi<Task[]>('/api/tasks', {
    onSuccess: (tasks) => console.log('Loaded', tasks.length, 'tasks')
  });

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <TaskList tasks={tasks ?? []} />;
}

// 2. Advanced Hook - Debounced Search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Użycie w search
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // API call tylko po 500ms bez zmian
      searchApi(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input 
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}

// 3. Complex Hook - Form Management
interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T) => {
    return (value: T[keyof T]) => {
      setValues(prev => ({ ...prev, [field]: value }));
      // Clear error on change
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      if (validate) {
        const validationErrors = validate(values);
        setErrors(prev => ({ ...prev, [field]: validationErrors[field] }));
      }
    };
  }, [values, validate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);

    // Validate
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
    }

    // Submit
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    submitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset
  };
}

// Użycie
interface EmailFormValues {
  recipient: string;
  subject: string;
  body: string;
}

function EmailForm() {
  const form = useForm<EmailFormValues>({
    initialValues: {
      recipient: '',
      subject: '',
      body: ''
    },
    validate: (values) => {
      const errors: Partial<Record<keyof EmailFormValues, string>> = {};
      if (!values.recipient.includes('@')) {
        errors.recipient = 'Invalid email';
      }
      if (values.subject.length < 3) {
        errors.subject = 'Subject too short';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await sendEmail(values);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        value={form.values.recipient}
        onChange={(e) => form.handleChange('recipient')(e.target.value)}
        onBlur={form.handleBlur('recipient')}
      />
      {form.touched.recipient && form.errors.recipient && (
        <span className="error">{form.errors.recipient}</span>
      )}
      
      {/* ... other fields ... */}
      
      <button type="submit" disabled={form.submitting}>
        {form.submitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

// 4. Hook z Cleanup - WebSocket Connection
function useWebSocket(url: string) {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]);
    };

    // Cleanup przy unmount
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [url]);

  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  return { messages, connected, send };
}
```

### 8. **Context API vs State Management Libraries - kiedy używasz którego?**

**Odpowiedź:**
```typescript
// 1. Context API - dla prostych, rzadko zmieniających się danych
// ✅ Dobre dla: theme, auth, user preferences
// ❌ Złe dla: frequently updating data, complex state

// Auth Context z projektu
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount
    checkSession();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    setUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook dla łatwego dostępu
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// 2. Problem z Context - re-renders
// ❌ Każda zmiana w value powoduje re-render WSZYSTKICH konsumentów
function BadExample() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  // Nowy obiekt przy każdym render = re-render wszystkich konsumentów
  const value = { count, user, setCount, setUser };

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

// ✅ Rozwiązanie 1: useMemo
const value = useMemo(
  () => ({ count, user, setCount, setUser }),
  [count, user]
);

// ✅ Rozwiązanie 2: Split contexts
const CountContext = createContext<number>(0);
const UserContext = createContext<User | null>(null);

// ✅ Rozwiązanie 3: Use Zustand dla complex state
// npm install zustand
import create from 'zustand';

interface StoreState {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  fetchTasks: () => Promise<void>;
}

const useStore = create<StoreState>((set, get) => ({
  tasks: [],
  loading: false,
  
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),
  
  removeTask: (id) => set((state) => ({ 
    tasks: state.tasks.filter(t => t.id !== id) 
  })),
  
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/tasks');
      const tasks = await response.json();
      set({ tasks, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  }
}));

// Użycie - komponent renderuje się tylko gdy używane dane się zmienią
function TaskList() {
  // Tylko tasks - nie renderuje gdy loading się zmieni
  const tasks = useStore((state) => state.tasks);
  const removeTask = useStore((state) => state.removeTask);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard 
          key={task.id} 
          task={task}
          onDelete={() => removeTask(task.id)}
        />
      ))}
    </div>
  );
}

function LoadingIndicator() {
  // Tylko loading - nie renderuje gdy tasks się zmienią
  const loading = useStore((state) => state.loading);
  return loading ? <Spinner /> : null;
}
```

**Kiedy używać:**
- **Context API**: Auth, Theme, I18n, rzadkie updates
- **Zustand**: Frequent updates, complex state, better performance
- **Redux**: Large apps, time-travel debugging, middleware heavy
- **React Query / SWR**: Server state, caching, synchronization

### 9. **Error Boundaries i Error Handling w React**

**Odpowiedź:**
```typescript
// 1. Error Boundary Class Component (jedyny sposób obecnie)
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to service (Sentry, LogRocket, etc.)
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 2. Użycie Error Boundary
function App() {
  return (
    <ErrorBoundary 
      fallback={<ErrorPage />}
      onError={(error) => logToSentry(error)}
    >
      <Router>
        <Routes>
          <Route path="/agent" element={
            <ErrorBoundary fallback={<AgentErrorFallback />}>
              <AgentPage />
            </ErrorBoundary>
          } />
          <Route path="/email" element={
            <ErrorBoundary fallback={<EmailErrorFallback />}>
              <EmailPage />
            </ErrorBoundary>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

// 3. Hook dla Async Error Handling (Error Boundaries nie łapią async errors)
function useAsyncError() {
  const [, setError] = useState();
  
  return useCallback((error: Error) => {
    setError(() => {
      throw error; // To spowoduje że Error Boundary złapie
    });
  }, []);
}

function ComponentWithAsyncOperation() {
  const throwAsyncError = useAsyncError();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    } catch (error) {
      // Przekaż error do Error Boundary
      throwAsyncError(error as Error);
    }
  };

  return <button onClick={fetchData}>Fetch</button>;
}

// 4. Praktyczny Error Handling Pattern
interface ApiError {
  message: string;
  code: string;
  status: number;
}

function useApiWithErrorHandling<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const throwAsyncError = useAsyncError();

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json();
        const apiError: ApiError = {
          message: errorData.message || 'Something went wrong',
          code: errorData.code || 'UNKNOWN_ERROR',
          status: response.status
        };
        setError(apiError);
        
        // Dla critical errors (500, 503) - throw do Error Boundary
        if (response.status >= 500) {
          throwAsyncError(new Error(apiError.message));
        }
        return;
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      // Network error - critical
      const error = err instanceof Error ? err : new Error('Network error');
      throwAsyncError(error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, throwAsyncError]);

  return { data, error, loading, execute };
}

// Użycie
function TasksList() {
  const { data: tasks, error, loading, execute } = useApiWithErrorHandling<Task[]>('/api/tasks');

  useEffect(() => {
    execute();
  }, [execute]);

  // Graceful error handling (400-499)
  if (error) {
    return (
      <div className="error">
        <p>{error.message}</p>
        {error.status === 401 && <button onClick={() => router.push('/login')}>Login</button>}
        {error.status === 403 && <p>You don't have permission</p>}
        {error.status === 404 && <p>Tasks not found</p>}
      </div>
    );
  }

  // Critical errors (500+) są obsługiwane przez Error Boundary
  if (loading) return <Spinner />;
  return <TaskList tasks={tasks ?? []} />;
}
```

---

## 🏗️ Architecture & Performance

### 10. **Code Splitting i Lazy Loading - jak optymalizujesz bundle size?**

**Odpowiedź:**
```typescript
// 1. Route-based Code Splitting
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ❌ Bez lazy loading - wszystko w jednym bundle
// import AgentPage from './pages/AgentPage';
// import EmailPage from './pages/EmailPage';
// import ScraperPage from './pages/ScraperPage';

// ✅ Z lazy loading - osobne chunks
const AgentPage = lazy(() => import('./pages/AgentPage'));
const EmailPage = lazy(() => import('./pages/EmailPage'));
const ScraperPage = lazy(() => import('./pages/ScraperPage'));
const PDFPage = lazy(() => import('./pages/PDFPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoadingSpinner />}>
        <Routes>
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/scraper" element={<ScraperPage />} />
          <Route path="/pdf" element={<PDFPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// 2. Component-based Lazy Loading (heavy components)
const ChartComponent = lazy(() => import('./components/Chart'));
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <ChartComponent data={data} />
        </Suspense>
      )}
    </div>
  );
}

// 3. Named Exports Lazy Loading
const { TaskModal } = lazy(() => 
  import('./components/TaskModal').then(module => ({
    default: { TaskModal: module.TaskModal }
  }))
);

// 4. Prefetching dla lepszego UX
function Navigation() {
  const handleMouseEnter = (route: string) => {
    // Prefetch component na hover
    if (route === '/email') {
      import('./pages/EmailPage');
    }
  };

  return (
    <nav>
      <Link 
        to="/email" 
        onMouseEnter={() => handleMouseEnter('/email')}
      >
        Email
      </Link>
    </nav>
  );
}

// 5. Dynamic Imports dla features
async function loadFeature(featureName: string) {
  switch (featureName) {
    case 'analytics':
      return import('./features/analytics');
    case 'reporting':
      return import('./features/reporting');
    default:
      throw new Error('Unknown feature');
  }
}

// 6. Webpack Magic Comments (Next.js)
const HeavyComponent = lazy(() => 
  import(
    /* webpackChunkName: "heavy-component" */
    /* webpackPrefetch: true */
    './components/HeavyComponent'
  )
);

// 7. Tree Shaking - eliminacja nieużywanego kodu
// ❌ Importuje cały lodash (~70kb)
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Importuje tylko debounce (~2kb)
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// ✅ Jeszcze lepiej - lodash-es z tree shaking
import { debounce } from 'lodash-es';

// 8. Analizowanie bundle size
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}

// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // config
});
```

**Best Practices:**
- Route-based splitting dla każdej strony
- Lazy load heavy libraries (charts, editors)
- Use dynamic imports dla conditional features
- Prefetch critical routes
- Analyze bundle z @next/bundle-analyzer
- Tree-shakeable imports (lodash-es, date-fns)

### 11. **Virtual Scrolling i Windowing - jak obsługujesz duże listy?**

**Odpowiedź:**
```typescript
// 1. react-window - podstawowa implementacja
import { FixedSizeList } from 'react-window';

interface Task {
  id: string;
  title: string;
  description: string;
}

function VirtualTaskList({ tasks }: { tasks: Task[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = tasks[index];
    return (
      <div style={style} className="task-row">
        <h3>{task.title}</h3>
        <p>{task.description}</p>
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={tasks.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 2. Variable Size List (różne wysokości)
import { VariableSizeList } from 'react-window';

function VariableTaskList({ tasks }: { tasks: Task[] }) {
  const listRef = useRef<VariableSizeList>(null);
  const rowHeights = useRef<{ [key: number]: number }>({});

  const getItemSize = (index: number) => {
    return rowHeights.current[index] || 80; // Default height
  };

  const setRowHeight = useCallback((index: number, size: number) => {
    if (rowHeights.current[index] !== size) {
      rowHeights.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  }, []);

  const Row = ({ index, style }: any) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const task = tasks[index];

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [index]);

    return (
      <div ref={rowRef} style={style}>
        <TaskCard task={task} />
      </div>
    );
  };

  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      itemCount={tasks.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}

// 3. Infinite Loading z Intersection Observer
function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean
) {
  const observer = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback();
      }
    });

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => observer.current?.disconnect();
  }, [callback, hasMore]);

  return loadingRef;
}

function InfiniteTaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    const newTasks = await fetchTasks(page);
    
    if (newTasks.length === 0) {
      setHasMore(false);
    } else {
      setTasks(prev => [...prev, ...newTasks]);
      setPage(prev => prev + 1);
    }
    setLoading(false);
  }, [page, loading]);

  const loadingRef = useInfiniteScroll(loadMore, hasMore);

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
      {hasMore && (
        <div ref={loadingRef} className="loading-indicator">
          {loading && <Spinner />}
        </div>
      )}
    </div>
  );
}

// 4. Praktyczny przykład - Email Inbox z virtual scrolling
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: Date;
  read: boolean;
}

function EmailInbox({ emails }: { emails: Email[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const EmailRow = ({ index, style }: any) => {
    const email = emails[index];
    const isSelected = email.id === selectedId;

    return (
      <div
        style={style}
        className={`email-row ${isSelected ? 'selected' : ''} ${email.read ? 'read' : 'unread'}`}
        onClick={() => setSelectedId(email.id)}
      >
        <div className="email-from">{email.from}</div>
        <div className="email-subject">{email.subject}</div>
        <div className="email-preview">{email.preview}</div>
        <div className="email-date">{formatDate(email.date)}</div>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={emails.length}
            itemSize={80}
            width={width}
          >
            {EmailRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}
```

---

# CZĘŚĆ 2: CODE REVIEW (30 MIN)

## 🔍 Common Issues to Look For

### 1. **Performance Issues**

```typescript
// ❌ Problem 1: Unnecessary re-renders
function BadComponent({ data }: { data: Data[] }) {
  const processedData = data.map(item => ({ // Nowy array przy każdym render
    ...item,
    processed: true
  }));

  return <List data={processedData} />;
}

// ✅ Solution: useMemo
function GoodComponent({ data }: { data: Data[] }) {
  const processedData = useMemo(() => 
    data.map(item => ({
      ...item,
      processed: true
    })),
    [data]
  );

  return <List data={processedData} />;
}

// ❌ Problem 2: Inline functions w props
function BadParent() {
  return (
    <div>
      {items.map(item => (
        <Item 
          key={item.id}
          onClick={() => handleClick(item.id)} // Nowa funkcja przy każdym render
        />
      ))}
    </div>
  );
}

// ✅ Solution: useCallback lub separate handler
function GoodParent() {
  const handleClick = useCallback((id: string) => {
    // handle click
  }, []);

  return (
    <div>
      {items.map(item => (
        <Item 
          key={item.id}
          onClick={() => handleClick(item.id)}
        />
      ))}
    </div>
  );
}

// ❌ Problem 3: Heavy computations w render
function BadComponent({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter(t => t.completed).length; // Compute przy każdym render
  const pending = tasks.filter(t => !t.completed).length;
  const avgTime = tasks.reduce((acc, t) => acc + t.time, 0) / tasks.length;

  return <Stats completed={completed} pending={pending} avgTime={avgTime} />;
}

// ✅ Solution: useMemo
function GoodComponent({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => ({
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    avgTime: tasks.reduce((acc, t) => acc + t.time, 0) / tasks.length
  }), [tasks]);

  return <Stats {...stats} />;
}
```

### 2. **Type Safety Issues**

```typescript
// ❌ Problem 1: any types
function badFetch(url: string): any { // ❌
  return fetch(url).then(r => r.json());
}

// ✅ Solution: Generic types
async function goodFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// ❌ Problem 2: Type assertions bez validation
function processData(data: unknown) {
  const user = data as User; // ❌ Unsafe
  return user.name.toUpperCase();
}

// ✅ Solution: Type guards
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    typeof (data as any).name === 'string'
  );
}

function processData(data: unknown) {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }
  return data.name.toUpperCase(); // ✅ Safe
}

// ❌ Problem 3: Missing null checks
function displayUser(user: User | null) {
  return <div>{user.name}</div>; // ❌ Może crashować
}

// ✅ Solution: Proper null handling
function displayUser(user: User | null) {
  if (!user) return <div>No user</div>;
  return <div>{user.name}</div>;
}

// Lub Optional Chaining
function displayUser(user: User | null) {
  return <div>{user?.name ?? 'Anonymous'}</div>;
}
```

### 3. **Memory Leaks**

```typescript
// ❌ Problem 1: Missing cleanup w useEffect
function BadComponent() {
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('tick');
    }, 1000);
    // ❌ Brak cleanup - interval działa po unmount
  }, []);
}

// ✅ Solution: Return cleanup function
function GoodComponent() {
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('tick');
    }, 1000);
    
    return () => clearInterval(interval); // ✅ Cleanup
  }, []);
}

// ❌ Problem 2: Event listeners bez cleanup
function BadComponent() {
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    // ❌ Brak removeEventListener
  }, []);
}

// ✅ Solution
function GoodComponent() {
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
}

// ❌ Problem 3: setState po unmount
function BadComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(result => {
      setData(result); // ❌ Może być wywołane po unmount
    });
  }, []);
}

// ✅ Solution: Cleanup flag
function GoodComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchData().then(result => {
      if (!cancelled) {
        setData(result); // ✅ Sprawdza czy component jest mounted
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);
}
```

### 4. **Security Issues**

```typescript
// ❌ Problem 1: XSS via dangerouslySetInnerHTML
function BadComponent({ htmlContent }: { htmlContent: string }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />; // ❌
}

// ✅ Solution: Sanitize HTML
import DOMPurify from 'dompurify';

function GoodComponent({ htmlContent }: { htmlContent: string }) {
  const sanitized = useMemo(
    () => DOMPurify.sanitize(htmlContent),
    [htmlContent]
  );
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// ❌ Problem 2: Sensitive data w localStorage
function badSaveToken(token: string) {
  localStorage.setItem('authToken', token); // ❌ Vulnerable to XSS
}

// ✅ Solution: HttpOnly cookies (backend sets)
// Lub better: Session-based auth z Supabase

// ❌ Problem 3: Missing input validation
function BadForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }) // ❌ Brak walidacji
    });
  };
}

// ✅ Solution: Validate input
function GoodForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = () => {
    if (!validateEmail(email)) {
      setError('Invalid email');
      return;
    }
    
    fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };
}
```

### 5. **Accessibility Issues**

```typescript
// ❌ Problem 1: Missing semantic HTML
function BadButton({ onClick }: { onClick: () => void }) {
  return <div onClick={onClick}>Click me</div>; // ❌
}

// ✅ Solution: Use proper elements
function GoodButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click me</button>; // ✅
}

// ❌ Problem 2: Missing ARIA labels
function BadModal({ isOpen, children }: any) {
  return isOpen ? <div>{children}</div> : null; // ❌
}

// ✅ Solution: Proper ARIA
function GoodModal({ isOpen, children, onClose }: any) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        onClick={onClose}
        aria-label="Close modal"
      >
        ×
      </button>
      {children}
    </div>
  );
}

// ❌ Problem 3: Missing keyboard navigation
function BadDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div onClick={() => setOpen(!open)}>Menu</div> {/* ❌ */}
      {open && <div>Content</div>}
    </div>
  );
}

// ✅ Solution: Keyboard support
function GoodDropdown() {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        setOpen(!open);
        break;
      case 'Escape':
        setOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Menu
      </button>
      {open && (
        <ul role="menu">
          {items.map((item, index) => (
            <li
              key={item.id}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 📝 Code Review Checklist

### React/TypeScript Specifics:
- [ ] Proper TypeScript types (no `any` without reason)
- [ ] Type guards dla runtime validation
- [ ] useMemo dla expensive computations
- [ ] useCallback dla funkcji w deps
- [ ] Proper dependency arrays w useEffect
- [ ] Cleanup functions w useEffect
- [ ] Key props w listach (stable, unique)
- [ ] Proper error handling (Error Boundaries)
- [ ] Loading states dla async operations
- [ ] Accessibility (ARIA, semantic HTML, keyboard navigation)

### Performance:
- [ ] Code splitting (lazy loading)
- [ ] Memoization gdzie potrzebne
- [ ] Virtual scrolling dla długich list
- [ ] Image optimization (next/image)
- [ ] Bundle size analysis
- [ ] Avoiding unnecessary re-renders

### Security:
- [ ] Input validation
- [ ] XSS prevention (sanitize HTML)
- [ ] CSRF protection
- [ ] Secure token storage
- [ ] API authentication

### Best Practices:
- [ ] Component composition over inheritance
- [ ] Single Responsibility Principle
- [ ] DRY (Don't Repeat Yourself)
- [ ] Proper naming conventions
- [ ] Comments dla complex logic
- [ ] Error messages user-friendly

---

## 🎤 SMART Answers Framework

### S - Situation
"W projekcie X mieliśmy problem z..."

### M - Mistake/Issue
"Problem polegał na tym, że..."

### A - Action
"Podjąłem następujące kroki..."

### R - Result
"Efektem było..."

### T - Takeaway
"Nauczyłem się, że..."

---

## 💡 Quick Tips

1. **Zawsze pytaj o kontekst** - "Czy mogę zadać kilka pytań o use case?"
2. **Think aloud** - mów co myślisz podczas code review
3. **Proponuj tradeoffs** - "To zależy od X... jeśli A to B, jeśli C to D"
4. **Używaj przykładów z doświadczenia** - "W poprzednim projekcie..."
5. **Be humble** - "Nie jestem pewien, ale myślę że..."

---

## 🚀 Przykładowe Pytania Rekrutacyjne

### TypeScript:
1. Co to jest type inference i jak TypeScript go używa?
2. Wyjaśnij różnicę między interface a type
3. Co to są conditional types?
4. Jak działają decorators w TypeScript?
5. Co to jest type narrowing?

### React:
1. Wyjaśnij Virtual DOM i reconciliation
2. Kiedy używasz useLayoutEffect zamiast useEffect?
3. Co to jest React Server Components?
4. Jak działa Concurrent Rendering?
5. Co to jest Suspense i jak go używać?

### Architecture:
1. Jak strukturujesz duży projekt React?
2. Jak testujesz React components?
3. Jak optymalizujesz performance?
4. Jak handlujesz state management w dużej aplikacji?
5. Jak implementujesz authentication/authorization?

Powodzenia na rozmowie! 🎯
