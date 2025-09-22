import { API_CONFIG } from '@/config/api';

export interface SupportTicket {
  ticketId: string;
  type: 'general' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'closed';
  subject: string;
  description: string;
  userEmail: string;
  userFullName?: string;
  userId?: string;
  responses: SupportResponse[];
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  ageInDays: number;
  statusDisplay: string;
}

export interface SupportResponse {
  responseId: string;
  message: string;
  isFromAgent: boolean;
  authorName: string;
  authorEmail: string;
  isInternal: boolean;
  attachments: any[];
  createdAt: string;
}

export interface CreateTicketData {
  type: 'general' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  userEmail: string;
  userFullName?: string;
  userId?: string;
}

export interface AddResponseData {
  message: string;
  authorName: string;
  authorEmail: string;
  isFromAgent?: boolean;
}

export interface SupportAnalytics {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  featureRequests: number;
  generalSupport: number;
}

export interface SupportTypeInfo {
  types: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  priorities: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  statuses: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

class SupportService {
  private baseUrl = `${API_CONFIG.BASE_URL}/support`;

  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: CreateTicketData, token?: string): Promise<{
    success: boolean;
    ticket?: SupportTicket;
    message?: string;
    error?: string;
  }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(ticketData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create support ticket');
      }

      return {
        success: true,
        ticket: data.ticket,
        message: data.message
      };
    } catch (error) {
      console.error('Create ticket error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create support ticket'
      };
    }
  }

  /**
   * Get support tickets with optional filtering
   */
  async getTickets(params: {
    userEmail?: string;
    status?: string;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  } = {}, token?: string): Promise<{
    success: boolean;
    tickets?: SupportTicket[];
    pagination?: any;
    error?: string;
  }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/tickets?${queryParams}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get support tickets');
      }

      return {
        success: true,
        tickets: data.tickets,
        pagination: data.pagination
      };
    } catch (error) {
      console.error('Get tickets error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get support tickets'
      };
    }
  }

  /**
   * Get a specific support ticket by ID
   */
  async getTicket(ticketId: string, token?: string): Promise<{
    success: boolean;
    ticket?: SupportTicket;
    error?: string;
  }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get support ticket');
      }

      return {
        success: true,
        ticket: data.ticket
      };
    } catch (error) {
      console.error('Get ticket error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get support ticket'
      };
    }
  }

  /**
   * Add a response to a support ticket
   */
  async addResponse(ticketId: string, responseData: AddResponseData, token?: string): Promise<{
    success: boolean;
    response?: SupportResponse;
    ticket?: SupportTicket;
    message?: string;
    error?: string;
  }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/responses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(responseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add response');
      }

      return {
        success: true,
        response: data.response,
        ticket: data.ticket,
        message: data.message
      };
    } catch (error) {
      console.error('Add response error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add response'
      };
    }
  }

  /**
   * Close a support ticket
   */
  async closeTicket(ticketId: string, token?: string): Promise<{
    success: boolean;
    ticket?: SupportTicket;
    message?: string;
    error?: string;
  }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/close`, {
        method: 'PUT',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close ticket');
      }

      return {
        success: true,
        ticket: data.ticket,
        message: data.message
      };
    } catch (error) {
      console.error('Close ticket error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close ticket'
      };
    }
  }

  /**
   * Get all tickets for a specific user
   */
  async getUserTickets(userEmail: string, params: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {}, token?: string): Promise<{
    success: boolean;
    tickets?: SupportTicket[];
    pagination?: any;
    error?: string;
  }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/user/${encodeURIComponent(userEmail)}/tickets?${queryParams}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user tickets');
      }

      return {
        success: true,
        tickets: data.tickets,
        pagination: data.pagination
      };
    } catch (error) {
      console.error('Get user tickets error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user tickets'
      };
    }
  }

  /**
   * Get support analytics
   */
  async getAnalytics(params: {
    startDate?: string;
    endDate?: string;
  } = {}, token?: string): Promise<{
    success: boolean;
    analytics?: SupportAnalytics;
    recentTickets?: any[];
    priorityStats?: any[];
    error?: string;
  }> {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/analytics?${queryParams}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get analytics');
      }

      return {
        success: true,
        analytics: data.analytics,
        recentTickets: data.recentTickets,
        priorityStats: data.priorityStats
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      };
    }
  }

  /**
   * Get available support types and priorities
   */
  async getSupportTypes(): Promise<{
    success: boolean;
    data?: SupportTypeInfo;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get support types');
      }

      return {
        success: true,
        data: {
          types: data.types,
          priorities: data.priorities,
          statuses: data.statuses
        }
      };
    } catch (error) {
      console.error('Get support types error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get support types'
      };
    }
  }

  /**
   * Quick methods for common ticket types
   */
  async createGeneralSupportTicket(data: {
    subject: string;
    description: string;
    userEmail: string;
    userFullName?: string;
    userId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }, token?: string) {
    return this.createTicket({
      type: 'general',
      priority: data.priority || 'medium',
      subject: data.subject,
      description: data.description,
      userEmail: data.userEmail,
      userFullName: data.userFullName,
      userId: data.userId
    }, token);
  }

  async createFeatureRequest(data: {
    subject: string;
    description: string;
    userEmail: string;
    userFullName?: string;
    userId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }, token?: string) {
    return this.createTicket({
      type: 'feature_request',
      priority: data.priority || 'medium',
      subject: data.subject,
      description: data.description,
      userEmail: data.userEmail,
      userFullName: data.userFullName,
      userId: data.userId
    }, token);
  }
}

export const supportService = new SupportService();
export default supportService;
