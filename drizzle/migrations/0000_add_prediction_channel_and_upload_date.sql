ALTER TABLE public.predictions
  ADD COLUMN channel_id text,
  ADD COLUMN upload_date timestamptz;