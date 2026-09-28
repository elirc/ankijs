-- Apply after 0001 and 0002. Existing rows and progress are retained.
begin;
do $$ declare t text; begin
  foreach t in array array['decks','cards','notes','review_logs'] loop
    execute format('alter table public.%I drop constraint %I', t, t || '_pkey');
    execute format('alter table public.%I add primary key (user_id, id)', t);
  end loop;
end $$;
create or replace function public.upsert_deck(d jsonb)
returns void
language plpgsql
security invoker
as $$
declare nd public.decks;
begin
  nd := jsonb_populate_record(null::public.decks, d);
  insert into public.decks
    (id, user_id, name, new_per_day, created_at, updated_at, deleted_at)
  values
    (nd.id, nd.user_id, nd.name, nd.new_per_day, nd.created_at, nd.updated_at, nd.deleted_at)
  on conflict (user_id, id) do update set
    name = excluded.name,
    new_per_day = excluded.new_per_day,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at
  where excluded.updated_at > public.decks.updated_at;
end
$$;

create or replace function public.upsert_note(n jsonb)
returns void
language plpgsql
security invoker
as $$
declare nn public.notes;
begin
  nn := jsonb_populate_record(null::public.notes, n);
  insert into public.notes
    (id, user_id, body, status, card_ids, created_at, updated_at, deleted_at)
  values
    (nn.id, nn.user_id, nn.body, nn.status, nn.card_ids, nn.created_at, nn.updated_at, nn.deleted_at)
  on conflict (user_id, id) do update set
    body = excluded.body,
    status = excluded.status,
    card_ids = excluded.card_ids,
    updated_at = excluded.updated_at,
    deleted_at = excluded.deleted_at
  where excluded.updated_at > public.notes.updated_at;
end
$$;

create or replace function public.upsert_card(c jsonb)
returns void
language plpgsql
security invoker
as $$
declare nc public.cards;
begin
  nc := jsonb_populate_record(null::public.cards, c);
  insert into public.cards
    (
      id, user_id, deck_id, note_id, front, back, suspended, due, stability,
      difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review, learning_steps,
      content_updated_at, srs_updated_at, created_at, deleted_at
    )
  values
    (
      nc.id, nc.user_id, nc.deck_id, nc.note_id, nc.front, nc.back, nc.suspended, nc.due,
      nc.stability, nc.difficulty, nc.elapsed_days, nc.scheduled_days, nc.reps, nc.lapses,
      nc.state, nc.last_review, coalesce(nc.learning_steps, 0), nc.content_updated_at, nc.srs_updated_at, nc.created_at,
      nc.deleted_at
    )
  on conflict (user_id, id) do update set
    deck_id = case when excluded.content_updated_at > public.cards.content_updated_at then excluded.deck_id else public.cards.deck_id end,
    front = case when excluded.content_updated_at > public.cards.content_updated_at then excluded.front else public.cards.front end,
    back = case when excluded.content_updated_at > public.cards.content_updated_at then excluded.back else public.cards.back end,
    suspended = case when excluded.content_updated_at > public.cards.content_updated_at then excluded.suspended else public.cards.suspended end,
    note_id = case when excluded.content_updated_at > public.cards.content_updated_at then excluded.note_id else public.cards.note_id end,
    content_updated_at = greatest(excluded.content_updated_at, public.cards.content_updated_at),
    due = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.due else public.cards.due end,
    stability = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.stability else public.cards.stability end,
    difficulty = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.difficulty else public.cards.difficulty end,
    elapsed_days = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.elapsed_days else public.cards.elapsed_days end,
    scheduled_days = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.scheduled_days else public.cards.scheduled_days end,
    learning_steps = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.learning_steps else public.cards.learning_steps end,
    reps = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.reps else public.cards.reps end,
    lapses = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.lapses else public.cards.lapses end,
    state = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.state else public.cards.state end,
    last_review = case when excluded.srs_updated_at > public.cards.srs_updated_at then excluded.last_review else public.cards.last_review end,
    srs_updated_at = greatest(excluded.srs_updated_at, public.cards.srs_updated_at),
    deleted_at = case
      when excluded.deleted_at is not null
        and (
          excluded.content_updated_at > public.cards.content_updated_at
          or excluded.srs_updated_at > public.cards.srs_updated_at
        )
      then excluded.deleted_at
      else public.cards.deleted_at
    end;
end
$$;



create table public.user_state (
 id text not null, user_id uuid not null references auth.users(id) on delete cascade,
 payload text not null check (length(payload) <= 100000), updated_at timestamptz not null,
 server_updated_at timestamptz not null default now(), primary key (user_id,id)
);
alter table public.user_state enable row level security;
create policy user_state_owner on public.user_state for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_user_state_touch before insert or update on public.user_state for each row execute function public.touch_server_updated_at();
create index user_state_cursor on public.user_state(user_id,server_updated_at,id);
create or replace function public.upsert_user_state(s jsonb) returns void language plpgsql security invoker as $$
declare ns public.user_state; begin
 ns := jsonb_populate_record(null::public.user_state,s);
 insert into public.user_state(id,user_id,payload,updated_at) values(ns.id,ns.user_id,ns.payload,ns.updated_at)
 on conflict(user_id,id) do update set payload=excluded.payload, updated_at=excluded.updated_at
 where excluded.updated_at > public.user_state.updated_at;
end $$;
commit;
