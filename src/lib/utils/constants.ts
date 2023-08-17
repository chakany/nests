import type { Kind } from 'nostr-tools';
import type { NDKUser } from "@nostr-dev-kit/ndk";
export namespace Kinds {
    export const NEST_INFO = 38001 as Kind;
    export const NEST_METADATA = 38002 as Kind;
    export const NEST_PRESENCE = 38003 as Kind;
}
export interface RoomMember {
    user: NDKUser,
    present: boolean,
    handRaised: boolean,
    lastUpdated: Date
}
export interface StageMember {
    lastSeen: Date, // default to now upon loading for reasons
    lastOnStageTime: Date,
    lastOnStage: boolean,
    hasPersistentAccess: boolean
}