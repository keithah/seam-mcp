#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Seam } from "seam";

// Configuration schema - automatically detected by Smithery
export const configSchema = z.object({
  seamApiKey: z.string().describe("Your Seam API key from https://console.seam.co/"),
});

export default function createServer({
  config
}: {
  config: z.infer<typeof configSchema>
}) {
  console.log('[Server] Initializing...');
  console.log('[Server] Config received, keys:', Object.keys(config));

  // Create MCP server
  const server = new McpServer({
    name: "seam-mcp-server",
    title: "Seam Smart Lock Control",
    version: "0.1.0"
  });

  // Lazy initialization of Seam client - only create when needed
  let seamClient: Seam | null = null;

  const getSeamClient = () => {
    console.log('[SeamClient] Initializing...');
    if (!seamClient) {
      if (!config.seamApiKey) {
        console.error('[SeamClient] ERROR: No API key');
        throw new Error("Seam API key not configured. Please set seamApiKey in your MCP server configuration.");
      }
      console.log('[SeamClient] API key found, length:', config.seamApiKey.length);
      try {
        seamClient = new Seam(config.seamApiKey);
        console.log('[SeamClient] ✓ Client created');
      } catch (err) {
        console.error('[SeamClient] ERROR creating:', err);
        throw err;
      }
    }
    return seamClient;
  };

  // Register list_locks tool
  server.tool(
    "list_locks",
    "List all smart locks connected to your Seam account",
    {},
    async () => {
      try {
        console.log('[list_locks] Starting...');
        const seamClient = getSeamClient();
        console.log('[list_locks] Seam client initialized');
        const locks = await seamClient.locks.list();
        console.log(`[list_locks] Found ${locks.length} locks`);
        return {
          total_locks: locks.length,
          locks: locks.map(lock => ({
            device_id: lock.device_id,
            name: lock.properties?.name || lock.device_id,
            manufacturer: lock.properties?.manufacturer,
            model: lock.properties?.model,
            locked: lock.properties?.locked,
            battery_level: lock.properties?.battery_level,
            online: lock.properties?.online,
          }))
        };
      } catch (error) {
        console.error('[list_locks] Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        throw new Error(`Failed to list locks: ${errorMessage}\nStack: ${errorStack}`);
      }
    }
  );

  // Register get_status tool
  server.tool(
    "get_status",
    "Get a comprehensive status overview of all locks including battery levels, lock states, and any issues",
    {},
    async () => {
      try {
        console.log('[get_status] Getting status overview...');
        const locks = await getSeamClient().locks.list();

        // Categorize locks
        const locked = locks.filter(l => l.properties?.locked === true);
        const unlocked = locks.filter(l => l.properties?.locked === false);
        const offline = locks.filter(l => l.properties?.online === false);
        const online = locks.filter(l => l.properties?.online === true);

        // Battery analysis
        const lowBattery = locks.filter(l =>
          l.properties?.battery_level !== undefined &&
          l.properties.battery_level < 0.3
        );
        const mediumBattery = locks.filter(l =>
          l.properties?.battery_level !== undefined &&
          l.properties.battery_level >= 0.3 &&
          l.properties.battery_level < 0.6
        );

        // Issues
        const locksWithErrors = locks.filter(l => l.errors && l.errors.length > 0);
        const locksWithWarnings = locks.filter(l => l.warnings && l.warnings.length > 0);

        // Build status summary
        const summary = {
          total_locks: locks.length,
          lock_states: {
            locked: locked.length,
            unlocked: unlocked.length,
            locked_percentage: locks.length > 0 ? Math.round((locked.length / locks.length) * 100) : 0,
          },
          connectivity: {
            online: online.length,
            offline: offline.length,
            offline_locks: offline.map(l => ({
              name: l.properties?.name || l.device_id,
              device_id: l.device_id,
            })),
          },
          battery_status: {
            low_battery_count: lowBattery.length,
            medium_battery_count: mediumBattery.length,
            low_battery_locks: lowBattery.map(l => ({
              name: l.properties?.name || l.device_id,
              battery_level: Math.round((l.properties?.battery_level || 0) * 100) + '%',
              device_id: l.device_id,
            })),
            medium_battery_locks: mediumBattery.map(l => ({
              name: l.properties?.name || l.device_id,
              battery_level: Math.round((l.properties?.battery_level || 0) * 100) + '%',
              device_id: l.device_id,
            })),
          },
          issues: {
            errors_count: locksWithErrors.length,
            warnings_count: locksWithWarnings.length,
            locks_with_errors: locksWithErrors.map(l => ({
              name: l.properties?.name || l.device_id,
              errors: l.errors,
              device_id: l.device_id,
            })),
            locks_with_warnings: locksWithWarnings.map(l => ({
              name: l.properties?.name || l.device_id,
              warnings: l.warnings,
              device_id: l.device_id,
            })),
          },
          all_locks_summary: locks.map(lock => ({
            name: lock.properties?.name || lock.device_id,
            status: lock.properties?.locked ? '🔒 Locked' : '🔓 Unlocked',
            online: lock.properties?.online ? '✅ Online' : '❌ Offline',
            battery: lock.properties?.battery_level !== undefined
              ? Math.round(lock.properties.battery_level * 100) + '%'
              : 'N/A',
            device_id: lock.device_id,
          })),
        };

        console.log(`[get_status] Status: ${locked.length}/${locks.length} locked, ${offline.length} offline, ${lowBattery.length} low battery`);
        return summary;
      } catch (error) {
        console.error('[get_status] Error:', error);
        throw new Error(`Failed to get status: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register get_lock tool
  server.tool(
    "get_lock",
    "Get detailed information about a specific lock",
    {
      device_id: z.string().describe("The device ID of the lock"),
    },
    async ({ device_id }) => {
      try {
        const lock = await getSeamClient().locks.get({ device_id });
        return {
          device_id: lock.device_id,
          name: lock.properties?.name || lock.device_id,
          manufacturer: lock.properties?.manufacturer,
          model: lock.properties?.model,
          locked: lock.properties?.locked,
          battery_level: lock.properties?.battery_level,
          online: lock.properties?.online,
          location: lock.location,
          created_at: lock.created_at,
          capabilities: lock.capabilities,
          errors: lock.errors,
          warnings: lock.warnings,
        };
      } catch (error) {
        throw new Error(`Failed to get lock details: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register lock_door tool
  server.tool(
    "lock_door",
    "Lock a specific door",
    {
      device_id: z.string().describe("The device ID of the lock to lock"),
    },
    async ({ device_id }) => {
      try {
        const result = await getSeamClient().locks.lockDoor({ device_id });
        return {
          status: "success",
          message: `Successfully locked door ${device_id}`,
          action_attempt: result,
        };
      } catch (error) {
        throw new Error(`Failed to lock door: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register unlock_door tool
  server.tool(
    "unlock_door",
    "Unlock a specific door",
    {
      device_id: z.string().describe("The device ID of the lock to unlock"),
    },
    async ({ device_id }) => {
      try {
        const result = await getSeamClient().locks.unlockDoor({ device_id });
        return {
          status: "success",
          message: `Successfully unlocked door ${device_id}`,
          action_attempt: result,
        };
      } catch (error) {
        throw new Error(`Failed to unlock door: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register get_lock_status tool
  server.tool(
    "get_lock_status",
    "Get the current lock status (locked/unlocked) of a specific lock",
    {
      device_id: z.string().describe("The device ID of the lock"),
    },
    async ({ device_id }) => {
      try {
        const lock = await getSeamClient().locks.get({ device_id });
        const isLocked = lock.properties?.locked;

        return {
          device_id: lock.device_id,
          name: lock.properties?.name || lock.device_id,
          locked: isLocked,
          status: isLocked ? "locked" : "unlocked",
          status_emoji: isLocked ? "🔒" : "🔓",
          battery_level: lock.properties?.battery_level,
          online: lock.properties?.online,
        };
      } catch (error) {
        throw new Error(`Failed to get lock status: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register create_access_code tool
  server.tool(
    "create_access_code",
    "Create an access code on a specific lock with optional time limits",
    {
      device_id: z.string().describe("The device ID of the lock"),
      code: z.string().optional().describe("The PIN code (e.g., '1234'). If not provided, a random code will be generated"),
      name: z.string().describe("Name/label for the access code (e.g., 'Guest Code', 'Cleaner')"),
      starts_at: z.string().optional().describe("When the code becomes active (ISO 8601 format, e.g., '2025-01-01T16:00:00Z')"),
      ends_at: z.string().optional().describe("When the code expires (ISO 8601 format, e.g., '2025-01-22T12:00:00Z')"),
    },
    async ({ device_id, code, name, starts_at, ends_at }) => {
      try {
        const lock = await getSeamClient().locks.get({ device_id });

        if (!lock.can_program_online_access_codes) {
          throw new Error(`Lock ${lock.properties?.name || device_id} does not support online access codes`);
        }

        const params: any = {
          device_id,
          name,
        };

        if (code) params.code = code;
        if (starts_at) params.starts_at = starts_at;
        if (ends_at) params.ends_at = ends_at;

        const result = await getSeamClient().accessCodes.create(params);

        return {
          status: "success",
          message: `Created access code '${name}' on ${lock.properties?.name || device_id}`,
          access_code: {
            access_code_id: result.access_code_id,
            code: result.code,
            name: result.name,
            device_id: result.device_id,
            starts_at: result.starts_at,
            ends_at: result.ends_at,
            status: result.status,
          },
        };
      } catch (error) {
        throw new Error(`Failed to create access code: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register create_access_code_on_multiple_locks tool
  server.tool(
    "create_access_code_on_multiple_locks",
    "Create the same access code on multiple locks (useful for creating one code for all locks in a location)",
    {
      device_ids: z.array(z.string()).describe("Array of device IDs to create the access code on"),
      code: z.string().optional().describe("The PIN code (e.g., '1234'). If not provided, random codes will be generated"),
      name: z.string().describe("Name/label for the access code (e.g., 'Guest Code', 'Seattle Locks')"),
      starts_at: z.string().optional().describe("When the code becomes active (ISO 8601 format)"),
      ends_at: z.string().optional().describe("When the code expires (ISO 8601 format)"),
      location_filter: z.string().optional().describe("Optional: filter locks by location name (e.g., 'Seattle', 'Building A')"),
    },
    async ({ device_ids, code, name, starts_at, ends_at, location_filter }) => {
      try {
        let targetDeviceIds = device_ids;

        // If location filter is provided, filter devices by location
        if (location_filter) {
          const allLocks = await getSeamClient().locks.list();
          const filteredLocks = allLocks.filter(lock => {
            const location = lock.location?.location_name || lock.location?.timezone || '';
            const lockName = lock.properties?.name || '';
            const searchTerm = location_filter.toLowerCase();
            return location.toLowerCase().includes(searchTerm) || lockName.toLowerCase().includes(searchTerm);
          });

          if (filteredLocks.length === 0) {
            throw new Error(`No locks found matching location filter: '${location_filter}'`);
          }

          targetDeviceIds = filteredLocks.map(lock => lock.device_id);
        }

        if (targetDeviceIds.length === 0) {
          throw new Error('No device IDs provided');
        }

        const params: any = {
          device_ids: targetDeviceIds,
          name,
        };

        if (code) params.code = code;
        if (starts_at) params.starts_at = starts_at;
        if (ends_at) params.ends_at = ends_at;

        const result = await getSeamClient().accessCodes.createMultiple(params);

        return {
          status: "success",
          message: `Created access code '${name}' on ${targetDeviceIds.length} lock(s)`,
          access_codes: result.access_codes.map((ac: any) => ({
            access_code_id: ac.access_code_id,
            code: ac.code,
            name: ac.name,
            device_id: ac.device_id,
            starts_at: ac.starts_at,
            ends_at: ac.ends_at,
            status: ac.status,
          })),
          total_codes_created: result.access_codes.length,
        };
      } catch (error) {
        throw new Error(`Failed to create access codes: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register list_access_codes tool
  server.tool(
    "list_access_codes",
    "List all access codes, optionally filtered by device",
    {
      device_id: z.string().optional().describe("Optional: filter by specific device ID"),
    },
    async ({ device_id }) => {
      try {
        const params: any = {};
        if (device_id) params.device_id = device_id;

        const codes = await getSeamClient().accessCodes.list(params);

        return {
          total_codes: codes.length,
          access_codes: codes.map((code: any) => ({
            access_code_id: code.access_code_id,
            device_id: code.device_id,
            name: code.name,
            code: code.code,
            starts_at: code.starts_at,
            ends_at: code.ends_at,
            status: code.status,
            type: code.type,
          })),
        };
      } catch (error) {
        throw new Error(`Failed to list access codes: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register delete_access_code tool
  server.tool(
    "delete_access_code",
    "Delete an access code from a lock",
    {
      access_code_id: z.string().describe("The ID of the access code to delete"),
    },
    async ({ access_code_id }) => {
      try {
        await getSeamClient().accessCodes.delete({ access_code_id });

        return {
          status: "success",
          message: `Successfully deleted access code ${access_code_id}`,
        };
      } catch (error) {
        throw new Error(`Failed to delete access code: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Register update_access_code tool
  server.tool(
    "update_access_code",
    "Update an existing access code (change name, code, or time limits)",
    {
      access_code_id: z.string().describe("The ID of the access code to update"),
      name: z.string().optional().describe("New name for the access code"),
      code: z.string().optional().describe("New PIN code"),
      starts_at: z.string().optional().describe("New start time (ISO 8601 format)"),
      ends_at: z.string().optional().describe("New end time (ISO 8601 format)"),
    },
    async ({ access_code_id, name, code, starts_at, ends_at }) => {
      try {
        const params: any = { access_code_id };

        if (name) params.name = name;
        if (code) params.code = code;
        if (starts_at) params.starts_at = starts_at;
        if (ends_at) params.ends_at = ends_at;

        await getSeamClient().accessCodes.update(params);

        return {
          status: "success",
          message: `Successfully updated access code ${access_code_id}`,
        };
      } catch (error) {
        throw new Error(`Failed to update access code: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // Return the server object (Smithery CLI handles transport)
  return server.server;
}
