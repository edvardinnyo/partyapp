CREATE TYPE "public"."account_type" AS ENUM('person', 'partner');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "partners" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"status" "partner_status" DEFAULT 'pending' NOT NULL,
	"company_name" text NOT NULL,
	"tax_number" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"address" text NOT NULL,
	"website" text,
	"bio" text,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"terms_version" text NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_bio_length" CHECK (char_length("partners"."bio") <= 500)
);
--> statement-breakpoint
ALTER TABLE "partners" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "adult_confirmed_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "account_type" "account_type" DEFAULT 'person' NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_person_adult_confirmed" CHECK ("profiles"."account_type" = 'partner' or "profiles"."adult_confirmed_at" is not null);