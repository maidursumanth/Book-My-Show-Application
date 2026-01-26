-- Add INSERT policy for profiles table so the handle_new_user trigger can create profiles
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);