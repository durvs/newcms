CREATE TABLE "commentmeta" (
	"meta_id" serial PRIMARY KEY NOT NULL,
	"comment_id" bigint NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text,
	"meta_value_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"comment_id" serial PRIMARY KEY NOT NULL,
	"comment_post_id" bigint DEFAULT 0 NOT NULL,
	"comment_author" text DEFAULT '' NOT NULL,
	"comment_author_email" varchar(100) DEFAULT '' NOT NULL,
	"comment_author_url" varchar(200) DEFAULT '' NOT NULL,
	"comment_author_ip" varchar(100) DEFAULT '' NOT NULL,
	"comment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"comment_date_gmt" timestamp with time zone DEFAULT now() NOT NULL,
	"comment_content" text DEFAULT '' NOT NULL,
	"comment_karma" bigint DEFAULT 0 NOT NULL,
	"comment_approved" varchar(20) DEFAULT '1' NOT NULL,
	"comment_agent" varchar(255) DEFAULT '' NOT NULL,
	"comment_type" varchar(20) DEFAULT 'comment' NOT NULL,
	"comment_parent" bigint DEFAULT 0 NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"link_id" serial PRIMARY KEY NOT NULL,
	"link_url" varchar(255) DEFAULT '' NOT NULL,
	"link_name" varchar(255) DEFAULT '' NOT NULL,
	"link_image" varchar(255) DEFAULT '' NOT NULL,
	"link_target" varchar(25) DEFAULT '' NOT NULL,
	"link_description" varchar(255) DEFAULT '' NOT NULL,
	"link_visible" varchar(20) DEFAULT 'Y' NOT NULL,
	"link_owner" bigint DEFAULT 1 NOT NULL,
	"link_rating" bigint DEFAULT 0 NOT NULL,
	"link_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"link_rel" varchar(255) DEFAULT '' NOT NULL,
	"link_notes" text DEFAULT '' NOT NULL,
	"link_rss" varchar(255) DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"option_id" serial PRIMARY KEY NOT NULL,
	"option_name" varchar(191) NOT NULL,
	"option_value" text DEFAULT '' NOT NULL,
	"option_value_json" jsonb,
	"autoload" boolean DEFAULT true NOT NULL,
	CONSTRAINT "options_option_name_unique" UNIQUE("option_name")
);
--> statement-breakpoint
CREATE TABLE "postmeta" (
	"meta_id" serial PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text,
	"meta_value_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_author" bigint DEFAULT 0 NOT NULL,
	"post_date" timestamp with time zone DEFAULT now() NOT NULL,
	"post_date_gmt" timestamp with time zone DEFAULT now() NOT NULL,
	"post_content" text DEFAULT '' NOT NULL,
	"post_title" text DEFAULT '' NOT NULL,
	"post_excerpt" text DEFAULT '' NOT NULL,
	"post_status" varchar(20) DEFAULT 'publish' NOT NULL,
	"comment_status" varchar(20) DEFAULT 'open' NOT NULL,
	"ping_status" varchar(20) DEFAULT 'open' NOT NULL,
	"post_password" varchar(255) DEFAULT '' NOT NULL,
	"post_name" varchar(200) DEFAULT '' NOT NULL,
	"to_ping" text DEFAULT '' NOT NULL,
	"pinged" text DEFAULT '' NOT NULL,
	"post_modified" timestamp with time zone DEFAULT now() NOT NULL,
	"post_modified_gmt" timestamp with time zone DEFAULT now() NOT NULL,
	"post_content_filtered" text DEFAULT '' NOT NULL,
	"post_parent" bigint DEFAULT 0 NOT NULL,
	"guid" varchar(255) DEFAULT '' NOT NULL,
	"menu_order" bigint DEFAULT 0 NOT NULL,
	"post_type" varchar(20) DEFAULT 'post' NOT NULL,
	"post_mime_type" varchar(100) DEFAULT '' NOT NULL,
	"comment_count" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"hook" varchar(255) NOT NULL,
	"args" jsonb DEFAULT '[]' NOT NULL,
	"schedule" varchar(50),
	"interval_seconds" bigint,
	"next_run_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" varchar(45) DEFAULT '' NOT NULL,
	"user_agent" varchar(500) DEFAULT '' NOT NULL,
	"data" jsonb,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "term_relationships" (
	"object_id" bigint NOT NULL,
	"term_taxonomy_id" bigint NOT NULL,
	"term_order" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "term_taxonomy" (
	"term_taxonomy_id" serial PRIMARY KEY NOT NULL,
	"term_id" bigint NOT NULL,
	"taxonomy" varchar(32) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"parent" bigint DEFAULT 0 NOT NULL,
	"count" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "termmeta" (
	"meta_id" serial PRIMARY KEY NOT NULL,
	"term_id" bigint NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text,
	"meta_value_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"term_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) DEFAULT '' NOT NULL,
	"slug" varchar(200) DEFAULT '' NOT NULL,
	"term_group" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usermeta" (
	"umeta_id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"meta_key" varchar(255),
	"meta_value" text,
	"meta_value_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_login" varchar(60) NOT NULL,
	"user_pass" varchar(255) DEFAULT '' NOT NULL,
	"user_nicename" varchar(50) DEFAULT '' NOT NULL,
	"user_email" varchar(100) NOT NULL,
	"user_url" varchar(100) DEFAULT '' NOT NULL,
	"user_registered" timestamp with time zone DEFAULT now() NOT NULL,
	"user_activation_key" varchar(255) DEFAULT '' NOT NULL,
	"user_status" varchar(20) DEFAULT 'active' NOT NULL,
	"display_name" varchar(250) DEFAULT '' NOT NULL,
	CONSTRAINT "users_user_login_unique" UNIQUE("user_login"),
	CONSTRAINT "users_user_email_unique" UNIQUE("user_email")
);
--> statement-breakpoint
ALTER TABLE "commentmeta" ADD CONSTRAINT "commentmeta_comment_id_comments_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("comment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_comment_post_id_posts_id_fk" FOREIGN KEY ("comment_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postmeta" ADD CONSTRAINT "postmeta_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_post_author_users_id_fk" FOREIGN KEY ("post_author") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_relationships" ADD CONSTRAINT "term_relationships_object_id_posts_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_relationships" ADD CONSTRAINT "term_relationships_term_taxonomy_id_term_taxonomy_term_taxonomy_id_fk" FOREIGN KEY ("term_taxonomy_id") REFERENCES "public"."term_taxonomy"("term_taxonomy_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "term_taxonomy" ADD CONSTRAINT "term_taxonomy_term_id_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("term_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "termmeta" ADD CONSTRAINT "termmeta_term_id_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("term_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usermeta" ADD CONSTRAINT "usermeta_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_commentmeta_comment_id" ON "commentmeta" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_commentmeta_meta_key" ON "commentmeta" USING btree ("meta_key");--> statement-breakpoint
CREATE INDEX "idx_comment_post_id" ON "comments" USING btree ("comment_post_id");--> statement-breakpoint
CREATE INDEX "idx_comment_approved_date_gmt" ON "comments" USING btree ("comment_approved","comment_date_gmt");--> statement-breakpoint
CREATE INDEX "idx_comment_date_gmt" ON "comments" USING btree ("comment_date_gmt");--> statement-breakpoint
CREATE INDEX "idx_comment_parent" ON "comments" USING btree ("comment_parent");--> statement-breakpoint
CREATE INDEX "idx_comment_author_email" ON "comments" USING btree ("comment_author_email");--> statement-breakpoint
CREATE INDEX "idx_link_visible" ON "links" USING btree ("link_visible");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_option_name" ON "options" USING btree ("option_name");--> statement-breakpoint
CREATE INDEX "idx_autoload" ON "options" USING btree ("autoload");--> statement-breakpoint
CREATE INDEX "idx_postmeta_post_id" ON "postmeta" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_postmeta_meta_key" ON "postmeta" USING btree ("meta_key");--> statement-breakpoint
CREATE INDEX "idx_postmeta_post_key" ON "postmeta" USING btree ("post_id","meta_key");--> statement-breakpoint
CREATE INDEX "idx_post_name" ON "posts" USING btree ("post_name");--> statement-breakpoint
CREATE INDEX "idx_post_type_status_date" ON "posts" USING btree ("post_type","post_status","post_date");--> statement-breakpoint
CREATE INDEX "idx_post_parent" ON "posts" USING btree ("post_parent");--> statement-breakpoint
CREATE INDEX "idx_post_author" ON "posts" USING btree ("post_author");--> statement-breakpoint
CREATE INDEX "idx_scheduled_hook" ON "scheduled_events" USING btree ("hook");--> statement-breakpoint
CREATE INDEX "idx_scheduled_next_run" ON "scheduled_events" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "idx_scheduled_status" ON "scheduled_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_session_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_token_hash" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_session_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_term_taxonomy_id" ON "term_relationships" USING btree ("term_taxonomy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_term_id_taxonomy" ON "term_taxonomy" USING btree ("term_id","taxonomy");--> statement-breakpoint
CREATE INDEX "idx_taxonomy" ON "term_taxonomy" USING btree ("taxonomy");--> statement-breakpoint
CREATE INDEX "idx_termmeta_term_id" ON "termmeta" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "idx_termmeta_meta_key" ON "termmeta" USING btree ("meta_key");--> statement-breakpoint
CREATE INDEX "idx_term_slug" ON "terms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_term_name" ON "terms" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_usermeta_user_id" ON "usermeta" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_usermeta_meta_key" ON "usermeta" USING btree ("meta_key");--> statement-breakpoint
CREATE INDEX "idx_user_login" ON "users" USING btree ("user_login");--> statement-breakpoint
CREATE INDEX "idx_user_nicename" ON "users" USING btree ("user_nicename");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "users" USING btree ("user_email");