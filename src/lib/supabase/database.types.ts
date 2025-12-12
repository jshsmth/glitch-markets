export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			users: {
				Row: {
					/** UUID from auth.users - the Supabase Auth user ID */
					id: string;
					email: string | null;
					server_wallet_address: string | null;
					server_wallet_id: string | null;
					encrypted_server_key_shares: string | null;
					server_wallet_public_key: string | null;
					created_at: string;
					last_login_at: string;
				};
				Insert: {
					/** Must match the authenticated user's auth.uid() */
					id: string;
					email?: string | null;
					server_wallet_address?: string | null;
					server_wallet_id?: string | null;
					encrypted_server_key_shares?: string | null;
					server_wallet_public_key?: string | null;
					created_at?: string;
					last_login_at?: string;
				};
				Update: {
					id?: string;
					email?: string | null;
					server_wallet_address?: string | null;
					server_wallet_id?: string | null;
					encrypted_server_key_shares?: string | null;
					server_wallet_public_key?: string | null;
					created_at?: string;
					last_login_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'users_id_fkey';
						columns: ['id'];
						isOneToOne: true;
						referencedRelation: 'users';
						referencedColumns: ['id'];
						/** References auth.users table in Supabase */
					}
				];
			};
			polymarket_credentials: {
				Row: {
					id: string;
					/** UUID foreign key to users.id (which references auth.users.id) */
					user_id: string;
					wallet_address: string;
					proxy_wallet_address: string;
					encrypted_api_key: string;
					encrypted_secret: string;
					encrypted_passphrase: string;
					created_at: string;
					last_used_at: string | null;
				};
				Insert: {
					id?: string;
					/** Must match the authenticated user's auth.uid() */
					user_id: string;
					wallet_address: string;
					proxy_wallet_address: string;
					encrypted_api_key: string;
					encrypted_secret: string;
					encrypted_passphrase: string;
					created_at?: string;
					last_used_at?: string | null;
				};
				Update: {
					id?: string;
					user_id?: string;
					wallet_address?: string;
					proxy_wallet_address?: string;
					encrypted_api_key?: string;
					encrypted_secret?: string;
					encrypted_passphrase?: string;
					created_at?: string;
					last_used_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'polymarket_credentials_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
}

export type Tables<
	PublicTableNameOrOptions extends
		| keyof (Database['public']['Tables'] & Database['public']['Views'])
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
				Database[PublicTableNameOrOptions['schema']]['Views'])
		: never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
			Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
				Database['public']['Views'])
		? (Database['public']['Tables'] &
				Database['public']['Views'])[PublicTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
		: never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: PublicTableNameOrOptions extends keyof Database['public']['Tables']
		? Database['public']['Tables'][PublicTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	PublicTableNameOrOptions extends keyof Database['public']['Tables'] | { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
		: never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: PublicTableNameOrOptions extends keyof Database['public']['Tables']
		? Database['public']['Tables'][PublicTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	PublicEnumNameOrOptions extends keyof Database['public']['Enums'] | { schema: keyof Database },
	EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
		: never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
	? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
	: PublicEnumNameOrOptions extends keyof Database['public']['Enums']
		? Database['public']['Enums'][PublicEnumNameOrOptions]
		: never;
