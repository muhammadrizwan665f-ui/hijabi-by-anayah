CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_no text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL, -- 'admin_new_order', 'customer_status_update'
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO anon; -- Allow anon for customer tracking if needed, though usually customer is auth or session based.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can see their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
