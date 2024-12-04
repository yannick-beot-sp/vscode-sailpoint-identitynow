export interface Observer<EventType, MessageType> {
    update(t: EventType, message: MessageType): void | Promise<void>;
}