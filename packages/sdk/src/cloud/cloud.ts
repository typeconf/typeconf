import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types.js";
import { validate as uuidValidate } from 'uuid';

export interface TypeconfCloudClient {
    init(options: TypeconfCloudClientInitOptions): Promise<Error | undefined>;
    readConfig<T>(configName: string, projectNameOrId?: string): Promise<{ config?: T, err?: Error }>;
}

export interface TypeconfCloudClientInitOptions {
    email?: string; // If not provided, email will be read from environment variable TYPECONF_CLOUD_EMAIL
    password?: string; // If not provided, password will be read from environment variable TYPECONF_CLOUD_PASSWORD
    defaultProject?: string; // If not provided, project will be read from environment variable TYPECONF_CLOUD_PROJECT
}

const CLOUD_URL = "https://sfcheddgbldthfcxoaqn.supabase.co";
const CLOUD_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmY2hlZGRnYmxkdGhmY3hvYXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3OTM1MzgsImV4cCI6MjA0NzM2OTUzOH0.pErXNTPwqK71LA-mC3tfZdPtE8rYySyaOo1czW-MpEs";

class TypeconfCloudClientImpl implements TypeconfCloudClient {
    private supabase: ReturnType<typeof createClient<Database>>;
    private defaultProject: string | undefined;

    constructor() {
        this.supabase = createClient<Database>(CLOUD_URL, CLOUD_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
            global: {
                fetch: (url: any, options = {}) => {
                return fetch(url, {
                    ...options,
                    // https://github.com/orgs/supabase/discussions/20022
                    /* @ts-ignore */
                    cache: 'no-store',
                 });
                }
            }
        });
    }

    private async getProjectByNameOrId(project: string): Promise<Database['public']['Tables']['projects']['Row']> {
        let loadByIdOrName = async () => {
            return await this.supabase
                .from('projects')
                .select()
                .or(`name.eq."${project}",id.eq."${project}"`)
                .maybeSingle()
        }
    
        let loadByName = async () => {
            return await this.supabase
                .from('projects')
                .select()
                .eq("name", project)
                .maybeSingle()
        }
    
        const { data: projectData, error } = uuidValidate(project) ? await loadByIdOrName() : await loadByName()
    
        if (error) {
            throw new Error(`Failed to get project ${project}: ${error.message}`, { cause: error })
        }
    
        if (!projectData) {
            throw new Error(`Project '${project}' not found`)
        }
    
        return projectData
    }
    
    private async getConfigValue(configName: string, projectId: string): Promise<any> {
        const { data, error } = await this.supabase
            .from('config_values')
            .select(`
                value,
                project_configs!inner (
                    id
                )
            `)
            .eq('project_configs.project', projectId)
            .eq('project_configs.name', configName)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle()
    
        if (error) {
            throw error
        }
    
        if (!data) {
            throw new Error('Config value not found')
        }
    
        return JSON.parse(data.value as string)
    }

    public async init(options: TypeconfCloudClientInitOptions): Promise<Error | undefined> {
        const email = options.email ?? process.env.TYPECONF_CLOUD_EMAIL;
        const password = options.password ?? process.env.TYPECONF_CLOUD_PASSWORD;
        this.defaultProject = options.defaultProject ?? process.env.TYPECONF_CLOUD_PROJECT;

        if (!email || !password) {
            throw new Error('Email, password and project are required')
        }

        const auth = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password
        })

        if (auth.error) {
            return new Error(`Failed to sign in to Typeconf Cloud: ${auth.error.message}`);
        }
    }

    public async readConfig<T>(configName: string, projectNameOrId?: string): Promise<{ config?: T, err?: Error }> {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (!session) {
            const error = await this.init({})
            if (error) {
                throw new Error('Not authenticated: ' + error.message)
            }
        }

        if (!projectNameOrId) {
            projectNameOrId = this.defaultProject;
        }

        if (!projectNameOrId) {
            throw new Error('Project name or id is required when default project is not set')
        }

        try {
            const project = await this.getProjectByNameOrId(projectNameOrId)
            const res = await this.getConfigValue(configName, project.id);

            return {
                config: res as T,
                err: undefined
            }
        } catch (err) {
            const error = err as Error;
            return {
                config: undefined,
                err: new Error(`Failed to read config ${configName} from Typeconf Cloud: ${error.message}`)
            }
        }
    }
}

let _typeconfCloud: TypeconfCloudClient | undefined;
export const typeconfCloud = () => {
    if (!_typeconfCloud) {
        _typeconfCloud = new TypeconfCloudClientImpl();
    }
    return _typeconfCloud;
};

export const isCloudEnabled = () => {
    return process.env.TYPECONF_CLOUD_EMAIL;
}
