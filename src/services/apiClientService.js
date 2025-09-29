import { supabase } from "../lib/supabase";

class ApiClientService {
  async getAllClients() {
    try {
      const { data, error } = await supabase
        ?.from("api_clients")
        ?.select(`
          *,
          created_by:user_profiles!created_by(full_name, organization)
        `)
        ?.order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createClient(clientData) {
    try {
      const {
        data: { user },
      } = await supabase?.auth?.getUser();
      if (!user) throw new Error("User not authenticated");

      const clientKey = `ayush_${Date.now()}_${Math.random()
        ?.toString(36)
        ?.substring(7)}`;

      const { data, error } = await supabase
        ?.from("api_clients")
        ?.insert({
          ...clientData,
          client_key: clientKey,
          created_by: user?.id,
        })
        ?.select()
        ?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateClient(id, updates) {
    try {
      const { data, error } = await supabase
        ?.from("api_clients")
        ?.update(updates)
        ?.eq("id", id)
        ?.select()
        ?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteClient(id) {
    try {
      const { error } = await supabase?.from("api_clients")?.delete()?.eq("id", id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getApiStats(clientId = null) {
    try {
      let usageQuery = supabase?.from("api_usage_logs")?.select(
        "request_count.sum(), response_time_ms.avg()"
      );

      if (clientId) {
        usageQuery = usageQuery?.eq("client_id", clientId);
      }

      const { data: usageData, error: usageError } = await usageQuery;

      const { data: recentLogs, error: logsError } = await supabase
        ?.from("api_usage_logs")
        ?.select(`
          *,
          client:api_clients(client_name, organization)
        `)
        ?.order("created_at", { ascending: false })
        ?.limit(100);

      if (usageError || logsError) {
        throw usageError || logsError;
      }

      return {
        data: {
          totalRequests: usageData?.[0]?.sum || 0,
          avgResponseTime: Math.round(usageData?.[0]?.avg || 0),
          recentLogs: recentLogs || [],
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  async logApiUsage(usageData) {
    try {
      const { data, error } = await supabase
        ?.from("api_usage_logs")
        ?.insert(usageData)
        ?.select()
        ?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getClientStats() {
    try {
      const { data: totalClients, error: totalError } = await supabase
        ?.from("api_clients")
        ?.select("id", { count: "exact", head: true });

      const { data: activeClients, error: activeError } = await supabase
        ?.from("api_clients")
        ?.select("id", { count: "exact", head: true })
        ?.eq("status", "active");

      if (totalError || activeError) {
        throw totalError || activeError;
      }

      return {
        data: {
          total: totalClients || 0,
          active: activeClients || 0,
          inactive: (totalClients || 0) - (activeClients || 0),
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  subscribeToClients(callback) {
    return supabase
      ?.channel("api_clients")
      ?.on("postgres_changes", { event: "*", schema: "public", table: "api_clients" }, callback)
      ?.subscribe();
  }
}

export const apiClientService = new ApiClientService();
export default apiClientService;