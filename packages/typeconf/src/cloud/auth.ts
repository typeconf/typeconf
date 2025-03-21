import { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "./client.js";
import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

export type AuthSuccessResult = { user: User, session: Session };

export async function tryPerformAuthWithSessionFile(): Promise<AuthSuccessResult | undefined> {
    // Check for existing session in ~/.typeconf/session
    const sessionPath = join(homedir(), '.typeconf', 'session');
    
    try {
        if (existsSync(sessionPath)) {
            const sessionData = JSON.parse(readFileSync(sessionPath, 'utf8'));
            
            if (sessionData.access_token && sessionData.refresh_token) {
                const { data: { session }, error } = await supabase().auth.setSession({
                    access_token: sessionData.access_token,
                    refresh_token: sessionData.refresh_token
                });

                if (!error && session) {
                    return { user: session.user, session };
                }
            }
        }
    } catch (err) {
        // Ignore errors reading session file
        console.debug('Error reading session file:', err);
    }

    return undefined
}

export async function signIn(email: string, password: string): Promise<AuthSuccessResult | AuthError> {
    const auth = await supabase().auth.signInWithPassword({
        email,
        password
    })

    if (auth.error) {
        return auth.error
    } 

    // Save session to file for future use
    const sessionDir = join(homedir(), '.typeconf');
    const sessionPath = join(sessionDir, 'session');

    // Create .typeconf directory if it doesn't exist
    if (!existsSync(sessionDir)) {
        mkdirSync(sessionDir, { recursive: true });
    }

    // Write session data
    writeFileSync(sessionPath, JSON.stringify({
        access_token: auth.data.session.access_token,
        refresh_token: auth.data.session.refresh_token
    }));

    console.log('Session saved to', sessionPath);
    
    return { user: auth.data.user, session: auth.data.session }
}