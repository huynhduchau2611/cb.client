import { config } from '../config';

const API_BASE_URL = config.api.baseUrl;
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const toAbsoluteFileUrl = (url?: string): string | undefined => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

const normalizeApplication = (application: Application): Application => ({
  ...application,
  cvUrl: toAbsoluteFileUrl(application.cvUrl),
});

export interface ApplicationFormData {
  phone: string;
  skills: string;
  experience: string;
  availability: string;
  additionalInfo?: string;
}

export interface Application {
  _id: string;
  type: 'cv' | 'form';
  cvUrl?: string;
  status: 'applied' | 'reviewing' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected' | 'withdrawn';
  formData?: ApplicationFormData;
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  post: {
    _id: string;
    title: string;
    description?: string;
    salary?: number;
    typeWork?: string;
    company?: {
      _id: string;
      name: string;
      avatarUrl?: string;
      province?: string;
      district?: string;
    };
    techStack?: string[];
    status?: string;
    createdAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationResponse {
  success: boolean;
  data: {
    application: Application;
    message: string;
  };
}

export interface ApplicationsResponse {
  success: boolean;
  data: {
    applications: Application[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    message: string;
  };
}

export interface ApplicationStatsResponse {
  success: boolean;
  data: {
    stats: {
      total: number;
      applied: number;
      reviewing: number;
      shortlisted: number;
      interviewed: number;
      hired: number;
      rejected: number;
      withdrawn: number;
    };
    message: string;
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const applicationsApi = {
  /**
   * Create a new application
   */
  async createApplication(
    postId: string,
    type: 'cv' | 'form',
    cvFile?: File,
    formData?: ApplicationFormData
  ): Promise<Application> {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('postId', postId);
      formDataToSend.append('type', type);

      if (type === 'cv' && cvFile) {
        formDataToSend.append('cvFile', cvFile);
      } else if (type === 'form' && formData) {
        formDataToSend.append('phone', formData.phone);
        formDataToSend.append('skills', formData.skills);
        formDataToSend.append('experience', formData.experience);
        formDataToSend.append('availability', formData.availability);
        if (formData.additionalInfo) {
          formDataToSend.append('additionalInfo', formData.additionalInfo);
        }
      }

      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to create application: ${response.statusText}`);
      }

      const result: ApplicationResponse = await response.json();
      return normalizeApplication(result.data.application);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create application');
    }
  },

  /**
   * Get my applications (Candidate)
   */
  async getMyApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ applications: Application[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${API_BASE_URL}/applications/my-applications?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch applications: ${response.statusText}`);
      }

      const result: ApplicationsResponse | { applications?: Application[]; pagination?: any } = await response.json();
      const payload = 'data' in result && result.data ? result.data : result;
      const applications = (payload.applications ?? []).map(normalizeApplication);
      return {
        applications,
        pagination: payload.pagination ?? { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: params?.limit ?? 20 },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch applications');
    }
  },

  /**
   * Get applications for a job (Employer)
   */
  async getJobApplications(
    postId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<{ applications: Application[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${API_BASE_URL}/applications/job/${postId}?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch applications: ${response.statusText}`);
      }

      const result: ApplicationsResponse | { applications?: Application[]; pagination?: any } = await response.json();
      const payload = 'data' in result && result.data ? result.data : result;
      const applications = (payload.applications ?? []).map(normalizeApplication);
      return {
        applications,
        pagination: payload.pagination ?? { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: params?.limit ?? 20 },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch applications');
    }
  },

  /**
   * Get all applications for employer's jobs
   */
  async getMyJobApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
    postId?: string;
  }): Promise<{ applications: Application[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.postId) queryParams.append('postId', params.postId);

      const response = await fetch(`${API_BASE_URL}/applications/my-jobs?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch applications: ${response.statusText}`);
      }

      const result: ApplicationsResponse | { applications?: Application[]; pagination?: any } = await response.json();
      const payload = 'data' in result && result.data ? result.data : result;
      const applications = (payload.applications ?? []).map(normalizeApplication);
      return {
        applications,
        pagination: payload.pagination ?? { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: params?.limit ?? 20 },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch applications');
    }
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    status: Application['status'],
    note?: string
  ): Promise<Application> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, note }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to update application status: ${response.statusText}`);
      }

      const result: ApplicationResponse = await response.json();
      return normalizeApplication(result.data.application);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update application status');
    }
  },

  /**
   * Get application statistics
   */
  async getApplicationStats(): Promise<ApplicationStatsResponse['data']['stats']> {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch statistics: ${response.statusText}`);
      }

      const result: ApplicationStatsResponse = await response.json();
      return result.data.stats;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch statistics');
    }
  },

  /**
   * Get all applications (Admin)
   */
  async getAllApplications(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    postId?: string;
    userId?: string;
  }): Promise<{ applications: Application[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.postId) queryParams.append('postId', params.postId);
      if (params?.userId) queryParams.append('userId', params.userId);

      const response = await fetch(`${API_BASE_URL}/applications?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch applications: ${response.statusText}`);
      }

      const result: ApplicationsResponse = await response.json();
      return {
        applications: result.data.applications.map(normalizeApplication),
        pagination: result.data.pagination,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch applications');
    }
  },
};

// Helper function to format application status
export function formatApplicationStatus(status: Application['status']): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const statusMap: Record<Application['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    applied: { label: 'Đã ứng tuyển', variant: 'secondary' },
    reviewing: { label: 'Đang xem xét', variant: 'default' },
    shortlisted: { label: 'Đã chọn', variant: 'default' },
    interviewed: { label: 'Đã phỏng vấn', variant: 'default' },
    hired: { label: 'Đã tuyển', variant: 'default' },
    rejected: { label: 'Từ chối', variant: 'destructive' },
    withdrawn: { label: 'Đã hủy', variant: 'outline' },
  };
  return statusMap[status] || { label: status, variant: 'secondary' };
}

