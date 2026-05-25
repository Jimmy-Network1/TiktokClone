import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlfrpmdxzedlahrifujf.supabase.co';
const supabaseAnonKey = 'sb_publishable__q4QneBE1NHoBhLG7SvwPQ_S6WA47ms';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
