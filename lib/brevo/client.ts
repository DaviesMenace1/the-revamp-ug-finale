/**
 * Brevo API Client
 * Handles all communication with Brevo REST API
 */

interface BrevoRequestInit extends RequestInit {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

class BrevoClient {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.BREVO_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is not set in environment variables');
    }
  }

  private async request<T>(
    endpoint: string,
    options: BrevoRequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Create a contact list
   */
  async createList(
    name: string,
    folderId?: string
  ): Promise<{ id: number; name: string }> {
    const body: any = { name };
    if (folderId) body.folderId = folderId;

    return this.request('/contacts/lists', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Get all contact lists
   */
  async getLists(): Promise<{
    lists: Array<{ id: number; name: string; folderId?: string }>;
  }> {
    return this.request('/contacts/lists?limit=50', { method: 'GET' });
  }

  /**
   * Get a specific list
   */
  async getList(
    listId: number
  ): Promise<{ id: number; name: string; folderId?: string }> {
    return this.request(`/contacts/lists/${listId}`, { method: 'GET' });
  }

  /**
   * Update a contact list
   */
  async updateList(listId: number, name: string): Promise<void> {
    await this.request(`/contacts/lists/${listId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Delete a contact list
   */
  async deleteList(listId: number): Promise<void> {
    await this.request(`/contacts/lists/${listId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Add a contact to a list
   */
  async addContactToList(listId: number, email: string): Promise<void> {
    await this.request(`/contacts/lists/${listId}/contacts/add`, {
      method: 'POST',
      body: JSON.stringify({ emails: [email] }),
    });
  }

  /**
   * Create or update a contact
   */
  async createOrUpdateContact(data: {
    email: string;
    attributes?: Record<string, any>;
    emailBlacklisted?: boolean;
    smsBlacklisted?: boolean;
    listIds?: number[];
  }): Promise<{ id: number; email: string }> {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a contact
   */
  async getContact(email: string): Promise<any> {
    return this.request(`/contacts/${encodeURIComponent(email)}`, {
      method: 'GET',
    });
  }

  /**
   * Update a contact
   */
  async updateContact(
    email: string,
    data: {
      attributes?: Record<string, any>;
      emailBlacklisted?: boolean;
      smsBlacklisted?: boolean;
      listIds?: number[];
    }
  ): Promise<void> {
    await this.request(`/contacts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a contact
   */
  async deleteContact(email: string): Promise<void> {
    await this.request(`/contacts/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Create a folder
   */
  async createFolder(name: string): Promise<{ id: number; name: string }> {
    return this.request('/contacts/folders', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Get all folders
   */
  async getFolders(): Promise<{
    folders: Array<{ id: number; name: string; totalBlacklisted: number; totalSubscribers: number }>;
  }> {
    return this.request('/contacts/folders?limit=50', { method: 'GET' });
  }

  /**
   * Create an email template
   */
  async createTemplate(data: {
    name: string;
    subject: string;
    htmlContent: string;
    plainTextContent?: string;
    isActive?: boolean;
    replyTo?: string;
    tag?: string;
    templateFolder?: number;
  }): Promise<{ id: number; name: string }> {
    return this.request('/smtp/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get an email template
   */
  async getTemplate(templateId: number): Promise<any> {
    return this.request(`/smtp/templates/${templateId}`, { method: 'GET' });
  }

  /**
   * Update an email template
   */
  async updateTemplate(templateId: number, data: any): Promise<void> {
    await this.request(`/smtp/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Send a transactional email
   */
  async sendTransactionalEmail(data: {
    to: Array<{ email: string; name?: string }>;
    templateId: number;
    params?: Record<string, any>;
    bcc?: Array<{ email: string }>;
    replyTo?: { email: string; name?: string };
  }): Promise<{ messageId: string }> {
    return this.request('/smtp/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create a marketing campaign
   */
  async createCampaign(data: {
    name: string;
    subject: string;
    type: 'classic' | 'automation';
    templateId?: number;
    senderId?: number;
    recipients: { listIds: number[] };
    scheduledAt?: string;
    tag?: string;
  }): Promise<{ id: number }> {
    return this.request('/emailcampaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create an automation workflow
   */
  async createAutomation(data: {
    name: string;
    trigger: 'contact_added' | 'contact_updated' | 'date_anniversary';
    triggerConfig?: Record<string, any>;
    actions: Array<any>;
    isActive?: boolean;
  }): Promise<{ id: number }> {
    return this.request('/automation/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

/**
 * Singleton instance of Brevo client
 */
let brevoClient: BrevoClient | null = null;

export function getBrevoClient(): BrevoClient {
  if (!brevoClient) {
    brevoClient = new BrevoClient();
  }
  return brevoClient;
}

export default BrevoClient;
