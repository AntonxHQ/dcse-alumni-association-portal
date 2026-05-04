insert into public.skills (name, is_predefined)
values
  ('Embedded Systems', true),
  ('VLSI Design', true),
  ('Computer Networks', true),
  ('Machine Learning', true),
  ('Operating Systems', true),
  ('PCB Design', true),
  ('IoT', true),
  ('Cybersecurity', true),
  ('Software Engineering', true),
  ('Digital Signal Processing', true)
on conflict (name) do update
set is_predefined = excluded.is_predefined;
