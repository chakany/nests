/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NDKUser } from '@nostr-dev-kit/ndk';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Kinds {
    export const NEST_INFO = 38001;
    export const NEST_METADATA = 38002;
    export const NEST_PRESENCE = 38003;
}
export interface RoomMember {
    user: NDKUser;
    present: boolean;
    handRaised: boolean;
    lastUpdated: Date;
}
export interface StageMember {
    lastSeen: Date; // default to now upon loading for reasons
    lastOnStageTime: Date;
    lastOnStage: boolean;
    hasPersistentAccess: boolean;
}
