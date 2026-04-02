/*  The purpose of this script is to run the authentication page on every load
*   Meaning, if there is no active session, the user ges re-directed to the login page immediately
*/
import { supabase } from "./supabaseClient";

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
    document.body.style.display = "none";
    window.location.replace("/auth.html");
}