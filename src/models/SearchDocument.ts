/**
 * Search documents returned by the ISC search API (`searchdocuments` oneOf).
 * These types are not exported by sailpoint-api-client.
 */

export type SearchDocumentType =
  | "accessprofile"
  | "accountactivity"
  | "entitlement"
  | "event"
  | "identity"
  | "role";

export interface SearchIndexMeta {
  pod?: string;
  org?: string;
  _version?: string;
}

export interface IndexedSearchDocument<TType extends SearchDocumentType = SearchDocumentType>
  extends SearchIndexMeta {
  _type?: TType;
  type?: TType;
}

export interface Reference {
  id?: string;
  name?: string;
}

export interface DisplayReference extends Reference {
  displayName?: string;
}

export interface BaseDocument {
  id: string;
  name: string;
}

export interface BaseSegment {
  id?: string;
  name?: string;
}

export interface AccessOwner {
  type?: "IDENTITY";
  id?: string;
  name?: string;
  email?: string;
}

export interface BaseAccess {
  description?: string;
  created?: string | null;
  modified?: string | null;
  synced?: string | null;
  enabled?: boolean;
  requestable?: boolean;
  requestCommentsRequired?: boolean;
  owner?: AccessOwner;
}

export interface BaseEntitlement {
  hasPermissions?: boolean;
  description?: string | null;
  attribute?: string;
  value?: string;
  schema?: string;
  privileged?: boolean;
  id?: string;
  name?: string;
}

export interface BaseAccessProfile {
  id?: string;
  name?: string;
}

export interface AccessApp {
  id?: string;
  name?: string;
  description?: string;
  owner?: AccessOwner;
}

export interface AccessProfileDocument extends BaseAccess, IndexedSearchDocument<"accessprofile"> {
  id: string;
  name: string;
  source?: Reference;
  entitlements?: BaseEntitlement[];
  entitlementCount?: number;
  segments?: BaseSegment[];
  segmentCount?: number;
  tags?: string[];
  apps?: AccessApp[];
}

export interface ActivityIdentity extends Reference {
  type?: string;
}

export interface AccountSource extends Reference {
  type?: string;
}

export interface ApprovalComment {
  comment?: string;
  commenter?: string;
  date?: string | null;
}

export interface AttributeRequest {
  name?: string;
  op?: string;
  value?: string | string[];
}

export interface Approval {
  comments?: ApprovalComment[];
  modified?: string | null;
  owner?: ActivityIdentity;
  result?: string;
  attributeRequest?: AttributeRequest;
  source?: AccountSource;
}

export interface AccountActivityRequestResult {
  status?: string;
}

export interface OriginalRequest {
  accountId?: string;
  result?: AccountActivityRequestResult;
  attributeRequests?: AttributeRequest[];
  op?: string;
  source?: AccountSource;
}

export interface ExpansionItem {
  accountId?: string;
  cause?: string;
  name?: string;
  attributeRequest?: AttributeRequest;
  source?: AccountSource;
  id?: string;
  state?: string;
}

export interface AccountRequestResult {
  errors?: string[];
  status?: string;
  ticketId?: string | null;
}

export interface AccountRequest {
  accountId?: string;
  attributeRequests?: AttributeRequest[];
  op?: string;
  provisioningTarget?: AccountSource;
  result?: AccountRequestResult;
  source?: AccountSource;
}

export interface AccountActivityDocument extends IndexedSearchDocument<"accountactivity"> {
  id?: string;
  action?: string;
  created?: string | null;
  modified?: string | null;
  synced?: string;
  stage?: string;
  status?: string;
  requester?: ActivityIdentity;
  recipient?: ActivityIdentity;
  trackingNumber?: string;
  errors?: string[] | null;
  warnings?: string[] | null;
  approvals?: Approval[];
  originalRequests?: OriginalRequest[];
  expansionItems?: ExpansionItem[];
  accountRequests?: AccountRequest[];
  sources?: string;
}

export interface EntitlementSource extends Reference {
  type?: string;
}

export interface EntitlementPermission {
  target?: string;
  rights?: string[];
}

export interface ManuallyUpdatedFields {
  DESCRIPTION?: boolean;
  DISPLAY_NAME?: boolean;
}

export interface EntitlementDocument extends BaseDocument, IndexedSearchDocument<"entitlement"> {
  modified?: string | null;
  synced?: string;
  displayName?: string;
  source?: EntitlementSource;
  segments?: BaseSegment[];
  segmentCount?: number;
  requestable?: boolean;
  cloudGoverned?: boolean;
  created?: string | null;
  privileged?: boolean;
  tags?: string[];
  attribute?: string;
  value?: string;
  sourceSchemaObjectType?: string;
  schema?: string;
  hash?: string;
  attributes?: Record<string, unknown>;
  truncatedAttributes?: string[];
  containsDataAccess?: boolean;
  manuallyUpdatedFields?: ManuallyUpdatedFields | null;
  permissions?: EntitlementPermission[];
}

export interface EventActor {
  name?: string;
}

export interface EventTarget {
  name?: string;
}

export interface EventDocument extends SearchIndexMeta {
  id?: string;
  name?: string;
  created?: string | null;
  synced?: string;
  action?: string;
  /** Event type, distinct from the search document type carried by `_type`. */
  type?: string;
  actor?: EventActor;
  target?: EventTarget;
  stack?: string;
  trackingNumber?: string;
  ipAddress?: string;
  details?: string;
  attributes?: Record<string, unknown>;
  objects?: string[];
  operation?: string;
  status?: string;
  technicalName?: string;
  _type?: "event";
}

export interface ProcessingDetails {
  date?: string | null;
  stage?: string;
  retryCount?: number;
  stackTrace?: string;
  message?: string;
}

export interface BaseAccount extends Reference {
  accountId?: string;
  source?: AccountSource;
  disabled?: boolean;
  locked?: boolean;
  privileged?: boolean;
  manuallyCorrelated?: boolean;
  passwordLastSet?: string | null;
  entitlementAttributes?: Record<string, unknown> | null;
  created?: string | null;
  supportsPasswordChange?: boolean;
  accountAttributes?: Record<string, unknown> | null;
}

export interface IdentityAppAccount {
  id?: string;
  accountId?: string;
}

export interface IdentityApp extends Reference {
  source?: Reference;
  account?: IdentityAppAccount;
}

export interface Access extends DisplayReference {
  description?: string | null;
}

export interface AccessProfileSummary extends Access {
  type?: string;
  source?: Reference;
  owner?: DisplayReference;
  revocable?: boolean;
}

export interface AccessProfileEntitlement extends Access {
  source?: Reference;
  type?: string;
  privileged?: boolean;
  attribute?: string;
  value?: string;
  standalone?: boolean;
}

export interface AccessProfileRole extends Access {
  type?: string;
  owner?: DisplayReference;
  disabled?: boolean;
  revocable?: boolean;
}

export type IdentityAccess = AccessProfileSummary | AccessProfileEntitlement | AccessProfileRole;

export interface Owns {
  sources?: Reference[];
  entitlements?: Reference[];
  accessProfiles?: Reference[];
  roles?: Reference[];
  apps?: Reference[];
  governanceGroups?: Reference[];
  fallbackApprover?: boolean;
}

export interface IdentityDocument extends BaseDocument, IndexedSearchDocument<"identity"> {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  created?: string | null;
  modified?: string | null;
  phone?: string;
  synced?: string;
  inactive?: boolean;
  protected?: boolean;
  status?: string;
  employeeNumber?: string;
  manager?: DisplayReference | null;
  isManager?: boolean;
  identityProfile?: Reference;
  source?: Reference;
  attributes?: Record<string, unknown>;
  disabled?: boolean;
  locked?: boolean;
  processingState?: string | null;
  processingDetails?: ProcessingDetails | null;
  accounts?: BaseAccount[];
  accountCount?: number;
  apps?: IdentityApp[];
  appCount?: number;
  access?: IdentityAccess[];
  accessCount?: number;
  entitlementCount?: number;
  roleCount?: number;
  accessProfileCount?: number;
  owns?: Owns[];
  ownsCount?: number;
  tags?: string[];
  tagsCount?: number;
  visibleSegments?: string[] | null;
  visibleSegmentCount?: number;
}

export interface RoleEntitlement extends BaseEntitlement {
  sourceSchemaObjectType?: string;
  hash?: string;
}

export interface RoleDimensionAttribute {
  derived?: boolean;
  displayName?: string;
  name?: string;
}

export interface RoleDimension {
  id?: string;
  name?: string;
  description?: string | null;
  entitlements?: RoleEntitlement[] | null;
  accessProfiles?: BaseAccessProfile[] | null;
}

export interface RoleDocument extends BaseAccess, IndexedSearchDocument<"role"> {
  id: string;
  name: string;
  accessProfiles?: BaseAccessProfile[] | null;
  accessProfileCount?: number | null;
  tags?: string[] | null;
  segments?: BaseSegment[] | null;
  segmentCount?: number | null;
  entitlements?: RoleEntitlement[] | null;
  entitlementCount?: number | null;
  dimensional?: boolean;
  dimensionSchemaAttributeCount?: number | null;
  dimensionSchemaAttributes?: RoleDimensionAttribute[] | null;
  dimensions?: RoleDimension[] | null;
}

export type SearchDocument =
  | AccessProfileDocument
  | AccountActivityDocument
  | EntitlementDocument
  | EventDocument
  | IdentityDocument
  | RoleDocument;
