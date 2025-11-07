/**
 * Database Dashboard - Admin Only
 * Direct database access with CRUD operations
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Users,
  FileText,
  Building2,
  Shield,
  History,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const DatabaseDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("complaints");

  // Data states
  const [complaints, setComplaints] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  // Dialog states
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    table: string;
    data: any;
  }>({
    open: false,
    table: "",
    data: null,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/admin/auth");
      return;
    }

    // Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .in("role", ["admin", "superadmin"])
      .single();

    if (!roles) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required to access database",
        variant: "destructive",
      });
      navigate("/admin/dashboard");
      return;
    }

    setUser(session.user);
    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    await Promise.all([
      loadComplaints(),
      loadDepartments(),
      loadProfiles(),
      loadUserRoles(),
      loadStatusHistory(),
    ]);
  };

  // LOAD FUNCTIONS
  const loadComplaints = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(
        `
        *,
        departments (name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading complaints:", error);
      toast({
        title: "Error loading complaints",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      console.log("Loaded complaints:", data);
      setComplaints(data);
    }
  };

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    if (!error && data) setDepartments(data);
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setProfiles(data);
  };

  const loadUserRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(
        `
        *,
        departments (name)
      `
      )
      .order("created_at", { ascending: false });

    if (!error && data) setUserRoles(data);
  };

  const loadStatusHistory = async () => {
    const { data, error } = await supabase
      .from("status_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setStatusHistory(data);
  };

  // DELETE FUNCTIONS
  const handleDelete = async (
    table:
      | "complaints"
      | "departments"
      | "profiles"
      | "status_history"
      | "user_roles",
    id: string
  ) => {
    if (!confirm(`Are you sure you want to delete this ${table} record?`))
      return;

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to delete: ${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${table} record deleted successfully`,
      });
      loadAllData();
    }
  };

  // UPDATE COMPLAINT STATUS
  const handleUpdateComplaintStatus = async (
    complaintId: string,
    newStatus: "pending" | "assigned" | "in_progress" | "resolved" | "rejected"
  ) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", complaintId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      loadComplaints();
    }
  };

  // TOGGLE DEPARTMENT ACTIVE
  const handleToggleDepartment = async (
    deptId: string,
    currentStatus: boolean
  ) => {
    const { error } = await supabase
      .from("departments")
      .update({ is_active: !currentStatus })
      .eq("id", deptId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Department ${
          !currentStatus ? "activated" : "deactivated"
        }`,
      });
      loadDepartments();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Database Dashboard</h1>
              <Badge variant="destructive">Admin Only</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={loadAllData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh All
              </Button>
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complaints.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userRoles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                History Records
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusHistory.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different tables */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="roles">User Roles</TabsTrigger>
            <TabsTrigger value="history">Status History</TabsTrigger>
          </TabsList>

          {/* COMPLAINTS TAB */}
          <TabsContent value="complaints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complaints Table</CardTitle>
                <CardDescription>
                  View and manage all complaints in the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{complaint.severity}</Badge>
                          <Badge>{complaint.status}</Badge>
                          {complaint.departments && (
                            <Badge variant="secondary">
                              {complaint.departments.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {complaint.summary || "No summary"}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {complaint.description.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Citizen ID: {complaint.citizen_id?.substring(0, 8) || "N/A"}... •{" "}
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Select
                          value={complaint.status}
                          onValueChange={(value) =>
                            handleUpdateComplaintStatus(
                              complaint.id,
                              value as
                                | "pending"
                                | "assigned"
                                | "in_progress"
                                | "resolved"
                                | "rejected"
                            )
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDelete("complaints", complaint.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEPARTMENTS TAB */}
          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Departments Table</CardTitle>
                <CardDescription>Manage municipal departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {dept.name.replace(/_/g, " ").toUpperCase()}
                          </h4>
                          <Badge
                            variant={dept.is_active ? "default" : "secondary"}
                          >
                            {dept.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {dept.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contact: {dept.contact_email}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleDepartment(dept.id, dept.is_active)
                          }
                        >
                          {dept.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("departments", dept.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILES TAB */}
          <TabsContent value="profiles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Profiles Table</CardTitle>
                <CardDescription>View all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">
                          {profile.full_name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          {profile.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Phone: {profile.phone_number || "Not provided"} •{" "}
                          Language: {profile.preferred_language || "English"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined:{" "}
                          {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete("profiles", profile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USER ROLES TAB */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Roles Table</CardTitle>
                <CardDescription>
                  Manage user permissions and roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userRoles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              role.role === "superadmin"
                                ? "destructive"
                                : role.role === "admin"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {role.role.toUpperCase()}
                          </Badge>
                          {role.departments && (
                            <Badge variant="outline">
                              {role.departments.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          User ID: {role.user_id.substring(0, 8)}... • Created:{" "}
                          {new Date(role.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete("user_roles", role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATUS HISTORY TAB */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status History Table</CardTitle>
                <CardDescription>
                  Audit trail of all status changes (last 50 records)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusHistory.map((history) => (
                    <div
                      key={history.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {history.old_status || "N/A"}
                          </Badge>
                          <span>→</span>
                          <Badge>{history.new_status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Complaint ID: {history.complaint_id.substring(0, 8)}
                          ...
                        </p>
                        {history.notes && (
                          <p className="text-sm mt-1">{history.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(history.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDelete("status_history", history.id)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DatabaseDashboard;
