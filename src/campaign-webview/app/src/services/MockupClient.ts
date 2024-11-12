import type { FetchOptions, PaginatedData } from "../lib/datatable/Model";
import type { Client, KPIs, Reviewer, TotalAccessItems, Totals } from "./Client";

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function stall() {
    const stallTime = getRandomInt(500, 3000);
    await new Promise((resolve) => setTimeout(resolve, stallTime));
}
const firstNames = [
    "Emma",
    "James",
    "Sophia",
    "Michael",
    "Olivia",
    "William",
    "Ava",
    "John",
    "Isabella",
    "David",
];
const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
];
const statuses = ["Active", "Inactive"];
function generateDummyReviewers(count: number): Reviewer[] {
    let i = 0;
    return Array(count)
        .fill(null)
        .map(() => {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const phase = statuses[Math.floor(Math.random() * statuses.length)];
            const email = `${firstName}.${lastName}@example.com`.toLowerCase()
            return {
                id: ++i + '',
                name: `${firstName} ${lastName}`,
                phase,
                email
            };
        });
}

export class MockupClient implements Client {

    private readonly reviewers: Reviewer[]
    private readonly count = 35
    /**
     *
     */
    constructor() {
        this.reviewers = generateDummyReviewers(this.count);
    }

    async getReviewers(fetchOptions: FetchOptions): Promise<PaginatedData<Reviewer>> {
        const offset = fetchOptions.currentPage * fetchOptions.pageSize;
        const end = Math.min(((fetchOptions.currentPage + 1) * fetchOptions.pageSize), this.count);
        const result = this.reviewers.slice(offset, end);
        // console.log({ offset, result });
        return {
            data: result,
            count: this.count,
        };
    }

    async getKPIs(): Promise<KPIs> {
        await stall()
        let totalsTmp = {
            totalAccessReviews: getRandomInt(50, 200),
            totalIdentities: getRandomInt(50, 200),
            totalAccessItems: getRandomInt(50, 200),

        }

        const totals: Totals = {
            ...totalsTmp,
            ...{
                totalAccessReviewsCompleted: getRandomInt(10, totalsTmp.totalAccessReviews),
                totalIdentitiesCompleted: getRandomInt(10, totalsTmp.totalIdentities),
                totalAccessItemsCompleted: getRandomInt(10, totalsTmp.totalAccessItems),
            }
        }

        const totalAccessItems: TotalAccessItems = {
            entitlementDecisionsMade: getRandomInt(0, 30),
            entitlementsApproved: getRandomInt(0, 30),
            entitlementsRevoked: getRandomInt(0, 30),
            entitlementDecisionsTotal: getRandomInt(0, 30),
            accessProfileDecisionsTotal: getRandomInt(0, 30),
            accessProfileDecisionsMade: getRandomInt(0, 30),
            accessProfilesApproved: getRandomInt(0, 30),
            accessProfilesRevoked: getRandomInt(0, 30),
            roleDecisionsMade: getRandomInt(0, 30),
            roleDecisionsTotal: getRandomInt(0, 30),
            rolesApproved: getRandomInt(0, 30),
            rolesRevoked: getRandomInt(0, 30),
            accountDecisionsTotal: getRandomInt(0, 30),
            accountDecisionsMade: getRandomInt(0, 30),
            accountsApproved: getRandomInt(0, 30),
            accountsRevoked: getRandomInt(0, 30),
        }

        return { totals, totalAccessItems };
    }

}