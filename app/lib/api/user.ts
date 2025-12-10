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

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  title?: string;
  description?: string;
  role: 'candidate' | 'employer' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const userApi = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          // Wait a bit and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: getAuthHeaders(),
          });
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(errorData?.error?.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.');
          }
          const result: UserProfileResponse = await retryResponse.json();
          // Normalize avatar URL to absolute URL
          const user = result.data.user;
          return {
            ...user,
            avatar: toAbsoluteFileUrl(user.avatar),
          };
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to fetch profile: ${response.statusText}`);
      }

      const result: UserProfileResponse = await response.json();
      // Normalize avatar URL to absolute URL
      const user = result.data.user;
      return {
        ...user,
        avatar: toAbsoluteFileUrl(user.avatar),
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch profile');
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to update profile: ${response.statusText}`);
      }

      const result: UserProfileResponse = await response.json();
      // Normalize avatar URL to absolute URL
      const user = result.data.user;
      return {
        ...user,
        avatar: toAbsoluteFileUrl(user.avatar),
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(avatarFile: File): Promise<{ user: UserProfile; avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/users/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Failed to upload avatar: ${response.statusText}`);
      }

      const result = await response.json();
      // Normalize avatar URL to absolute URL
      const avatarUrl = toAbsoluteFileUrl(result.data.avatarUrl);
      const user = {
        ...result.data.user,
        avatar: avatarUrl,
      };
      return {
        user,
        avatarUrl: avatarUrl || result.data.avatarUrl,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload avatar');
    }
  },
};

