// API Client pour le backend Express.js local
const API_BASE_URL = 'http://localhost:3001/api';

// Récupérer le token JWT du localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Sauvegarder le token
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Supprimer le token
export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Vérifier si authentifié
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Interface pour les réponses d'erreur
interface ApiError {
  error: string;
  status?: number;
}

// Fonction fetch générique
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ApiError).error || 'Une erreur est survenue');
    }

    return data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend Express.js est lancé sur http://localhost:3001');
    }
    throw error;
  }
}

// ==================== AUTH ====================
export const authApi = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    fetchApi<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<{ id: string; email: string; role: string; profile: any }>('/auth/me'),

  logout: () => fetchApi<{ message: string }>('/auth/logout', { method: 'POST' }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchApi<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== PROFILES ====================
export const profilesApi = {
  getAll: () => fetchApi<any[]>('/profiles'),

  getMe: () => fetchApi<any>('/profiles/me'),

  getById: (id: string) => fetchApi<any>(`/profiles/${id}`),

  updateMe: (data: any) =>
    fetchApi<any>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  update: (userId: string, data: any) =>
    fetchApi<any>(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (userId: string) =>
    fetchApi<{ message: string }>(`/profiles/${userId}`, { method: 'DELETE' }),
};

// ==================== COACHES ====================
export const coachesApi = {
  getActive: () => fetchApi<any[]>('/coaches'),

  getAll: () => fetchApi<any[]>('/coaches/all'),

  getById: (id: string) => fetchApi<any>(`/coaches/${id}`),

  create: (data: any) =>
    fetchApi<any>('/coaches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/coaches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/coaches/${id}`, { method: 'DELETE' }),
};

// ==================== COURSES ====================
export const coursesApi = {
  getAll: () => fetchApi<any[]>('/courses'),

  getMy: () => fetchApi<any[]>('/courses/my'),

  getById: (id: string) => fetchApi<any>(`/courses/${id}`),

  create: (data: any) =>
    fetchApi<any>('/courses', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        category: data.category,
        durationMinutes: data.duration_minutes,
        maxParticipants: data.max_participants,
        difficultyLevel: data.difficulty_level,
        room: data.room,
        coachId: data.coach_id,
      }),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        category: data.category,
        durationMinutes: data.duration_minutes,
        maxParticipants: data.max_participants,
        difficultyLevel: data.difficulty_level,
        room: data.room,
        isActive: data.is_active,
        coachId: data.coach_id,
      }),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/courses/${id}`, { method: 'DELETE' }),
};

// ==================== SESSIONS ====================
export const sessionsApi = {
  getAll: (params?: { courseId?: string; date?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<any[]>(`/sessions${query ? `?${query}` : ''}`);
  },

  getUpcoming: () => fetchApi<any[]>('/sessions/upcoming'),

  getMy: () => fetchApi<any[]>('/sessions/my'),

  getById: (id: string) => fetchApi<any>(`/sessions/${id}`),

  create: (data: any) =>
    fetchApi<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        courseId: data.course_id,
        sessionDate: data.session_date,
        startTime: data.start_time,
        endTime: data.end_time,
        notes: data.notes,
        scheduleId: data.schedule_id,
      }),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        sessionDate: data.session_date,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status,
        notes: data.notes,
      }),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/sessions/${id}`, { method: 'DELETE' }),
};

// ==================== RESERVATIONS ====================
export const reservationsApi = {
  getAll: (params?: { sessionId?: string; userId?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<any[]>(`/reservations${query ? `?${query}` : ''}`);
  },

  getMy: () => fetchApi<any[]>('/reservations/my'),

  getBySession: (sessionId: string) => fetchApi<any[]>(`/reservations/session/${sessionId}`),

  create: (sessionId: string) =>
    fetchApi<any>('/reservations', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateAttendance: (id: string, attended: boolean) =>
    fetchApi<any>(`/reservations/${id}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ attended }),
    }),

  cancel: (id: string) =>
    fetchApi<any>(`/reservations/${id}`, { method: 'DELETE' }),
};

// ==================== SUBSCRIPTIONS ====================
export const subscriptionsApi = {
  getAll: (params?: { status?: string; userId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<any[]>(`/subscriptions${query ? `?${query}` : ''}`);
  },

  getMy: () => fetchApi<any[]>('/subscriptions/my'),

  getMyActive: () => fetchApi<any>('/subscriptions/my/active'),

  create: (data: { subscriptionTypeId: string; autoRenew?: boolean }) =>
    fetchApi<any>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    fetchApi<any>(`/subscriptions/${id}/cancel`, { method: 'PUT' }),
};

// ==================== SUBSCRIPTION TYPES ====================
export const subscriptionTypesApi = {
  getActive: () => fetchApi<any[]>('/subscription-types'),

  getAll: () => fetchApi<any[]>('/subscription-types/all'),

  getById: (id: string) => fetchApi<any>(`/subscription-types/${id}`),

  create: (data: any) =>
    fetchApi<any>('/subscription-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/subscription-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/subscription-types/${id}`, { method: 'DELETE' }),
};

// ==================== PAYMENTS ====================
export const paymentsApi = {
  getAll: (params?: { userId?: string; status?: string; limit?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<any[]>(`/payments${query ? `?${query}` : ''}`);
  },

  getStats: () => fetchApi<{ totalRevenue: number; totalPayments: number; monthlyRevenue: number; monthlyPayments: number }>('/payments/stats'),

  getMy: () => fetchApi<any[]>('/payments/my'),

  getById: (id: string) => fetchApi<any>(`/payments/${id}`),

  create: (data: any) =>
    fetchApi<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==================== EQUIPMENT ====================
export const equipmentApi = {
  getAll: (params?: { category?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<any[]>(`/equipment${query ? `?${query}` : ''}`);
  },

  getCategories: () => fetchApi<string[]>('/equipment/categories'),

  getById: (id: string) => fetchApi<any>(`/equipment/${id}`),

  create: (data: any) =>
    fetchApi<any>('/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/equipment/${id}`, { method: 'DELETE' }),
};

// ==================== USER ROLES ====================
export const userRolesApi = {
  getAll: () => fetchApi<any[]>('/user-roles'),

  getByUserId: (userId: string) => fetchApi<any>(`/user-roles/${userId}`),

  update: (userId: string, role: string) =>
    fetchApi<any>(`/user-roles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};

// ==================== SCHEDULES ====================
export const schedulesApi = {
  getAll: (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : '';
    return fetchApi<any[]>(`/schedules${query}`);
  },

  getById: (id: string) => fetchApi<any>(`/schedules/${id}`),

  create: (data: any) =>
    fetchApi<any>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/schedules/${id}`, { method: 'DELETE' }),
};

// ==================== CONTACT MESSAGES ====================
export const contactMessagesApi = {
  getAll: () => fetchApi<any[]>('/contact-messages'),

  getStats: () => fetchApi<{ total: number; unread: number; read_count: number }>('/contact-messages/stats'),

  create: (data: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    fetchApi<{ message: string; id: string }>('/contact-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAsRead: (id: string) =>
    fetchApi<{ message: string }>(`/contact-messages/${id}/read`, { method: 'PUT' }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/contact-messages/${id}`, { method: 'DELETE' }),
};

// ==================== EXPORT ====================
export const exportApi = {
  // Export réservations (Admin/Coach)
  getReservations: () => fetchApi<any[]>('/export/reservations'),

  // Export mes réservations (Member)
  getMyReservations: () => fetchApi<any[]>('/export/reservations/my'),

  // Export cours (Admin)
  getCourses: () => fetchApi<any[]>('/export/courses'),

  // Export abonnements (Admin)
  getSubscriptions: () => fetchApi<any[]>('/export/subscriptions'),

  // Export membres (Admin)
  getMembers: () => fetchApi<any[]>('/export/members'),

  // Export paiements (Admin)
  getPayments: () => fetchApi<any[]>('/export/payments'),

  // Export mes paiements (Member)
  getMyPayments: () => fetchApi<any[]>('/export/payments/my'),

  // Export mes sessions (Coach)
  getMySessions: () => fetchApi<any[]>('/export/sessions/my'),

  // Export présences d'une session (Coach)
  getAttendance: (sessionId: string) => fetchApi<any[]>(`/export/attendance/${sessionId}`),
};

