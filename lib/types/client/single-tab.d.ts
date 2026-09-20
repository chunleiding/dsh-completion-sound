/**
 * Coordinates a single leader among the browser tabs open on this origin.
 * `isLeader()` reflects the current decision; call `start()` once during
 * plugin setup and `stop()` on teardown.
 */
export declare class SingleTabCoordinator {
    /** Whether this tab currently holds leadership. Defaults to true until the first election. */
    private leading;
    private beatTimer;
    private readonly onStorage;
    private readonly onVisibility;
    private readonly onPageHide;
    /**
     * Begin heartbeating and listening for other tabs' claims. The first
     * election runs immediately so `isLeader()` is settled before any cue.
     */
    start(): void;
    /** Stop heartbeating, detach listeners, and hand the claim to another tab if we held it. */
    stop(): void;
    /** Whether this tab is currently the elected leader and may fire cues. */
    isLeader(): boolean;
    /**
     * Re-run the election against the shared claim record.
     *
     * A tie between two tabs that both started without seeing a leader can end
     * with both demoting themselves (each saw the other's claim and yielded),
     * leaving zero leaders and silencing every cue. To prevent that, when both
     * tabs are equally eligible the lower `tabId` always wins — so the conflict
     * resolves to exactly one leader instead of a deadlock.
     */
    private elect;
}
//# sourceMappingURL=single-tab.d.ts.map