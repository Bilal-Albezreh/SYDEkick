import { getMySquads } from "@/app/actions/squads";
import GroupZeroState from "@/components/groups/GroupZeroState";
import GroupDashboard from "@/components/groups/GroupDashboard";

export default async function GroupsPage() {
    const result = await getMySquads();

    // Error state
    if (!result.success) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-500/10 backdrop-blur-xl border border-red-400/20 rounded-2xl p-6 max-w-md text-center">
                    <p className="text-red-400 font-medium">Failed to load group</p>
                    <p className="text-white/40 text-sm mt-2">{result.error}</p>
                </div>
            </div>
        );
    }

    const groups = result.squads || [];

    // Zero State: No group
    if (groups.length === 0) {
        return <GroupZeroState />;
    }

    // Active Group Dashboard
    // Since we enforce single group membership, there will only be 1 group
    const group = groups[0];

    return <GroupDashboard group={group} />;
}
