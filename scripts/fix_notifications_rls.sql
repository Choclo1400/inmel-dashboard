-- Fix RLS policies for notifications table
-- Allows admins and supervisors to create notifications

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins and supervisors can insert notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT 
  USING (auth.uid()::text = user_id::text);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

-- Admins and supervisors can create notifications
CREATE POLICY "Admins and supervisors can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    public.is_admin_or_supervisor()
  );

-- Delete old notifications (users can delete their own)
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
