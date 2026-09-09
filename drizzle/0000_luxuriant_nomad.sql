CREATE TYPE "public"."account" AS ENUM('roth_ira', 'brokerage', 'hysa', 'coinbase', 'checking');--> statement-breakpoint
CREATE TYPE "public"."cash_bucket" AS ENUM('hysa_tax', 'hysa_emergency', 'hysa_excess', 'brokerage_cash', 'roth_cash', 'coinbase_cash', 'checking');--> statement-breakpoint
CREATE TYPE "public"."trade_side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TABLE "adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"bucket" "cash_bucket" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"income_id" integer NOT NULL,
	"bucket" "cash_bucket" NOT NULL,
	"amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"source_id" integer NOT NULL,
	"gross" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"tax_withheld" numeric(12, 2) GENERATED ALWAYS AS (round(gross * tax_rate, 2)) STORED,
	"net" numeric(12, 2) GENERATED ALWAYS AS (gross - round(gross * tax_rate, 2)) STORED,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"ticker" text PRIMARY KEY NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"prev_close" numeric(18, 8),
	"currency" text DEFAULT 'USD' NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"date" date PRIMARY KEY NOT NULL,
	"total_value" numeric(14, 2) NOT NULL,
	"by_account" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"default_tax_rate" numeric(5, 4) DEFAULT '0' NOT NULL,
	"default_bucket" "cash_bucket",
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"account" "account" NOT NULL,
	"ticker" text NOT NULL,
	"side" "trade_side" NOT NULL,
	"shares" numeric(18, 8) NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_income_id_income_id_fk" FOREIGN KEY ("income_id") REFERENCES "public"."income"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "adjustments_bucket_idx" ON "adjustments" USING btree ("bucket");--> statement-breakpoint
CREATE INDEX "allocations_income_idx" ON "allocations" USING btree ("income_id");--> statement-breakpoint
CREATE INDEX "income_date_idx" ON "income" USING btree ("date");--> statement-breakpoint
CREATE INDEX "login_attempts_ip_at_idx" ON "login_attempts" USING btree ("ip","at");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "snapshots_date_idx" ON "snapshots" USING btree ("date");--> statement-breakpoint
CREATE INDEX "trades_account_ticker_idx" ON "trades" USING btree ("account","ticker");