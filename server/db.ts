import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import {
  CompanySettings,
  Client,
  PurchaseRecord,
  PaymentRecord,
  RenewalRecord,
  Quotation,
  Invoice,
  ExpenseRecord,
  DigitalAsset,
  ActivityLog,
  UserRole,
} from '../src/types';
import {
  initialCompanySettings,
  initialClients,
  initialPurchases,
  initialPayments,
  initialRenewals,
  initialQuotations,
  initialInvoices,
  initialExpenses,
  initialDigitalAssets,
  initialActivityLogs,
} from '../src/context/initialData';

export interface DatabaseStatus {
  connected: boolean;
  type: 'mysql' | 'server_persistent';
  host?: string;
  database?: string;
  message: string;
  counts: {
    clients: number;
    purchases: number;
    quotations: number;
    invoices: number;
    payments: number;
    renewals: number;
    expenses: number;
    assets: number;
    logs: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'klyia_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
}

export interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: 'Active' | 'Inactive' | 'Suspended';
}

export interface ServerSessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
}

export interface ServerPasswordResetRecord {
  id: number;
  email: string;
  token_hash: string;
  expires_at: string;
  used: boolean | number;
}

interface ServerDataStore {
  settings: CompanySettings;
  clients: Client[];
  purchases: PurchaseRecord[];
  payments: PaymentRecord[];
  renewals: RenewalRecord[];
  quotations: Quotation[];
  invoices: Invoice[];
  expenses: ExpenseRecord[];
  assets: DigitalAsset[];
  logs: ActivityLog[];
  users: ServerUserRecord[];
  sessions: ServerSessionRecord[];
  passwordResets: ServerPasswordResetRecord[];
}

function getDefaultUsers(): ServerUserRecord[] {
  const initialAdminPassword =
    process.env.ADMIN_PASSWORD ||
    process.env.INITIAL_ADMIN_PASSWORD ||
    'KlyiaTech@2026';
  const initialHash = bcrypt.hashSync(initialAdminPassword, 10);

  return [
    {
      id: 'usr-admin-klyia',
      name: 'Klyia Administrator',
      email: 'klyiatechnology@gmail.com',
      password_hash: initialHash,
      role: 'Admin',
      status: 'Active',
    },
    {
      id: 'usr-admin-01',
      name: 'Viru Patel',
      email: 'viru.patel513@gmail.com',
      password_hash: initialHash,
      role: 'Admin',
      status: 'Active',
    },
  ];
}

function loadInitialStore(): ServerDataStore {
  return {
    settings: initialCompanySettings,
    clients: initialClients,
    purchases: initialPurchases,
    payments: initialPayments,
    renewals: initialRenewals,
    quotations: initialQuotations,
    invoices: initialInvoices,
    expenses: initialExpenses,
    assets: initialDigitalAssets,
    logs: initialActivityLogs,
    users: getDefaultUsers(),
    sessions: [],
    passwordResets: [],
  };
}

class DatabaseManager {
  private pool: mysql.Pool | null = null;
  private isMySQLActive = false;
  private store: ServerDataStore;

  constructor() {
    this.store = this.readJSONStore();
    this.ensureStoreAuthUsers();
  }

  private ensureStoreAuthUsers() {
    if (!this.store.users || !Array.isArray(this.store.users) || this.store.users.length === 0) {
      this.store.users = getDefaultUsers();
      this.persistStore();
      return;
    }

    const initialAdminPassword =
      process.env.ADMIN_PASSWORD ||
      process.env.INITIAL_ADMIN_PASSWORD ||
      'KlyiaTech@2026';
    const initialHash = bcrypt.hashSync(initialAdminPassword, 10);

    let changed = false;
    // 1. Ensure klyiatechnology@gmail.com exists
    const klyia = this.store.users.find(
      (u) => u.email.toLowerCase() === 'klyiatechnology@gmail.com'
    );
    if (!klyia) {
      this.store.users.push({
        id: 'usr-admin-klyia',
        name: 'Klyia Administrator',
        email: 'klyiatechnology@gmail.com',
        password_hash: initialHash,
        role: 'Admin',
        status: 'Active',
      });
      changed = true;
    } else if (!klyia.password_hash) {
      klyia.password_hash = initialHash;
      changed = true;
    }

    // 2. Ensure viru.patel513@gmail.com exists
    const viru = this.store.users.find(
      (u) => u.email.toLowerCase() === 'viru.patel513@gmail.com'
    );
    if (!viru) {
      this.store.users.push({
        id: 'usr-admin-01',
        name: 'Viru Patel',
        email: 'viru.patel513@gmail.com',
        password_hash: initialHash,
        role: 'Admin',
        status: 'Active',
      });
      changed = true;
    } else if (!viru.password_hash) {
      viru.password_hash = initialHash;
      changed = true;
    }

    if (!Array.isArray(this.store.sessions)) {
      this.store.sessions = [];
      changed = true;
    }
    if (!Array.isArray(this.store.passwordResets)) {
      this.store.passwordResets = [];
      changed = true;
    }

    if (changed) {
      this.persistStore();
    }
  }

  private readJSONStore(): ServerDataStore {
    try {
      if (fs.existsSync(JSON_DB_PATH)) {
        const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          settings: parsed.settings || initialCompanySettings,
          clients: Array.isArray(parsed.clients) ? parsed.clients : initialClients,
          purchases: Array.isArray(parsed.purchases) ? parsed.purchases : initialPurchases,
          payments: Array.isArray(parsed.payments) ? parsed.payments : initialPayments,
          renewals: Array.isArray(parsed.renewals) ? parsed.renewals : initialRenewals,
          quotations: Array.isArray(parsed.quotations) ? parsed.quotations : initialQuotations,
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : initialInvoices,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : initialExpenses,
          assets: Array.isArray(parsed.assets) ? parsed.assets : initialDigitalAssets,
          logs: Array.isArray(parsed.logs) ? parsed.logs : initialActivityLogs,
          users: Array.isArray(parsed.users) ? parsed.users : getDefaultUsers(),
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          passwordResets: Array.isArray(parsed.passwordResets) ? parsed.passwordResets : [],
        };
      }
    } catch (e) {
      console.error('Error reading JSON store, initializing default:', e);
    }
    const initial = loadInitialStore();
    this.writeJSONStore(initial);
    return initial;
  }

  private lastMtime = 0;

  private checkFileStoreSync() {
    if (this.isMySQLActive) return;
    try {
      if (fs.existsSync(JSON_DB_PATH)) {
        const stats = fs.statSync(JSON_DB_PATH);
        if (stats.mtimeMs > this.lastMtime) {
          const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.store = {
              settings: parsed.settings || this.store.settings,
              clients: Array.isArray(parsed.clients) ? parsed.clients : this.store.clients,
              purchases: Array.isArray(parsed.purchases) ? parsed.purchases : this.store.purchases,
              payments: Array.isArray(parsed.payments) ? parsed.payments : this.store.payments,
              renewals: Array.isArray(parsed.renewals) ? parsed.renewals : this.store.renewals,
              quotations: Array.isArray(parsed.quotations) ? parsed.quotations : this.store.quotations,
              invoices: Array.isArray(parsed.invoices) ? parsed.invoices : this.store.invoices,
              expenses: Array.isArray(parsed.expenses) ? parsed.expenses : this.store.expenses,
              assets: Array.isArray(parsed.assets) ? parsed.assets : this.store.assets,
              logs: Array.isArray(parsed.logs) ? parsed.logs : this.store.logs,
              users: Array.isArray(parsed.users) ? parsed.users : this.store.users,
              sessions: Array.isArray(parsed.sessions) ? parsed.sessions : this.store.sessions,
              passwordResets: Array.isArray(parsed.passwordResets) ? parsed.passwordResets : this.store.passwordResets,
            };
          }
          this.lastMtime = stats.mtimeMs;
        }
      }
    } catch (e) {
      // Ignore sync read error
    }
  }

  private writeJSONStore(data: ServerDataStore) {
    try {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
      if (fs.existsSync(JSON_DB_PATH)) {
        this.lastMtime = fs.statSync(JSON_DB_PATH).mtimeMs;
      }
    } catch (e) {
      console.error('Error writing JSON store:', e);
    }
  }

  private persistStore() {
    this.writeJSONStore(this.store);
  }

  public async initialize(): Promise<void> {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const isProduction = process.env.NODE_ENV === 'production';

    if (host && user && database) {
      try {
        console.log(`[Database] Attempting connection to Hostinger MySQL at ${host}:${port}/${database}...`);
        this.pool = mysql.createPool({
          host,
          port,
          user,
          password: password || '',
          database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          enableKeepAlive: true,
          keepAliveInitialDelay: 0,
        });

        // Test connection
        const conn = await this.pool.getConnection();
        conn.release();
        this.isMySQLActive = true;
        console.log('[Database] Successfully connected to MySQL pool.');

        // Initialize schema in MySQL
        await this.initMySQLTables();
        await this.initDefaultAdminUser();
      } catch (err: any) {
        if (isProduction) {
          // Strictly fail in production mode to prevent silent inconsistency
          throw new Error(
            `[Production Database Failure] Unable to connect to Hostinger MySQL database at ${host}:${port}/${database} (${err.message}). In production mode, the application will not silently fall back to JSON storage to protect data integrity. Please verify Hostinger MySQL credentials in .env / hPanel.`
          );
        }
        console.warn(`[Database] Could not connect to MySQL (${err.message}). Using isolated development persistent storage.`);
        this.isMySQLActive = false;
        this.pool = null;
      }
    } else {
      if (isProduction) {
        throw new Error(
          '[Production Configuration Error] Missing Hostinger MySQL credentials in production environment. DB_HOST, DB_USER, and DB_NAME environment variables must be configured in Hostinger hPanel. The application will not run on JSON storage in production.'
        );
      }
      console.log('[Database] Development mode: DB_HOST not configured. Using isolated development server storage (data/klyia_db.json). Ready for Hostinger MySQL when credentials are provided in .env.');
    }
  }

  private async initMySQLTables() {
    if (!this.pool) return;
    try {
      const candidates = [
        path.resolve(process.cwd(), 'server', 'schema.sql'),
        path.resolve(process.cwd(), 'dist', 'schema.sql'),
        path.resolve(process.cwd(), 'schema.sql'),
      ];
      const schemaPath = candidates.find((p) => fs.existsSync(p));
      if (schemaPath) {
        const sql = fs.readFileSync(schemaPath, 'utf-8');
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--'));

        for (const stmt of statements) {
          try {
            await this.pool.query(stmt);
          } catch (e) {
            // Ignore benign duplicate warnings
          }
        }
        console.log('[Database] MySQL tables verified.');
      }
    } catch (e) {
      console.error('[Database] Error executing MySQL schema init:', e);
    }
  }

  private async initDefaultAdminUser() {
    if (!this.pool) return;
    try {
      const initialAdminPassword =
        process.env.ADMIN_PASSWORD ||
        process.env.INITIAL_ADMIN_PASSWORD ||
        'KlyiaTech@2026';
      const initialHash = bcrypt.hashSync(initialAdminPassword, 10);

      // 1. Initial administrator account: klyiatechnology@gmail.com
      const [klyiaRows]: any = await this.pool.query(
        'SELECT id, password_hash FROM users WHERE LOWER(email) = ?',
        ['klyiatechnology@gmail.com']
      );
      if (!klyiaRows || klyiaRows.length === 0) {
        await this.pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, status)
           VALUES ('usr-admin-klyia', 'Klyia Administrator', 'klyiatechnology@gmail.com', ?, 'Admin', 'Active')`,
          [initialHash]
        );
        console.log('[Database] Created initial administrator account for klyiatechnology@gmail.com');
      } else if (!klyiaRows[0].password_hash) {
        // Only set if null - never overwrite existing password
        await this.pool.query(
          `UPDATE users SET password_hash = ? WHERE LOWER(email) = 'klyiatechnology@gmail.com'`,
          [initialHash]
        );
        console.log('[Database] Provisioned initial password hash for klyiatechnology@gmail.com');
      }

      // 2. Also ensure existing admin account (viru.patel513@gmail.com) has a secure password hash if unset
      const [viruRows]: any = await this.pool.query(
        'SELECT id, password_hash FROM users WHERE LOWER(email) = ?',
        ['viru.patel513@gmail.com']
      );
      if (!viruRows || viruRows.length === 0) {
        await this.pool.query(
          `INSERT INTO users (id, name, email, password_hash, role, status)
           VALUES ('usr-admin-01', 'Viru Patel', 'viru.patel513@gmail.com', ?, 'Admin', 'Active')`,
          [initialHash]
        );
      } else if (!viruRows[0].password_hash) {
        await this.pool.query(
          `UPDATE users SET password_hash = ? WHERE LOWER(email) = 'viru.patel513@gmail.com'`,
          [initialHash]
        );
      }
    } catch (e) {
      console.error('[Database] Non-fatal error during admin user initialization:', e);
    }
  }

  // -------------------------------------------------------------
  // DB STATUS
  // -------------------------------------------------------------
  public async getStatus(): Promise<DatabaseStatus> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [clientRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM clients WHERE is_archived = 0');
        const [purchaseRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM purchases');
        const [quotationRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM quotations');
        const [invoiceRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM invoices');
        const [paymentRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM payments');
        const [renewalRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM renewals');
        const [expenseRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM expenses');
        const [assetRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM digital_assets');
        const [logRows]: any = await this.pool.query('SELECT COUNT(*) as count FROM activity_logs');

        return {
          connected: true,
          type: 'mysql',
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          message: 'Connected to Hostinger MySQL Database',
          counts: {
            clients: clientRows[0]?.count || 0,
            purchases: purchaseRows[0]?.count || 0,
            quotations: quotationRows[0]?.count || 0,
            invoices: invoiceRows[0]?.count || 0,
            payments: paymentRows[0]?.count || 0,
            renewals: renewalRows[0]?.count || 0,
            expenses: expenseRows[0]?.count || 0,
            assets: assetRows[0]?.count || 0,
            logs: logRows[0]?.count || 0,
          },
        };
      } catch (err: any) {
        console.error('Error fetching MySQL stats:', err);
      }
    }

    return {
      connected: true,
      type: 'server_persistent',
      message: 'Active persistent server database (Local ACID file). Set DB_HOST in .env to connect Hostinger MySQL.',
      counts: {
        clients: this.store.clients.length,
        purchases: this.store.purchases.length,
        quotations: this.store.quotations.length,
        invoices: this.store.invoices.length,
        payments: this.store.payments.length,
        renewals: this.store.renewals.length,
        expenses: this.store.expenses.length,
        assets: this.store.assets.length,
        logs: this.store.logs.length,
      },
    };
  }

  // -------------------------------------------------------------
  // CLIENTS CRUD
  // -------------------------------------------------------------
  public async getClients(includeArchived = false): Promise<Client[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const query = includeArchived
          ? 'SELECT * FROM clients ORDER BY date_added DESC'
          : 'SELECT * FROM clients WHERE is_archived = 0 ORDER BY date_added DESC';
        const [rows]: any = await this.pool.query(query);
        return rows.map((r: any) => ({
          id: r.id,
          clientId: r.client_id,
          name: r.name,
          companyName: r.company_name,
          contactPerson: r.contact_person,
          phone: r.phone,
          whatsapp: r.whatsapp,
          email: r.email,
          gstin: r.gstin,
          pan: r.pan,
          address: r.address,
          area: r.area,
          city: r.city,
          district: r.district,
          state: r.state,
          pincode: r.pincode,
          country: r.country,
          website: r.website,
          industry: r.industry,
          clientType: r.client_type,
          notes: r.notes,
          dateAdded: r.date_added,
          lastPurchaseDate: r.last_purchase_date,
          nextRenewalDate: r.next_renewal_date,
          status: r.status,
          pipelineStage: r.pipeline_stage,
          mapUrl: r.map_url,
          assignedTo: r.assigned_to,
          services: typeof r.services === 'string' ? JSON.parse(r.services) : r.services || [],
          projectTitle: r.project_title,
          estimatedValue: Number(r.estimated_value) || 0,
          isArchived: Boolean(r.is_archived),
          archivedAt: r.archived_at,
        }));
      } catch (e) {
        console.error('MySQL getClients error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    if (includeArchived) {
      return this.store.clients;
    }
    return this.store.clients.filter((c) => !c.isArchived);
  }

  public async getClientById(id: string): Promise<Client | null> {
    const clients = await this.getClients(true);
    return clients.find((c) => c.id === id) || null;
  }

  public async createClient(clientData: Partial<Client>): Promise<Client> {
    const id = clientData.id || `cli-${Date.now()}`;
    const nextNum = (await this.getClients(true)).length + 1;
    const clientId = clientData.clientId || `KLY-CLI-${String(nextNum).padStart(3, '0')}`;
    const dateAdded = clientData.dateAdded || new Date().toISOString().split('T')[0];

    const newClient: Client = {
      id,
      clientId,
      name: clientData.name || '',
      companyName: clientData.companyName || clientData.name || '',
      contactPerson: clientData.contactPerson || '',
      phone: clientData.phone || '',
      whatsapp: clientData.whatsapp || clientData.phone || '',
      email: clientData.email || '',
      gstin: clientData.gstin || '',
      pan: clientData.pan || '',
      address: clientData.address || '',
      area: clientData.area || '',
      city: clientData.city || '',
      district: clientData.district || '',
      state: clientData.state || 'Karnataka',
      pincode: clientData.pincode || '',
      country: clientData.country || 'India',
      website: clientData.website || '',
      industry: clientData.industry || 'Information Technology',
      clientType: clientData.clientType || 'NEW CLIENT',
      notes: clientData.notes || '',
      dateAdded,
      lastPurchaseDate: clientData.lastPurchaseDate,
      nextRenewalDate: clientData.nextRenewalDate,
      status: clientData.status || 'Active',
      pipelineStage: clientData.pipelineStage || 'Requirement Received',
      mapUrl: clientData.mapUrl,
      assignedTo: clientData.assignedTo || 'Viru Patel',
      services: clientData.services || [],
      projectTitle: clientData.projectTitle || '',
      estimatedValue: clientData.estimatedValue || 0,
      isArchived: false,
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO clients (
            id, client_id, name, company_name, contact_person, phone, whatsapp, email,
            gstin, pan, address, area, city, district, state, pincode, country, website,
            industry, client_type, notes, date_added, last_purchase_date, next_renewal_date,
            status, pipeline_stage, map_url, assigned_to, services, project_title, estimated_value, is_archived
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newClient.id,
            newClient.clientId,
            newClient.name,
            newClient.companyName,
            newClient.contactPerson,
            newClient.phone,
            newClient.whatsapp,
            newClient.email,
            newClient.gstin,
            newClient.pan,
            newClient.address,
            newClient.area,
            newClient.city,
            newClient.district,
            newClient.state,
            newClient.pincode,
            newClient.country,
            newClient.website,
            newClient.industry,
            newClient.clientType,
            newClient.notes,
            newClient.dateAdded,
            newClient.lastPurchaseDate || null,
            newClient.nextRenewalDate || null,
            newClient.status,
            newClient.pipelineStage,
            newClient.mapUrl || null,
            newClient.assignedTo,
            JSON.stringify(newClient.services || []),
            newClient.projectTitle,
            newClient.estimatedValue,
            0,
          ]
        );
        return newClient;
      } catch (err) {
        console.error('MySQL insert client error:', err);
        throw err;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.clients = [newClient, ...this.store.clients];
    this.persistStore();
    return newClient;
  }

  public async updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    const existing = await this.getClientById(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `UPDATE clients SET
            name = ?, company_name = ?, contact_person = ?, phone = ?, whatsapp = ?, email = ?,
            gstin = ?, pan = ?, address = ?, area = ?, city = ?, district = ?, state = ?,
            pincode = ?, country = ?, website = ?, industry = ?, client_type = ?, notes = ?,
            status = ?, pipeline_stage = ?, map_url = ?, assigned_to = ?, services = ?,
            project_title = ?, estimated_value = ?, is_archived = ?, archived_at = ?,
            last_purchase_date = ?, next_renewal_date = ?
           WHERE id = ?`,
          [
            updated.name,
            updated.companyName,
            updated.contactPerson,
            updated.phone,
            updated.whatsapp,
            updated.email,
            updated.gstin,
            updated.pan,
            updated.address,
            updated.area,
            updated.city,
            updated.district,
            updated.state,
            updated.pincode,
            updated.country,
            updated.website,
            updated.industry,
            updated.clientType,
            updated.notes,
            updated.status,
            updated.pipelineStage,
            updated.mapUrl || null,
            updated.assignedTo,
            JSON.stringify(updated.services || []),
            updated.projectTitle,
            updated.estimatedValue,
            updated.isArchived ? 1 : 0,
            updated.archivedAt || null,
            updated.lastPurchaseDate || null,
            updated.nextRenewalDate || null,
            id,
          ]
        );
        return updated;
      } catch (e) {
        console.error('MySQL update client error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.clients = this.store.clients.map((c) => (c.id === id ? updated : c));
    this.persistStore();
    return updated;
  }

  public async archiveClient(id: string): Promise<boolean> {
    const client = await this.getClientById(id);
    if (!client) return false;
    await this.updateClient(id, {
      isArchived: true,
      status: 'Archived',
      archivedAt: new Date().toISOString(),
    });
    return true;
  }

  public async restoreClient(id: string): Promise<boolean> {
    const client = await this.getClientById(id);
    if (!client) return false;
    await this.updateClient(id, {
      isArchived: false,
      status: 'Active',
      archivedAt: undefined,
    });
    return true;
  }

  public async deleteClient(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM payments WHERE client_id = ?', [id]);
        await conn.query('DELETE FROM invoices WHERE client_id = ?', [id]);
        await conn.query('DELETE FROM quotations WHERE client_id = ?', [id]);
        await conn.query('DELETE FROM renewals WHERE client_id = ?', [id]);
        await conn.query('DELETE FROM purchases WHERE client_id = ?', [id]);
        await conn.query('DELETE FROM digital_assets WHERE client_id = ?', [id]);
        await conn.query('DELETE FROM clients WHERE id = ?', [id]);
        await conn.commit();
        return true;
      } catch (e) {
        await conn.rollback();
        console.error('MySQL delete client error:', e);
        throw e;
      } finally {
        conn.release();
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.clients = this.store.clients.filter((c) => c.id !== id);
    this.store.purchases = this.store.purchases.filter((p) => p.clientId !== id);
    this.store.quotations = this.store.quotations.filter((q) => q.clientId !== id);
    this.store.invoices = this.store.invoices.filter((i) => i.clientId !== id);
    this.store.payments = this.store.payments.filter((p) => p.clientId !== id);
    this.store.renewals = this.store.renewals.filter((r) => r.clientId !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // PURCHASES (PROJECTS / SERVICES) CRUD
  // -------------------------------------------------------------
  public async getPurchases(): Promise<PurchaseRecord[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM purchases ORDER BY purchase_date DESC');
        return rows.map((r: any) => ({
          id: r.id,
          purchaseId: r.purchase_id,
          clientId: r.client_id,
          clientName: r.client_name,
          purchaseDate: r.purchase_date,
          serviceType: r.service_type,
          customServiceTitle: r.custom_service_title,
          description: r.description,
          baseAmount: Number(r.amount || 0),
          discount: Number(r.discount || 0),
          gstApplicable: Boolean(r.gst_applicable),
          gstPercent: Number(r.gst_percent || 18),
          isInterstate: Boolean(r.is_interstate),
          cgst: Number(r.cgst || 0),
          sgst: Number(r.sgst || 0),
          igst: Number(r.igst || 0),
          grandTotal: Number(r.grand_total || 0),
          advancePaid: Number(r.advance_paid || 0),
          balanceDue: Number(r.balance_due || 0),
          paymentStatus: r.payment_status,
          paymentMode: r.payment_mode,
          dueDate: r.due_date,
          renewalDate: r.renewal_date,
          notes: r.notes,
        }));
      } catch (e) {
        console.error('MySQL getPurchases error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.purchases;
  }

  public async createPurchase(data: Partial<PurchaseRecord>): Promise<PurchaseRecord> {
    const id = data.id || `pur-${Date.now()}`;
    const nextNum = (await this.getPurchases()).length + 1;
    const purchaseId = data.purchaseId || `KLY-PUR-${String(nextNum).padStart(3, '0')}`;

    const newPurchase: PurchaseRecord = {
      id,
      purchaseId,
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      serviceType: data.serviceType || 'Web Application',
      customServiceTitle: data.customServiceTitle || '',
      description: data.description || '',
      baseAmount: Number(data.baseAmount || 0),
      discount: Number(data.discount || 0),
      gstApplicable: data.gstApplicable ?? true,
      gstPercent: Number(data.gstPercent || 18),
      isInterstate: data.isInterstate ?? false,
      cgst: Number(data.cgst || 0),
      sgst: Number(data.sgst || 0),
      igst: Number(data.igst || 0),
      grandTotal: Number(data.grandTotal || 0),
      advancePaid: Number(data.advancePaid || 0),
      balanceDue: Number(data.balanceDue || 0),
      paymentStatus: data.paymentStatus || 'Pending',
      paymentMode: data.paymentMode || 'Bank Transfer',
      dueDate: data.dueDate,
      renewalDate: data.renewalDate,
      notes: data.notes || '',
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO purchases (
            id, purchase_id, client_id, client_name, purchase_date, service_type,
            custom_service_title, description, amount, discount, gst_applicable,
            gst_percent, is_interstate, cgst, sgst, igst, grand_total, advance_paid,
            balance_due, payment_status, payment_mode, due_date, renewal_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newPurchase.id,
            newPurchase.purchaseId,
            newPurchase.clientId,
            newPurchase.clientName,
            newPurchase.purchaseDate,
            newPurchase.serviceType,
            newPurchase.customServiceTitle,
            newPurchase.description,
            newPurchase.baseAmount,
            newPurchase.discount,
            newPurchase.gstApplicable ? 1 : 0,
            newPurchase.gstPercent,
            newPurchase.isInterstate ? 1 : 0,
            newPurchase.cgst,
            newPurchase.sgst,
            newPurchase.igst,
            newPurchase.grandTotal,
            newPurchase.advancePaid,
            newPurchase.balanceDue,
            newPurchase.paymentStatus,
            newPurchase.paymentMode,
            newPurchase.dueDate || null,
            newPurchase.renewalDate || null,
            newPurchase.notes,
          ]
        );
        return newPurchase;
      } catch (err) {
        console.error('MySQL insert purchase error:', err);
        throw err;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.purchases = [newPurchase, ...this.store.purchases];
    this.persistStore();
    return newPurchase;
  }

  public async updatePurchase(id: string, updates: Partial<PurchaseRecord>): Promise<PurchaseRecord | null> {
    const list = await this.getPurchases();
    const existing = list.find((p) => p.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `UPDATE purchases SET
            service_type = ?, custom_service_title = ?, description = ?, amount = ?,
            discount = ?, gst_percent = ?, grand_total = ?, advance_paid = ?,
            balance_due = ?, payment_status = ?, payment_mode = ?, renewal_date = ?, notes = ?
           WHERE id = ?`,
          [
            updated.serviceType,
            updated.customServiceTitle,
            updated.description,
            updated.baseAmount,
            updated.discount,
            updated.gstPercent,
            updated.grandTotal,
            updated.advancePaid,
            updated.balanceDue,
            updated.paymentStatus,
            updated.paymentMode,
            updated.renewalDate || null,
            updated.notes,
            id,
          ]
        );
        return updated;
      } catch (e) {
        console.error('MySQL update purchase error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.purchases = this.store.purchases.map((p) => (p.id === id ? updated : p));
    this.persistStore();
    return updated;
  }

  public async deletePurchase(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM purchases WHERE id = ?', [id]);
        return true;
      } catch (e) {
        console.error('MySQL delete purchase error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.purchases = this.store.purchases.filter((p) => p.id !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // QUOTATIONS CRUD
  // -------------------------------------------------------------
  public async getQuotations(): Promise<Quotation[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM quotations ORDER BY quotation_date DESC');
        return rows.map((r: any) => ({
          id: r.id,
          quotationNumber: r.quotation_number,
          quotationDate: r.quotation_date,
          validUntil: r.valid_until,
          clientId: r.client_id,
          clientName: r.client_name,
          companyName: r.company_name,
          contactPerson: r.contact_person,
          phone: r.phone,
          email: r.email,
          gstin: r.gstin,
          address: r.address,
          items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items || [],
          subtotal: Number(r.subtotal),
          discountTotal: Number(r.discount_total),
          taxableAmount: Number(r.taxable_amount),
          gstPercent: Number(r.gst_percent),
          isInterstate: Boolean(r.is_interstate),
          cgst: Number(r.cgst),
          sgst: Number(r.sgst),
          igst: Number(r.igst),
          grandTotal: Number(r.grand_total),
          status: r.status,
          notes: r.notes,
          terms: typeof r.terms === 'string' ? JSON.parse(r.terms) : r.terms || [],
        }));
      } catch (e) {
        console.error('MySQL getQuotations error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.quotations;
  }

  public async createQuotation(data: Partial<Quotation>): Promise<Quotation> {
    const id = data.id || `qtn-${Date.now()}`;
    const nextNum = (await this.getQuotations()).length + 1;
    const quotationNumber =
      data.quotationNumber ||
      `${this.store.settings.quotationPrefix || 'KLY-QTN-2026-'}${String(nextNum).padStart(4, '0')}`;

    const newQuotation: Quotation = {
      id,
      quotationNumber,
      quotationDate: data.quotationDate || new Date().toISOString().split('T')[0],
      validUntil: data.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      companyName: data.companyName || '',
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      gstin: data.gstin || '',
      address: data.address || '',
      items: data.items || [],
      subtotal: Number(data.subtotal) || 0,
      discountTotal: Number(data.discountTotal) || 0,
      taxableAmount: Number(data.taxableAmount) || 0,
      gstPercent: Number(data.gstPercent) || 18,
      isInterstate: data.isInterstate ?? false,
      cgst: Number(data.cgst) || 0,
      sgst: Number(data.sgst) || 0,
      igst: Number(data.igst) || 0,
      grandTotal: Number(data.grandTotal) || 0,
      status: data.status || 'Draft',
      notes: data.notes || '',
      terms: data.terms || this.store.settings.quotationTerms || [],
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO quotations (
            id, quotation_number, quotation_date, valid_until, client_id, client_name,
            company_name, contact_person, phone, email, gstin, address, items,
            subtotal, discount_total, taxable_amount, gst_percent, is_interstate,
            cgst, sgst, igst, grand_total, status, notes, terms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newQuotation.id,
            newQuotation.quotationNumber,
            newQuotation.quotationDate,
            newQuotation.validUntil,
            newQuotation.clientId,
            newQuotation.clientName,
            newQuotation.companyName,
            newQuotation.contactPerson,
            newQuotation.phone,
            newQuotation.email,
            newQuotation.gstin,
            newQuotation.address,
            JSON.stringify(newQuotation.items),
            newQuotation.subtotal,
            newQuotation.discountTotal,
            newQuotation.taxableAmount,
            newQuotation.gstPercent,
            newQuotation.isInterstate ? 1 : 0,
            newQuotation.cgst,
            newQuotation.sgst,
            newQuotation.igst,
            newQuotation.grandTotal,
            newQuotation.status,
            newQuotation.notes,
            JSON.stringify(newQuotation.terms),
          ]
        );
        return newQuotation;
      } catch (err) {
        console.error('MySQL insert quotation error:', err);
        throw err;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.quotations = [newQuotation, ...this.store.quotations];
    this.persistStore();
    return newQuotation;
  }

  public async updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation | null> {
    const list = await this.getQuotations();
    const existing = list.find((q) => q.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `UPDATE quotations SET
            status = ?, items = ?, subtotal = ?, discount_total = ?, taxable_amount = ?,
            cgst = ?, sgst = ?, igst = ?, grand_total = ?, notes = ?, valid_until = ?
           WHERE id = ?`,
          [
            updated.status,
            JSON.stringify(updated.items),
            updated.subtotal,
            updated.discountTotal,
            updated.taxableAmount,
            updated.cgst,
            updated.sgst,
            updated.igst,
            updated.grandTotal,
            updated.notes,
            updated.validUntil,
            id,
          ]
        );
        return updated;
      } catch (e) {
        console.error('MySQL update quotation error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.quotations = this.store.quotations.map((q) => (q.id === id ? updated : q));
    this.persistStore();
    return updated;
  }

  public async deleteQuotation(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM quotations WHERE id = ?', [id]);
        return true;
      } catch (e) {
        console.error('MySQL delete quotation error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.quotations = this.store.quotations.filter((q) => q.id !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // INVOICES CRUD
  // -------------------------------------------------------------
  public async getInvoices(): Promise<Invoice[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM invoices ORDER BY invoice_date DESC');
        return rows.map((r: any) => ({
          id: r.id,
          invoiceNumber: r.invoice_number,
          quotationNumber: r.quotation_number,
          invoiceDate: r.invoice_date,
          dueDate: r.due_date,
          clientId: r.client_id,
          clientName: r.client_name,
          companyName: r.company_name,
          contactPerson: r.contact_person,
          phone: r.phone,
          email: r.email,
          gstin: r.gstin,
          address: r.address,
          items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items || [],
          subtotal: Number(r.subtotal),
          discountTotal: Number(r.discount_total),
          taxableAmount: Number(r.taxable_amount),
          gstPercent: Number(r.gst_percent),
          isInterstate: Boolean(r.is_interstate),
          cgst: Number(r.cgst),
          sgst: Number(r.sgst),
          igst: Number(r.igst),
          grandTotal: Number(r.grand_total),
          paidAmount: Number(r.paid_amount),
          balanceDue: Number(r.balance_due),
          status: r.status,
          paymentTerms: r.payment_terms || 'Payment due on receipt',
          notes: r.notes,
        }));
      } catch (e) {
        console.error('MySQL getInvoices error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.invoices;
  }

  public async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const id = data.id || `inv-${Date.now()}`;
    const nextNum = (await this.getInvoices()).length + 1;
    const invoiceNumber =
      data.invoiceNumber ||
      `${this.store.settings.invoicePrefix || 'KLY-INV-2026-'}${String(nextNum).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      id,
      invoiceNumber,
      quotationNumber: data.quotationNumber,
      invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      companyName: data.companyName || '',
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      gstin: data.gstin || '',
      address: data.address || '',
      items: data.items || [],
      subtotal: Number(data.subtotal) || 0,
      discountTotal: Number(data.discountTotal) || 0,
      taxableAmount: Number(data.taxableAmount) || 0,
      gstPercent: Number(data.gstPercent) || 18,
      isInterstate: data.isInterstate ?? false,
      cgst: Number(data.cgst) || 0,
      sgst: Number(data.sgst) || 0,
      igst: Number(data.igst) || 0,
      grandTotal: Number(data.grandTotal) || 0,
      paidAmount: Number(data.paidAmount) || 0,
      balanceDue: data.balanceDue !== undefined ? Number(data.balanceDue) : (Number(data.grandTotal) || 0),
      status: data.status || 'Unpaid',
      paymentTerms: data.paymentTerms || 'Payment due on receipt',
      notes: data.notes || '',
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO invoices (
            id, invoice_number, quotation_number, invoice_date, due_date, client_id, client_name,
            company_name, contact_person, phone, email, gstin, address, items,
            subtotal, discount_total, taxable_amount, gst_percent, is_interstate,
            cgst, sgst, igst, grand_total, paid_amount, balance_due, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newInvoice.id,
            newInvoice.invoiceNumber,
            newInvoice.quotationNumber || null,
            newInvoice.invoiceDate,
            newInvoice.dueDate,
            newInvoice.clientId,
            newInvoice.clientName,
            newInvoice.companyName,
            newInvoice.contactPerson,
            newInvoice.phone,
            newInvoice.email,
            newInvoice.gstin,
            newInvoice.address,
            JSON.stringify(newInvoice.items),
            newInvoice.subtotal,
            newInvoice.discountTotal,
            newInvoice.taxableAmount,
            newInvoice.gstPercent,
            newInvoice.isInterstate ? 1 : 0,
            newInvoice.cgst,
            newInvoice.sgst,
            newInvoice.igst,
            newInvoice.grandTotal,
            newInvoice.paidAmount,
            newInvoice.balanceDue,
            newInvoice.status,
            newInvoice.notes,
          ]
        );
        return newInvoice;
      } catch (err) {
        console.error('MySQL insert invoice error:', err);
        throw err;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.invoices = [newInvoice, ...this.store.invoices];
    this.persistStore();
    return newInvoice;
  }

  public async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const list = await this.getInvoices();
    const existing = list.find((i) => i.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `UPDATE invoices SET
            paid_amount = ?, balance_due = ?, status = ?, notes = ?, due_date = ?
           WHERE id = ?`,
          [updated.paidAmount, updated.balanceDue, updated.status, updated.notes, updated.dueDate, id]
        );
        return updated;
      } catch (e) {
        console.error('MySQL update invoice error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.invoices = this.store.invoices.map((i) => (i.id === id ? updated : i));
    this.persistStore();
    return updated;
  }

  public async deleteInvoice(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM invoices WHERE id = ?', [id]);
        return true;
      } catch (e) {
        console.error('MySQL delete invoice error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.invoices = this.store.invoices.filter((i) => i.id !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // PAYMENTS CRUD
  // -------------------------------------------------------------
  public async getPayments(): Promise<PaymentRecord[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM payments ORDER BY payment_date DESC');
        return rows.map((r: any) => ({
          id: r.id,
          receiptNo: r.receipt_no,
          clientId: r.client_id,
          clientName: r.client_name,
          paymentDate: r.payment_date,
          amount: Number(r.amount),
          paymentMode: r.payment_mode,
          referenceNo: r.reference_no,
          notes: r.notes,
          againstType: r.against_type,
          againstId: r.against_id,
          againstTitle: r.against_title,
        }));
      } catch (e) {
        console.error('MySQL getPayments error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.payments;
  }

  public async createPayment(data: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const id = data.id || `pay-${Date.now()}`;
    const nextNum = (await this.getPayments()).length + 1;
    const receiptNo =
      data.receiptNo ||
      `${this.store.settings.receiptPrefix || 'KLY-RCP-2026-'}${String(nextNum).padStart(4, '0')}`;

    const newPayment: PaymentRecord = {
      id,
      receiptNo,
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      amount: Number(data.amount) || 0,
      paymentMode: data.paymentMode || 'Bank Transfer',
      referenceNo: data.referenceNo || '',
      notes: data.notes || '',
      againstType: data.againstType || 'Direct Advance',
      againstId: data.againstId,
      againstTitle: data.againstTitle || '',
    };

    if (this.isMySQLActive && this.pool) {
      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();

        await conn.query(
          `INSERT INTO payments (
            id, receipt_no, client_id, client_name, payment_date, amount, payment_mode,
            reference_no, notes, against_type, against_id, against_title
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newPayment.id,
            newPayment.receiptNo,
            newPayment.clientId,
            newPayment.clientName,
            newPayment.paymentDate,
            newPayment.amount,
            newPayment.paymentMode,
            newPayment.referenceNo,
            newPayment.notes,
            newPayment.againstType,
            newPayment.againstId || null,
            newPayment.againstTitle,
          ]
        );

        // If against Invoice, adjust invoice balance atomically in same transaction
        if (newPayment.againstType === 'Invoice' && newPayment.againstId) {
          await conn.query(
            `UPDATE invoices
             SET paid_amount = paid_amount + ?,
                 balance_due = GREATEST(0, grand_total - (paid_amount + ?)),
                 status = CASE WHEN (paid_amount + ?) >= grand_total THEN 'Paid' ELSE 'Partially Paid' END
             WHERE id = ?`,
            [newPayment.amount, newPayment.amount, newPayment.amount, newPayment.againstId]
          );
        }

        // If against Purchase, adjust purchase advance & balance atomically in transaction
        if (newPayment.againstType === 'Purchase' && newPayment.againstId) {
          await conn.query(
            `UPDATE purchases
             SET advance_paid = advance_paid + ?,
                 balance_due = GREATEST(0, grand_total - (advance_paid + ?)),
                 payment_status = CASE WHEN (advance_paid + ?) >= grand_total THEN 'Paid' ELSE 'Partial' END
             WHERE id = ?`,
            [newPayment.amount, newPayment.amount, newPayment.amount, newPayment.againstId]
          );
        }

        await conn.commit();
        return newPayment;
      } catch (err) {
        await conn.rollback();
        console.error('MySQL insert payment error:', err);
        throw err;
      } finally {
        conn.release();
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.payments = [newPayment, ...this.store.payments];

    // Maintain in-memory mirror
    if (newPayment.againstType === 'Invoice' && newPayment.againstId) {
      const inv = this.store.invoices.find((i) => i.id === newPayment.againstId);
      if (inv) {
        const newPaid = (inv.paidAmount || 0) + newPayment.amount;
        const newBal = Math.max(0, inv.grandTotal - newPaid);
        inv.paidAmount = newPaid;
        inv.balanceDue = newBal;
        inv.status = newBal <= 0 ? 'Paid' : 'Partially Paid';
      }
    }

    if (newPayment.againstType === 'Purchase' && newPayment.againstId) {
      const pur = this.store.purchases.find((p) => p.id === newPayment.againstId);
      if (pur) {
        const newAdv = (pur.advancePaid || 0) + newPayment.amount;
        const newBal = Math.max(0, pur.grandTotal - newAdv);
        pur.advancePaid = newAdv;
        pur.balanceDue = newBal;
        pur.paymentStatus = newBal <= 0 ? 'Paid' : 'Partial';
      }
    }

    this.persistStore();
    return newPayment;
  }

  public async deletePayment(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM payments WHERE id = ?', [id]);
        return true;
      } catch (e) {
        console.error('MySQL delete payment error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.payments = this.store.payments.filter((p) => p.id !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // RENEWALS CRUD
  // -------------------------------------------------------------
  public async getRenewals(): Promise<RenewalRecord[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM renewals ORDER BY renewal_date ASC');
        return rows.map((r: any) => ({
          id: r.id,
          clientId: r.client_id,
          clientName: r.client_name,
          serviceName: r.service_name,
          domainOrAsset: r.domain_or_asset,
          provider: r.provider,
          purchaseDate: r.purchase_date,
          expiryDate: r.expiry_date,
          renewalDate: r.renewal_date,
          renewalAmount: Number(r.renewal_amount),
          reminderDays: Number(r.reminder_days),
          status: r.status,
          notes: r.notes,
          lastReminderSentDate: r.last_reminder_sent_date,
        }));
      } catch (e) {
        console.error('MySQL getRenewals error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.renewals;
  }

  public async createRenewal(data: Partial<RenewalRecord>): Promise<RenewalRecord> {
    const id = data.id || `ren-${Date.now()}`;
    const newRenewal: RenewalRecord = {
      id,
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      serviceName: data.serviceName || '',
      domainOrAsset: data.domainOrAsset || '',
      provider: data.provider || 'Klyia Technology',
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      expiryDate: data.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      renewalDate: data.renewalDate || data.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      renewalAmount: Number(data.renewalAmount) || 0,
      reminderDays: Number(data.reminderDays) || 30,
      status: data.status || 'Upcoming',
      notes: data.notes || '',
      lastReminderSentDate: data.lastReminderSentDate,
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO renewals (
            id, client_id, client_name, service_name, domain_or_asset, provider,
            purchase_date, expiry_date, renewal_date, renewal_amount, reminder_days,
            status, notes, last_reminder_sent_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newRenewal.id,
            newRenewal.clientId,
            newRenewal.clientName,
            newRenewal.serviceName,
            newRenewal.domainOrAsset,
            newRenewal.provider,
            newRenewal.purchaseDate,
            newRenewal.expiryDate,
            newRenewal.renewalDate,
            newRenewal.renewalAmount,
            newRenewal.reminderDays,
            newRenewal.status,
            newRenewal.notes,
            newRenewal.lastReminderSentDate || null,
          ]
        );
        return newRenewal;
      } catch (err) {
        console.error('MySQL insert renewal error:', err);
        throw err;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.renewals = [newRenewal, ...this.store.renewals];
    this.persistStore();
    return newRenewal;
  }

  public async updateRenewal(id: string, updates: Partial<RenewalRecord>): Promise<RenewalRecord | null> {
    const list = await this.getRenewals();
    const existing = list.find((r) => r.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `UPDATE renewals SET
            service_name = ?, renewal_date = ?, expiry_date = ?, renewal_amount = ?,
            status = ?, reminder_days = ?, notes = ?, last_reminder_sent_date = ?
           WHERE id = ?`,
          [
            updated.serviceName,
            updated.renewalDate,
            updated.expiryDate,
            updated.renewalAmount,
            updated.status,
            updated.reminderDays,
            updated.notes,
            updated.lastReminderSentDate || null,
            id,
          ]
        );
        return updated;
      } catch (e) {
        console.error('MySQL update renewal error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.renewals = this.store.renewals.map((r) => (r.id === id ? updated : r));
    this.persistStore();
    return updated;
  }

  public async deleteRenewal(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM renewals WHERE id = ?', [id]);
        return true;
      } catch (e) {
        console.error('MySQL delete renewal error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.renewals = this.store.renewals.filter((r) => r.id !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // EXPENSES CRUD
  // -------------------------------------------------------------
  public async getExpenses(): Promise<ExpenseRecord[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM expenses ORDER BY date DESC');
        return rows.map((r: any) => ({
          id: r.id,
          expenseId: r.expense_id,
          date: r.date,
          category: r.category,
          customCategory: r.custom_category,
          amount: Number(r.amount),
          gstAmount: Number(r.gst_amount || 0),
          paymentMode: r.payment_mode,
          vendor: r.vendor,
          billInvoiceNumber: r.invoice_ref || r.bill_invoice_number,
          isRecurring: Boolean(r.is_recurring),
          recurringFrequency: r.recurring_period as any,
          nextDueDate: r.next_due_date,
          description: r.description,
          notes: r.notes,
        }));
      } catch (e) {
        console.error('MySQL getExpenses error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.expenses;
  }

  public async createExpense(data: Partial<ExpenseRecord>): Promise<ExpenseRecord> {
    const id = data.id || `exp-${Date.now()}`;
    const nextNum = (await this.getExpenses()).length + 1;
    const expenseId = data.expenseId || `KLY-EXP-${String(nextNum).padStart(3, '0')}`;

    const newExpense: ExpenseRecord = {
      id,
      expenseId,
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'Hosting',
      customCategory: data.customCategory,
      amount: Number(data.amount) || 0,
      gstAmount: Number(data.gstAmount) || 0,
      paymentMode: data.paymentMode || 'UPI',
      vendor: data.vendor || '',
      billInvoiceNumber: data.billInvoiceNumber,
      isRecurring: data.isRecurring ?? false,
      recurringFrequency: data.recurringFrequency || 'Monthly',
      nextDueDate: data.nextDueDate,
      description: data.description || '',
      notes: data.notes,
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO expenses (
            id, expense_id, date, category, amount, payment_mode, vendor,
            invoice_ref, is_recurring, recurring_period, next_due_date, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newExpense.id,
            newExpense.expenseId,
            newExpense.date,
            newExpense.category,
            newExpense.amount,
            newExpense.paymentMode,
            newExpense.vendor,
            newExpense.billInvoiceNumber || null,
            newExpense.isRecurring ? 1 : 0,
            newExpense.recurringFrequency || null,
            newExpense.nextDueDate || null,
            newExpense.description,
          ]
        );
        return newExpense;
      } catch (err) {
        console.error('MySQL insert expense error:', err);
        throw err;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.expenses = [newExpense, ...this.store.expenses];
    this.persistStore();
    return newExpense;
  }

  public async updateExpense(id: string, updates: Partial<ExpenseRecord>): Promise<ExpenseRecord | null> {
    const list = await this.getExpenses();
    const existing = list.find((e) => e.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `UPDATE expenses SET
            category = ?, amount = ?, payment_mode = ?, vendor = ?, description = ?,
            is_recurring = ?, recurring_period = ?, next_due_date = ?
           WHERE id = ?`,
          [
            updated.category,
            updated.amount,
            updated.paymentMode,
            updated.vendor,
            updated.description,
            updated.isRecurring ? 1 : 0,
            updated.recurringFrequency || null,
            updated.nextDueDate || null,
            id,
          ]
        );
        return updated;
      } catch (e) {
        console.error('MySQL update expense error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.expenses = this.store.expenses.map((e) => (e.id === id ? updated : e));
    this.persistStore();
    return updated;
  }

  public async deleteExpense(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM expenses WHERE id = ?', [id]);
        return true;
      } catch (e) {
        console.error('MySQL delete expense error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.expenses = this.store.expenses.filter((e) => e.id !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // DIGITAL ASSETS CRUD
  // -------------------------------------------------------------
  public async getDigitalAssets(): Promise<DigitalAsset[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM digital_assets ORDER BY renewal_date ASC');
        return rows.map((r: any) => ({
          id: r.id,
          assetName: r.asset_name,
          serviceType: r.service_type,
          clientId: r.client_id,
          clientName: r.client_name,
          provider: r.provider,
          accountReference: r.login_url || r.account_reference,
          purchaseDate: r.purchase_date || new Date().toISOString().split('T')[0],
          expiryDate: r.expiry_date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          renewalDate: r.renewal_date,
          costPrice: Number(r.cost_price),
          sellingPrice: Number(r.selling_price),
          status: r.status,
          notes: r.notes,
        }));
      } catch (e) {
        console.error('MySQL getDigitalAssets error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.assets;
  }

  public async createDigitalAsset(data: Partial<DigitalAsset>): Promise<DigitalAsset> {
    const id = data.id || `asset-${Date.now()}`;
    const newAsset: DigitalAsset = {
      id,
      assetName: data.assetName || '',
      serviceType: data.serviceType || 'Domain',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      provider: data.provider || 'Hostinger',
      customProvider: data.customProvider,
      accountReference: data.accountReference,
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      expiryDate: data.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      renewalDate: data.renewalDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      costPrice: Number(data.costPrice) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      status: data.status || 'Active',
      notes: data.notes,
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO digital_assets (
            id, asset_name, service_type, client_id, client_name, provider,
            login_url, renewal_date, cost_price, selling_price, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newAsset.id,
            newAsset.assetName,
            newAsset.serviceType,
            newAsset.clientId,
            newAsset.clientName,
            newAsset.provider,
            newAsset.accountReference || null,
            newAsset.renewalDate,
            newAsset.costPrice,
            newAsset.sellingPrice,
            newAsset.status,
            newAsset.notes || null,
          ]
        );
        return newAsset;
      } catch (err) {
        console.error('MySQL insert asset error:', err);
        throw err;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.assets = [newAsset, ...this.store.assets];
    this.persistStore();
    return newAsset;
  }

  public async updateDigitalAsset(id: string, updates: Partial<DigitalAsset>): Promise<DigitalAsset | null> {
    const list = await this.getDigitalAssets();
    const existing = list.find((a) => a.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `UPDATE digital_assets SET
            asset_name = ?, service_type = ?, provider = ?, renewal_date = ?,
            cost_price = ?, selling_price = ?, status = ?, notes = ?
           WHERE id = ?`,
          [
            updated.assetName,
            updated.serviceType,
            updated.provider,
            updated.renewalDate,
            updated.costPrice,
            updated.sellingPrice,
            updated.status,
            updated.notes || null,
            id,
          ]
        );
        return updated;
      } catch (e) {
        console.error('MySQL update asset error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.assets = this.store.assets.map((a) => (a.id === id ? updated : a));
    this.persistStore();
    return updated;
  }

  public async deleteDigitalAsset(id: string): Promise<boolean> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM digital_assets WHERE id = ?', [id]);
        return true;
      } catch (e) {
        console.error('MySQL delete asset error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.assets = this.store.assets.filter((a) => a.id !== id);
    this.persistStore();
    return true;
  }

  // -------------------------------------------------------------
  // COMPANY SETTINGS CRUD
  // -------------------------------------------------------------
  public async getSettings(): Promise<CompanySettings> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM company_settings WHERE id = 1');
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            companyName: r.company_name,
            tagline: r.tagline,
            phone: r.phone,
            whatsapp: r.whatsapp,
            email: r.email,
            website: r.website,
            gstin: r.gstin,
            pan: r.pan,
            address: r.address,
            area: r.area,
            city: r.city,
            state: r.state,
            pincode: r.pincode,
            country: r.country,
            bankName: r.bank_name,
            accountHolder: r.account_holder,
            accountNumber: r.account_number,
            ifscCode: r.ifsc_code,
            branch: r.branch,
            upiId: r.upi_id,
            logoUrl: r.logo_url,
            quotationPrefix: r.quotation_prefix,
            invoicePrefix: r.invoice_prefix,
            receiptPrefix: r.receipt_prefix,
            clientPrefix: r.client_prefix,
            quotationValidityDays: r.quotation_validity_days,
            watermarkEnabled: true,
            watermarkText: r.company_name,
            watermarkOpacity: 0.05,
            defaultGstPercent: Number(r.default_gst_percent) || 18,
            quotationTerms: typeof r.quotation_terms === 'string' ? JSON.parse(r.quotation_terms) : r.quotation_terms || [],
            serviceCategories: typeof r.service_categories === 'string' ? JSON.parse(r.service_categories) : r.service_categories || [],
            expenseCategories: typeof r.expense_categories === 'string' ? JSON.parse(r.expense_categories) : r.expense_categories || [],
          };
        }
      } catch (e) {
        console.error('MySQL getSettings error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.settings;
  }

  public async updateSettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    const updated = { ...this.store.settings, ...updates };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO company_settings (
            id, company_name, tagline, phone, whatsapp, email, website, gstin, pan,
            address, area, city, state, pincode, country, bank_name, account_holder,
            account_number, ifsc_code, branch, upi_id, logo_url, quotation_prefix,
            invoice_prefix, receipt_prefix, client_prefix, quotation_validity_days,
            default_gst_percent, quotation_terms, service_categories, expense_categories
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            company_name = VALUES(company_name), tagline = VALUES(tagline), phone = VALUES(phone),
            whatsapp = VALUES(whatsapp), email = VALUES(email), website = VALUES(website),
            gstin = VALUES(gstin), pan = VALUES(pan), address = VALUES(address),
            area = VALUES(area), city = VALUES(city), state = VALUES(state), pincode = VALUES(pincode),
            country = VALUES(country), bank_name = VALUES(bank_name), account_holder = VALUES(account_holder),
            account_number = VALUES(account_number), ifsc_code = VALUES(ifsc_code), branch = VALUES(branch),
            upi_id = VALUES(upi_id), logo_url = VALUES(logo_url), quotation_prefix = VALUES(quotation_prefix),
            invoice_prefix = VALUES(invoice_prefix), receipt_prefix = VALUES(receipt_prefix),
            client_prefix = VALUES(client_prefix), quotation_validity_days = VALUES(quotation_validity_days),
            default_gst_percent = VALUES(default_gst_percent), quotation_terms = VALUES(quotation_terms),
            service_categories = VALUES(service_categories), expense_categories = VALUES(expense_categories)`,
          [
            updated.companyName,
            updated.tagline,
            updated.phone,
            updated.whatsapp,
            updated.email,
            updated.website,
            updated.gstin,
            updated.pan,
            updated.address,
            updated.area,
            updated.city,
            updated.state,
            updated.pincode,
            updated.country,
            updated.bankName,
            updated.accountHolder,
            updated.accountNumber,
            updated.ifscCode,
            updated.branch,
            updated.upiId,
            updated.logoUrl,
            updated.quotationPrefix,
            updated.invoicePrefix,
            updated.receiptPrefix,
            updated.clientPrefix,
            updated.quotationValidityDays,
            updated.defaultGstPercent,
            JSON.stringify(updated.quotationTerms),
            JSON.stringify(updated.serviceCategories),
            JSON.stringify(updated.expenseCategories),
          ]
        );
        return updated;
      } catch (e) {
        console.error('MySQL updateSettings error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.settings = updated;
    this.persistStore();
    return updated;
  }

  // -------------------------------------------------------------
  // ACTIVITY LOGS
  // -------------------------------------------------------------
  public async getLogs(): Promise<ActivityLog[]> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200');
        return rows.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp,
          action: r.action,
          details: r.details,
          userName: r.user_name,
          userRole: (r.user_role as UserRole) || 'Admin',
          entityType: r.entity_type,
          entityId: r.entity_id,
        }));
      } catch (e) {
        console.error('MySQL getLogs error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }
    return this.store.logs;
  }

  public async createLog(data: Partial<ActivityLog>): Promise<ActivityLog> {
    const id = data.id || `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id,
      timestamp: data.timestamp || new Date().toISOString(),
      action: data.action || '',
      details: data.details || '',
      userName: data.userName || 'Viru Patel',
      userRole: data.userRole || 'Admin',
      entityType: data.entityType || 'Client',
      entityId: data.entityId,
    };

    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO activity_logs (id, timestamp, action, details, user_name, entity_type, entity_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newLog.id, newLog.timestamp, newLog.action, newLog.details, newLog.userName, newLog.entityType, newLog.entityId || null]
        );
        return newLog;
      } catch (e) {
        console.error('MySQL createLog error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store.logs = [newLog, ...this.store.logs.slice(0, 199)];
    this.persistStore();
    return newLog;
  }

  // -------------------------------------------------------------
  // EXPORT / IMPORT / RESET
  // -------------------------------------------------------------
  public async exportAll(): Promise<ServerDataStore> {
    return {
      settings: await this.getSettings(),
      clients: await this.getClients(true),
      purchases: await this.getPurchases(),
      payments: await this.getPayments(),
      renewals: await this.getRenewals(),
      quotations: await this.getQuotations(),
      invoices: await this.getInvoices(),
      expenses: await this.getExpenses(),
      assets: await this.getDigitalAssets(),
      logs: await this.getLogs(),
      users: (this.store.users || []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password_hash: '', // Never expose password hashes in exports
        role: u.role,
        status: u.status,
      })),
      sessions: [],
      passwordResets: [],
    };
  }

  public async importAll(data: any): Promise<boolean> {
    if (!data || typeof data !== 'object') return false;

    if (this.isMySQLActive && this.pool) {
      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE payments');
        await conn.query('TRUNCATE TABLE invoices');
        await conn.query('TRUNCATE TABLE quotations');
        await conn.query('TRUNCATE TABLE renewals');
        await conn.query('TRUNCATE TABLE purchases');
        await conn.query('TRUNCATE TABLE expenses');
        await conn.query('TRUNCATE TABLE digital_assets');
        await conn.query('TRUNCATE TABLE clients');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error('MySQL truncate error on import:', e);
        throw e;
      } finally {
        conn.release();
      }

      if (data.settings) await this.updateSettings(data.settings);
      if (Array.isArray(data.clients)) {
        for (const client of data.clients) await this.createClient(client);
      }
      if (Array.isArray(data.purchases)) {
        for (const pur of data.purchases) await this.createPurchase(pur);
      }
      if (Array.isArray(data.quotations)) {
        for (const qtn of data.quotations) await this.createQuotation(qtn);
      }
      if (Array.isArray(data.invoices)) {
        for (const inv of data.invoices) await this.createInvoice(inv);
      }
      if (Array.isArray(data.payments)) {
        for (const pay of data.payments) await this.createPayment(pay);
      }
      if (Array.isArray(data.renewals)) {
        for (const ren of data.renewals) await this.createRenewal(ren);
      }
      if (Array.isArray(data.expenses)) {
        for (const exp of data.expenses) await this.createExpense(exp);
      }
      if (Array.isArray(data.assets)) {
        for (const asset of data.assets) await this.createDigitalAsset(asset);
      }
      return true;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    if (data.settings) this.store.settings = data.settings;
    if (Array.isArray(data.clients)) this.store.clients = data.clients;
    if (Array.isArray(data.purchases)) this.store.purchases = data.purchases;
    if (Array.isArray(data.payments)) this.store.payments = data.payments;
    if (Array.isArray(data.renewals)) this.store.renewals = data.renewals;
    if (Array.isArray(data.quotations)) this.store.quotations = data.quotations;
    if (Array.isArray(data.invoices)) this.store.invoices = data.invoices;
    if (Array.isArray(data.expenses)) this.store.expenses = data.expenses;
    if (Array.isArray(data.assets)) this.store.assets = data.assets;
    if (Array.isArray(data.logs)) this.store.logs = data.logs;

    this.persistStore();
    return true;
  }

  public async resetSample(): Promise<void> {
    const initial = loadInitialStore();

    if (this.isMySQLActive && this.pool) {
      const conn = await this.pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE payments');
        await conn.query('TRUNCATE TABLE invoices');
        await conn.query('TRUNCATE TABLE quotations');
        await conn.query('TRUNCATE TABLE renewals');
        await conn.query('TRUNCATE TABLE purchases');
        await conn.query('TRUNCATE TABLE expenses');
        await conn.query('TRUNCATE TABLE digital_assets');
        await conn.query('TRUNCATE TABLE clients');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error('MySQL truncate error on reset:', e);
        throw e;
      } finally {
        conn.release();
      }

      await this.updateSettings(initial.settings);
      for (const client of initial.clients) await this.createClient(client);
      for (const pur of initial.purchases) await this.createPurchase(pur);
      for (const qtn of initial.quotations) await this.createQuotation(qtn);
      for (const inv of initial.invoices) await this.createInvoice(inv);
      for (const pay of initial.payments) await this.createPayment(pay);
      for (const ren of initial.renewals) await this.createRenewal(ren);
      for (const exp of initial.expenses) await this.createExpense(exp);
      for (const asset of initial.assets) await this.createDigitalAsset(asset);
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.store = initial;
    this.persistStore();
  }

  // -------------------------------------------------------------
  // USER & AUTHENTICATION MANAGEMENT
  // -------------------------------------------------------------
  public async getUserByIdentifier(identifier: string): Promise<any | null> {
    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) return null;

    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query(
          'SELECT id, name, email, password_hash, role, status FROM users WHERE LOWER(email) = ? OR id = ? OR LOWER(name) = ? LIMIT 1',
          [clean, identifier.trim(), clean]
        );
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (e) {
        console.error('MySQL getUserByIdentifier error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    this.checkFileStoreSync();
    const found = this.store.users?.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.id === identifier.trim() ||
        u.name.toLowerCase() === clean
    );
    return found || null;
  }

  public async updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
    const clean = (email || '').trim().toLowerCase();
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE LOWER(email) = ?',
          [passwordHash, clean]
        );
      } catch (e) {
        console.error('MySQL updateUserPassword error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production' && !this.isMySQLActive) {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    if (Array.isArray(this.store.users)) {
      const user = this.store.users.find((u) => u.email.toLowerCase() === clean);
      if (user) {
        user.password_hash = passwordHash;
        this.persistStore();
      }
    }
    return true;
  }

  public async createSessionRecord(session: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO user_sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            session.id,
            session.userId,
            session.tokenHash,
            session.ipAddress || null,
            session.userAgent || null,
            session.expiresAt,
          ]
        );
        return;
      } catch (e) {
        console.error('MySQL createSessionRecord error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    if (!Array.isArray(this.store.sessions)) {
      this.store.sessions = [];
    }
    // Prune expired
    const now = Date.now();
    this.store.sessions = this.store.sessions.filter(
      (s) => new Date(s.expires_at).getTime() > now
    );
    this.store.sessions.push({
      id: session.id,
      user_id: session.userId,
      token_hash: session.tokenHash,
      ip_address: session.ipAddress,
      user_agent: session.userAgent,
      expires_at: session.expiresAt.toISOString(),
    });
    this.persistStore();
  }

  public async getSessionByTokenHash(tokenHash: string): Promise<any | null> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query(
          `SELECT s.id as session_id, s.expires_at, s.user_id, u.name, u.email, u.role, u.status
           FROM user_sessions s
           JOIN users u ON s.user_id = u.id
           WHERE s.token_hash = ? AND s.expires_at > NOW()`,
          [tokenHash]
        );
        if (rows && rows.length > 0) {
          return rows[0];
        }
        return null;
      } catch (e) {
        console.error('MySQL getSessionByTokenHash error:', e);
      }
    }

    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    this.checkFileStoreSync();
    if (!Array.isArray(this.store.sessions)) return null;
    const now = Date.now();
    const session = this.store.sessions.find(
      (s) => s.token_hash === tokenHash && new Date(s.expires_at).getTime() > now
    );
    if (!session) return null;

    const user = this.store.users?.find((u) => u.id === session.user_id);
    if (!user) return null;

    return {
      session_id: session.id,
      expires_at: session.expires_at,
      user_id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  public async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);
      } catch (e) {
        console.error('MySQL deleteSessionByTokenHash error:', e);
      }
    }

    if (Array.isArray(this.store.sessions)) {
      this.store.sessions = this.store.sessions.filter((s) => s.token_hash !== tokenHash);
      this.persistStore();
    }
  }

  public async deleteSessionsByUserId(userId: string): Promise<void> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
      } catch (e) {
        console.error('MySQL deleteSessionsByUserId error:', e);
      }
    }

    if (Array.isArray(this.store.sessions)) {
      this.store.sessions = this.store.sessions.filter((s) => s.user_id !== userId);
      this.persistStore();
    }
  }

  public async createPasswordResetRecord(
    email: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    const clean = (email || '').trim().toLowerCase();
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('UPDATE password_resets SET used = 1 WHERE LOWER(email) = ?', [clean]);
        await this.pool.query(
          'INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)',
          [clean, tokenHash, expiresAt]
        );
        return;
      } catch (e) {
        console.error('MySQL createPasswordResetRecord error:', e);
        throw e;
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Database Error] MySQL pool is disconnected in production mode.');
    }

    if (!Array.isArray(this.store.passwordResets)) {
      this.store.passwordResets = [];
    }
    // Mark previous as used
    this.store.passwordResets.forEach((r) => {
      if (r.email.toLowerCase() === clean) {
        r.used = 1;
      }
    });
    this.store.passwordResets.push({
      id: Date.now(),
      email: clean,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      used: 0,
    });
    this.persistStore();
  }

  public async getPasswordResetByTokenHash(tokenHash: string): Promise<any | null> {
    if (this.isMySQLActive && this.pool) {
      try {
        const [rows]: any = await this.pool.query(
          'SELECT id, email, token_hash, expires_at, used FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
          [tokenHash]
        );
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (e) {
        console.error('MySQL getPasswordResetByTokenHash error:', e);
      }
    }

    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    this.checkFileStoreSync();
    if (!Array.isArray(this.store.passwordResets)) return null;
    const now = Date.now();
    const record = this.store.passwordResets.find(
      (r) =>
        r.token_hash === tokenHash &&
        !r.used &&
        new Date(r.expires_at).getTime() > now
    );
    return record || null;
  }

  public async markPasswordResetUsed(id: number): Promise<void> {
    if (this.isMySQLActive && this.pool) {
      try {
        await this.pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [id]);
      } catch (e) {
        console.error('MySQL markPasswordResetUsed error:', e);
      }
    }

    if (Array.isArray(this.store.passwordResets)) {
      const record = this.store.passwordResets.find((r) => r.id === id);
      if (record) {
        record.used = 1;
        this.persistStore();
      }
    }
  }
}

export const db = new DatabaseManager();
