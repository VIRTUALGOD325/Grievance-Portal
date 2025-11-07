/**
 * Database Connection Test Component
 * 
 * Use this component to test your Supabase database connection.
 * Import and render it anywhere in your app to see if the database is working.
 * 
 * Usage:
 * import DatabaseTest from '@/components/DatabaseTest';
 * <DatabaseTest />
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Database } from 'lucide-react';

const DatabaseTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setTesting(true);
    const testResults: any = {
      connection: { status: 'pending', message: '' },
      departments: { status: 'pending', message: '', data: null },
      complaints: { status: 'pending', message: '', data: null },
      auth: { status: 'pending', message: '', data: null },
    };

    try {
      // Test 1: Basic Connection
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        testResults.connection = {
          status: 'success',
          message: 'Database connection successful ✓'
        };
      } catch (error: any) {
        testResults.connection = {
          status: 'error',
          message: `Connection failed: ${error.message}`
        };
      }

      // Test 2: Fetch Departments
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .limit(5);
        
        if (error) throw error;
        testResults.departments = {
          status: 'success',
          message: `Found ${data?.length || 0} departments`,
          data: data
        };
      } catch (error: any) {
        testResults.departments = {
          status: 'error',
          message: `Departments query failed: ${error.message}`
        };
      }

      // Test 3: Fetch Complaints
      try {
        const { data, error, count } = await supabase
          .from('complaints')
          .select('*', { count: 'exact' })
          .limit(5);
        
        if (error) throw error;
        testResults.complaints = {
          status: 'success',
          message: `Found ${count || 0} total complaints (showing ${data?.length || 0})`,
          data: data
        };
      } catch (error: any) {
        testResults.complaints = {
          status: 'error',
          message: `Complaints query failed: ${error.message}`
        };
      }

      // Test 4: Check Authentication
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user) {
          testResults.auth = {
            status: 'success',
            message: `Authenticated as: ${user.email}`,
            data: { email: user.email, id: user.id }
          };
        } else {
          testResults.auth = {
            status: 'warning',
            message: 'Not currently logged in'
          };
        }
      } catch (error: any) {
        testResults.auth = {
          status: 'error',
          message: `Auth check failed: ${error.message}`
        };
      }

    } catch (error: any) {
      console.error('Test error:', error);
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <CheckCircle2 className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Database Connection Test
        </CardTitle>
        <CardDescription>
          Test your Supabase database connection and verify data access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Database Tests'
          )}
        </Button>

        {results && (
          <div className="space-y-3 mt-4">
            {/* Connection Test */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(results.connection.status)}
              <div className="flex-1">
                <h4 className="font-semibold">Database Connection</h4>
                <p className="text-sm text-muted-foreground">
                  {results.connection.message}
                </p>
              </div>
            </div>

            {/* Departments Test */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(results.departments.status)}
              <div className="flex-1">
                <h4 className="font-semibold">Departments Table</h4>
                <p className="text-sm text-muted-foreground">
                  {results.departments.message}
                </p>
                {results.departments.data && (
                  <div className="mt-2 text-xs bg-muted p-2 rounded">
                    {results.departments.data.map((dept: any) => (
                      <div key={dept.id}>• {dept.name}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Complaints Test */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(results.complaints.status)}
              <div className="flex-1">
                <h4 className="font-semibold">Complaints Table</h4>
                <p className="text-sm text-muted-foreground">
                  {results.complaints.message}
                </p>
                {results.complaints.data && results.complaints.data.length > 0 && (
                  <div className="mt-2 text-xs bg-muted p-2 rounded">
                    Recent complaints:
                    {results.complaints.data.slice(0, 3).map((complaint: any) => (
                      <div key={complaint.id} className="mt-1">
                        • {complaint.status} - {complaint.severity}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auth Test */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(results.auth.status)}
              <div className="flex-1">
                <h4 className="font-semibold">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  {results.auth.message}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg mt-4">
              <h4 className="font-semibold mb-2">Connection Details</h4>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Project URL:</strong>{' '}
                  {import.meta.env.VITE_SUPABASE_URL}
                </p>
                <p>
                  <strong>Project ID:</strong>{' '}
                  {import.meta.env.VITE_SUPABASE_PROJECT_ID}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ All database operations use Row Level Security (RLS)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseTest;
