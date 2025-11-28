/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SavedDesign } from "./types";

// --- START: SUPABASE CONFIGURATION ---
// Configuration updated to point to the shared Supabase project for the ecosystem.
const supabaseUrl = "https://gjbrjysuqdvvqlxklvos.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqYnJqeXN1cWR2dnFseGtsdm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTQ3MTAsImV4cCI6MjA3NzI3MDcxMH0.YN3BuI6f39P4Vl3yF6nFlMYnbBEu47dpTwmyjDsMfKg";
// --- END: SUPABASE CONFIGURATION ---


// Declare module-level variables.
let supabase: SupabaseClient | null = null;
let supabaseError: string | null = null;
let geminiError: string | null = null;

// Check if the Gemini config key is provided
if (!process.env.API_KEY) {
    geminiError = "Gemini API Key is missing. Please provide it as an environment variable named API_KEY to enable AI features.";
}

// Check if the Supabase config keys are provided
if (!supabaseUrl || !supabaseAnonKey) {
    supabaseError = "Supabase configuration is missing. Please provide SUPABASE_URL and SUPABASE_ANON_KEY environment variables.";
} else {
    try {
      // Initialize Supabase
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log("Supabase initialized successfully.");

    } catch (e) {
      supabaseError = e instanceof Error ? e.message : String(e);
      console.error("Supabase initialization failed:", supabaseError);
      // Ensure supabase is null on failure
      supabase = null;
    }
}


/**
 * Uploads a design image to Supabase Storage and saves its metadata to the database.
 * @param designFile The image file of the design.
 * @param name The user-provided name for the design.
 * @param prompt The AI prompt used to generate the design, if any.
 * @returns The new SavedDesign object from the database.
 */
export const uploadDesign = async (designFile: File, name: string, prompt: string | null): Promise<SavedDesign> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be logged in to save a design.");

    const fileExt = designFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('designs')
        .upload(filePath, designFile);

    if (uploadError) {
        console.error("Error uploading to Supabase Storage:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 2. Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(filePath);

    if (!publicUrl) {
        throw new Error("Could not get public URL for the uploaded file.");
    }
    
    // 3. Insert metadata into the 'saved_designs' table
    const { data, error: insertError } = await supabase
        .from('saved_designs')
        .insert({
            user_id: user.id,
            name,
            storage_path: filePath,
            thumbnail_url: publicUrl, // Using publicUrl as thumbnail for simplicity
            generation_prompt: prompt,
        })
        .select()
        .single();
    
    if (insertError) {
        console.error("Error inserting into Supabase DB:", insertError);
        // Attempt to clean up the orphaned storage file
        await supabase.storage.from('designs').remove([filePath]);
        throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // Map the database response to our SavedDesign type
    return {
        id: data.id,
        name: data.name,
        dataUrl: data.thumbnail_url, // This is the main public URL
        storagePath: data.storage_path,
        prompt: data.generation_prompt
    };
};

/**
 * Fetches all saved designs for the currently logged-in user.
 * @returns A promise that resolves to an array of SavedDesign objects.
 */
export const fetchDesigns = async (): Promise<SavedDesign[]> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase
        .from('saved_designs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching designs:", error);
        throw error;
    }
    
    // Map the database response to our local SavedDesign type
    return data.map(d => ({
        id: d.id,
        name: d.name,
        dataUrl: d.thumbnail_url,
        storagePath: d.storage_path,
        prompt: d.generation_prompt,
    }));
};

/**
 * Deletes a saved design from both the database and Supabase Storage.
 * @param design The SavedDesign object to delete.
 */
export const deleteDesign = async (design: SavedDesign): Promise<void> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    if (!design.storagePath) throw new Error("Cannot delete design without a storage path.");

    // 1. Delete from storage
    const { error: storageError } = await supabase.storage
        .from('designs')
        .remove([design.storagePath]);

    if (storageError) {
        console.error("Error deleting from storage:", storageError);
        // Decide if you want to proceed with DB deletion or stop
    }

    // 2. Delete from database
    const { error: dbError } = await supabase
        .from('saved_designs')
        .delete()
        .match({ id: design.id });
    
    if (dbError) {
        console.error("Error deleting from database:", dbError);
        throw dbError;
    }
};


export { supabase, supabaseError, geminiError };