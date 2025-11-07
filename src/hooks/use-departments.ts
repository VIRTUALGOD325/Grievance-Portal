/**
 * Custom hook for managing departments
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch all active departments
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};

// Fetch single department
export const useDepartment = (departmentId: string | undefined) => {
  return useQuery({
    queryKey: ['departments', departmentId],
    queryFn: async () => {
      if (!departmentId) return null;

      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', departmentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!departmentId,
  });
};
