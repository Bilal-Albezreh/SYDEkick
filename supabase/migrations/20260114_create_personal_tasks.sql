-- Create table for personal tasks
create table public.personal_tasks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text null,
  due_date timestamp with time zone not null,
  is_completed boolean not null default false,
  course_id uuid null references public.courses (id) on delete set null,
  type text not null check (type in ('personal', 'course_work')),
  created_at timestamp with time zone not null default now(),
  constraint personal_tasks_pkey primary key (id)
);

-- Enable RLS
alter table public.personal_tasks enable row level security;

-- Policies
create policy "Users can view their own personal tasks" 
on public.personal_tasks for select 
using (auth.uid() = user_id);

create policy "Users can insert their own personal tasks" 
on public.personal_tasks for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own personal tasks" 
on public.personal_tasks for update 
using (auth.uid() = user_id);

create policy "Users can delete their own personal tasks" 
on public.personal_tasks for delete 
using (auth.uid() = user_id);
