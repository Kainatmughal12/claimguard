import { z } from "zod";
import { tool } from "langchain";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ClientProfile } from "@/lib/types";

const schema = z.object({
  clientId: z.string().uuid().describe("The client's id (uuid)."),
});

export const getClientProfile = tool(
  async ({ clientId }): Promise<ClientProfile> => {
    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("name, specialty, state, brand_tone")
      .eq("id", clientId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load client ${clientId}: ${error.message}`);
    }
    if (!data) {
      throw new Error(`No client found with id ${clientId}`);
    }

    return {
      name: data.name,
      specialty: data.specialty,
      state: data.state,
      brandTone: data.brand_tone,
    };
  },
  {
    name: "getClientProfile",
    description:
      "Load a client's name, specialty, state, and brand tone by client id. Call this first, before reviewing any copy.",
    schema,
  },
);
