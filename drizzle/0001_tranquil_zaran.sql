CREATE TABLE "polymarket_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"wallet_address" text NOT NULL,
	"encrypted_api_key" text NOT NULL,
	"encrypted_secret" text NOT NULL,
	"encrypted_passphrase" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "polymarket_credentials_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"wallet_address" text,
	"server_wallet_address" text,
	"server_wallet_id" text,
	"encrypted_server_key_shares" text,
	"server_wallet_public_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
ALTER TABLE "polymarket_credentials" ADD CONSTRAINT "polymarket_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;