drop extension if exists "pg_net";


  create table "public"."live_messages" (
    "id" uuid not null default gen_random_uuid(),
    "content" text not null,
    "user_id" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."live_messages" enable row level security;


  create table "public"."session_state" (
    "id" integer not null default 1,
    "is_active" boolean default true,
    "started_at" timestamp with time zone default now(),
    "message_count" integer default 0,
    "peak_users" integer default 0
      );


alter table "public"."session_state" enable row level security;


  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "pseudo" text not null,
    "phone" text not null,
    "joined_at" timestamp with time zone default now(),
    "last_seen" timestamp with time zone default now()
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX live_messages_pkey ON public.live_messages USING btree (id);

CREATE UNIQUE INDEX session_state_pkey ON public.session_state USING btree (id);

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."live_messages" add constraint "live_messages_pkey" PRIMARY KEY using index "live_messages_pkey";

alter table "public"."session_state" add constraint "session_state_pkey" PRIMARY KEY using index "session_state_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."live_messages" add constraint "live_messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."live_messages" validate constraint "live_messages_user_id_fkey";

alter table "public"."users" add constraint "users_phone_key" UNIQUE using index "users_phone_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."live_messages" to "anon";

grant insert on table "public"."live_messages" to "anon";

grant references on table "public"."live_messages" to "anon";

grant select on table "public"."live_messages" to "anon";

grant trigger on table "public"."live_messages" to "anon";

grant truncate on table "public"."live_messages" to "anon";

grant update on table "public"."live_messages" to "anon";

grant delete on table "public"."live_messages" to "authenticated";

grant insert on table "public"."live_messages" to "authenticated";

grant references on table "public"."live_messages" to "authenticated";

grant select on table "public"."live_messages" to "authenticated";

grant trigger on table "public"."live_messages" to "authenticated";

grant truncate on table "public"."live_messages" to "authenticated";

grant update on table "public"."live_messages" to "authenticated";

grant delete on table "public"."live_messages" to "service_role";

grant insert on table "public"."live_messages" to "service_role";

grant references on table "public"."live_messages" to "service_role";

grant select on table "public"."live_messages" to "service_role";

grant trigger on table "public"."live_messages" to "service_role";

grant truncate on table "public"."live_messages" to "service_role";

grant update on table "public"."live_messages" to "service_role";

grant delete on table "public"."session_state" to "anon";

grant insert on table "public"."session_state" to "anon";

grant references on table "public"."session_state" to "anon";

grant select on table "public"."session_state" to "anon";

grant trigger on table "public"."session_state" to "anon";

grant truncate on table "public"."session_state" to "anon";

grant update on table "public"."session_state" to "anon";

grant delete on table "public"."session_state" to "authenticated";

grant insert on table "public"."session_state" to "authenticated";

grant references on table "public"."session_state" to "authenticated";

grant select on table "public"."session_state" to "authenticated";

grant trigger on table "public"."session_state" to "authenticated";

grant truncate on table "public"."session_state" to "authenticated";

grant update on table "public"."session_state" to "authenticated";

grant delete on table "public"."session_state" to "service_role";

grant insert on table "public"."session_state" to "service_role";

grant references on table "public"."session_state" to "service_role";

grant select on table "public"."session_state" to "service_role";

grant trigger on table "public"."session_state" to "service_role";

grant truncate on table "public"."session_state" to "service_role";

grant update on table "public"."session_state" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Messages are viewable by everyone."
  on "public"."live_messages"
  as permissive
  for select
  to public
using (true);



  create policy "Users can post messages."
  on "public"."live_messages"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "public_select_session"
  on "public"."session_state"
  as permissive
  for select
  to public
using (true);



  create policy "public_update_session"
  on "public"."session_state"
  as permissive
  for update
  to public
using (true);



  create policy "public_insert_users"
  on "public"."users"
  as permissive
  for insert
  to public
with check (true);



  create policy "public_select_users"
  on "public"."users"
  as permissive
  for select
  to public
using (true);



  create policy "public_update_users"
  on "public"."users"
  as permissive
  for update
  to public
using (true);



