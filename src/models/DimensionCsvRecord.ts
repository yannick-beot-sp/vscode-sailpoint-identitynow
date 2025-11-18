/**
 * A Dimension as exported to CSV
 */
export interface DimensionCSVRecord {
    /**
     * The human-readable display name of the Dimension
     * @type {string}
     * @memberof Dimension
     */
    'name': string;

    /**
     * A human-readable description of the Dimension
     * @type {string}
     * @memberof Dimension
     */
    'description'?: string;
    /**
     *
     * @type {Array<AccessProfileRef>}
     * @memberof Dimension
     */
    'accessProfiles'?: string;
    'entitlements'?: string;

    /**
     * String representation of the membership criteria
     */
    membershipCriteria?: string;

    roleName: string
}