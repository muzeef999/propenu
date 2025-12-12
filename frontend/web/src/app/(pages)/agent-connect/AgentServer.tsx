import { getAgentConnect } from "@/data/serverData";
import { AgentConnect } from "@/types";
import { JSX } from "react";
import AgentsList from "./AgentCard";
import AgentsConnectPage from "./page";
export interface AgentResponse {
  items?: AgentConnect[];
  [key: string]: any;
}

export default async function AgentServer(): Promise<JSX.Element> {
  try {

    const data = await getAgentConnect();
    const typedData = data as AgentResponse | undefined;
    const items = typedData?.items ?? [];
    console.log(items);
     
    if (!items.length) {
      return (
        <div>
          <h3>Agents are not found</h3>
        </div>
      );
    }
    return <AgentsList Agent={items} />

} catch (err: any) {
    return (
      <div>Error loading agents: {String(err?.message ?? err)}</div>
    );
  }
}
